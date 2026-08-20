"""
The 7 core endpoints from Section 11.2 of the Master Execution Document.

DAY 3 STATE:
- GET /zones                -> LIVE (Ayantika's zones table)
- POST /readings             -> LIVE (writes to raw_readings)
- GET /alerts                -> LIVE (Kushagra's leak_alerts table)
- POST /quality              -> LIVE (writes to quality_readings)
- GET /correlation/{zone_id} -> LIVE (Palak's correlation_events table)
- GET /revenue/summary       -> still mock, Piyush's module (Day 4)
- POST /alerts/notify        -> still mock, Piyush's Twilio/WhatsApp trigger (Day 4)
"""

from datetime import datetime
from fastapi import APIRouter, HTTPException
from sqlalchemy import text

from app.db import get_db
from app.models import (
    Zone, RawReadingIn, RawReading, LeakAlert,
    QualityReadingIn, QualityReading, CorrelationEvent,
    RevenueSummary, RevenueLogEntry, NotifyRequest, NRWSummary,
)
from app.engines.revenue import calculate_revenue_recovered
from app.alerts.notify import send_alert, format_alert_message
from app.engines.latios import find_correlations_for_zone
from app.engines.latias import process_zone

router = APIRouter()


# ---------- 1. GET /zones — NOW LIVE ----------
@router.get("/zones", response_model=list[Zone])
def get_zones():
    """
    List all zones with current status.
    Pulls real data from Ayantika's Supabase 'zones' table.
    """
    db = next(get_db())
    try:
        result = db.execute(text("""
            SELECT zone_id, name, pipe_age_years, population, data_level
            FROM zones
            ORDER BY zone_id;
        """))
        zones = [
            Zone(
                zone_id=row.zone_id,
                name=row.name,
                pipe_age_years=row.pipe_age_years,
                population=row.population,
                data_level=row.data_level if row.data_level is not None else 0,
            )
            for row in result
        ]
        return zones
    finally:
        db.close()


# ---------- 2. POST /readings — NOW LIVE ----------
@router.post("/readings", response_model=RawReading)
def post_reading(reading: RawReadingIn):
    """
    Ingest a new raw reading (sensor or manual).
    Writes into Ayantika's Supabase 'raw_readings' table.
    """
    db = next(get_db())
    try:
        timestamp = reading.timestamp or datetime.utcnow()

        # reading_id is an auto-increment integer column in Supabase (not a
        # string we generate) — omit it from the INSERT and let Postgres
        # assign it, then read it back via RETURNING.
        result = db.execute(
            text("""
                INSERT INTO raw_readings (zone_id, type, value, unit, source, timestamp)
                VALUES (:zone_id, :type, :value, :unit, :source, :timestamp)
                RETURNING reading_id
            """),
            {
                "zone_id": reading.zone_id,
                "type": reading.type,
                "value": reading.value,
                "unit": reading.unit,
                "source": reading.source,
                "timestamp": timestamp,
            },
        )
        reading_id = result.scalar()
        db.commit()

        return RawReading(
            reading_id=reading_id,
            timestamp=timestamp,
            **reading.dict(exclude={"timestamp"}),
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save reading: {str(e)}")
    finally:
        db.close()



# ---------- 3. GET /alerts (wired to Kushagra's live leak_alerts table) ----------
@router.get("/alerts", response_model=list[LeakAlert])
def get_alerts(zone_id: str | None = None, status: str | None = None):
    """
    Reads from Kushagra's leak_alerts table (Supabase).
    Optional filters: zone_id, status.
    """
    db = next(get_db())
    try:
        query = "SELECT alert_id, zone_id, estimated_loss_litres, confidence_score, method, timestamp, status FROM leak_alerts WHERE 1=1"
        params = {}
        if zone_id:
            query += " AND zone_id = :zone_id"
            params["zone_id"] = zone_id
        if status:
            query += " AND status = :status"
            params["status"] = status
        query += " ORDER BY timestamp DESC"

        result = db.execute(text(query), params)
        rows = result.mappings().all()
        return [LeakAlert(**dict(row)) for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch alerts: {str(e)}")
    finally:
        db.close()


# ---------- 3b. POST /detect/{zone_id} — ADDITION beyond the original 7-endpoint
# contract. Triggers Kushagra's Latias engine to actually run detection for a
# zone and write a new row to leak_alerts, instead of leak_alerts only ever
# being populated by someone manually running his script. Without this, GET
# /alerts has nothing to show even though the detection logic works.
@router.post("/detect/{zone_id}", response_model=LeakAlert | None)
def trigger_detection(zone_id: str, authorized_unbilled_litres: float = 0):
    """
    Runs Kushagra's water-balance detection for one zone right now.
    Returns the new LeakAlert if loss was detected, or null if the zone's
    water balance shows no loss (or if inflow/billing data is missing).
    """
    try:
        alert = process_zone(zone_id, authorized_unbilled_litres)
        return alert
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection failed for {zone_id}: {str(e)}")


# ---------- 4. POST /quality — NOW LIVE ----------
@router.post("/quality", response_model=QualityReading)
def post_quality(reading: QualityReadingIn):
    """
    Ingest a new water-quality reading.
    Writes into Ayantika's Supabase 'quality_readings' table.
    """
    db = next(get_db())
    try:
        timestamp = reading.timestamp or datetime.utcnow()

        # bacteria_cfu is an INT column in Supabase; the Pydantic model
        # accepts a float from the caller (some field kits report decimals),
        # so cast to int right before the insert to match the column type.
        bacteria_cfu = int(reading.bacteria_cfu) if reading.bacteria_cfu is not None else None

        result = db.execute(
            text("""
                INSERT INTO quality_readings
                    (zone_id, ph, turbidity, tds, chlorine, bacteria_cfu, hardness, timestamp, source)
                VALUES
                    (:zone_id, :ph, :turbidity, :tds, :chlorine, :bacteria_cfu, :hardness, :timestamp, :source)
                RETURNING reading_id
            """),
            {
                "zone_id": reading.zone_id,
                "ph": reading.ph,
                "turbidity": reading.turbidity,
                "tds": reading.tds,
                "chlorine": reading.chlorine,
                "bacteria_cfu": bacteria_cfu,
                "hardness": reading.hardness,
                "timestamp": timestamp,
                "source": reading.source,
            },
        )
        reading_id = result.scalar()
        db.commit()
        try:
            find_correlations_for_zone(reading.zone_id)
        except Exception as e:
            print(f"[correlation check failed, non-fatal] {e}")
        data = reading.dict(exclude={"timestamp"})
        data["bacteria_cfu"] = bacteria_cfu
        return QualityReading(reading_id=reading_id, timestamp=timestamp, **data)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save quality reading: {str(e)}")
    finally:
        db.close()


# ---------- 5. GET /correlation/{zone_id} — NOW LIVE ----------
@router.get("/correlation/{zone_id}", response_model=CorrelationEvent | None)
def get_correlation(zone_id: str):
    """
    Get the most recent leak-quality correlation status for a zone.
    Reads from Palak's Supabase 'correlation_events' table.
    Returns null (200) if no correlation exists yet — this is a normal,
    expected state (most zones won't have one until a leak + bad quality
    reading line up), not an error condition.
    """
    db = next(get_db())
    try:
        result = db.execute(
            text("""
                    SELECT event_id, zone_id, leak_alert_id, quality_reading_id,
                        leak_caused_contamination, risk_level
                    FROM correlation_events
                    WHERE zone_id = :zone_id
                    ORDER BY event_id DESC
                    LIMIT 1
                """),
                {"zone_id": zone_id},
        )
        row = result.mappings().first()
        if not row:
            return None
        return CorrelationEvent(**dict(row))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch correlation data: {str(e)}")
    finally:
        db.close()


# ---------- 5b. GET /nrw/summary — ADDITION beyond the original 7-endpoint
# contract. Computes real NRW% per zone and overall, from actual inflow vs
# billed data (Section 2/5 formula), instead of a hardcoded dashboard number.
@router.get("/nrw/summary", response_model=NRWSummary)
def get_nrw_summary():
    """
    NRW% = (Inflow - Billed) / Inflow x 100, per zone and aggregated overall.
    Zones with no inflow readings yet are skipped (can't divide by zero),
    not shown as a false 0%.
    """
    db = next(get_db())
    try:
        inflow_rows = db.execute(
            text("SELECT zone_id, SUM(value) AS total_inflow FROM raw_readings WHERE type = 'inflow' GROUP BY zone_id")
        ).mappings().all()
        billed_rows = db.execute(
            text("SELECT zone_id, SUM(billed_litres) AS total_billed FROM billing_records GROUP BY zone_id")
        ).mappings().all()

        inflow_by_zone = {row["zone_id"]: float(row["total_inflow"] or 0) for row in inflow_rows}
        billed_by_zone = {row["zone_id"]: float(row["total_billed"] or 0) for row in billed_rows}

        by_zone: dict[str, float] = {}
        total_inflow = 0.0
        total_loss = 0.0

        for zone_id, inflow in inflow_by_zone.items():
            if inflow <= 0:
                continue  # can't compute a percentage against zero inflow
            billed = billed_by_zone.get(zone_id, 0.0)
            loss = max(inflow - billed, 0.0)  # floor at 0 - can't have negative loss
            by_zone[zone_id] = round((loss / inflow) * 100, 1)
            total_inflow += inflow
            total_loss += loss

        total_nrw_percent = round((total_loss / total_inflow) * 100, 1) if total_inflow > 0 else 0.0

        return NRWSummary(total_nrw_percent=total_nrw_percent, by_zone=by_zone)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compute NRW summary: {str(e)}")
    finally:
        db.close()


# ---------- 6. GET /revenue/summary — NOW LIVE ----------
@router.get("/revenue/summary", response_model=RevenueSummary)
def get_revenue_summary():
    """
    Aggregates Piyush's revenue_log table: running total + per-zone breakdown.
    """
    db = next(get_db())
    try:
        result = db.execute(
            text("SELECT zone_id, SUM(amount_recovered) AS zone_total FROM revenue_log GROUP BY zone_id")
        )
        rows = result.mappings().all()
        by_zone = {row["zone_id"]: float(row["zone_total"]) for row in rows}
        total_recovered = round(sum(by_zone.values()), 2)
        return RevenueSummary(total_recovered=total_recovered, by_zone=by_zone)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch revenue summary: {str(e)}")
    finally:
        db.close()


# ---------- 6b. POST /revenue/recover — ADDITION beyond the original 7-endpoint
# contract. Lets a resolved leak_alert actually generate a revenue_log entry
# using the Section 7.2 formula, instead of relying on manually seeded rows.
# Flag this to the team since it's not in Section 11.2 as originally locked.
@router.post("/revenue/recover", response_model=RevenueLogEntry)
def record_revenue_recovered(zone_id: str, leak_alert_id: int, litres_recovered: float, billing_cycle: str):
    """
    Marks a fix as having recovered water for a zone: calculates the money
    value (Section 7.2) and logs it to revenue_log.
    """
    db = next(get_db())
    try:
        amount_recovered = calculate_revenue_recovered(litres_recovered)

        result = db.execute(
            text("""
                INSERT INTO revenue_log (zone_id, leak_alert_id, litres_recovered, amount_recovered, billing_cycle)
                VALUES (:zone_id, :leak_alert_id, :litres_recovered, :amount_recovered, :billing_cycle)
                RETURNING log_id
            """),
            {
                "zone_id": zone_id,
                "leak_alert_id": leak_alert_id,
                "litres_recovered": litres_recovered,
                "amount_recovered": amount_recovered,
                "billing_cycle": billing_cycle,
            },
        )
        log_id = result.scalar()
        db.commit()

        return RevenueLogEntry(
            log_id=log_id, zone_id=zone_id, leak_alert_id=leak_alert_id,
            litres_recovered=litres_recovered, amount_recovered=amount_recovered,
            billing_cycle=billing_cycle,
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to record revenue: {str(e)}")
    finally:
        db.close()


# ---------- 7. POST /alerts/notify — NOW LIVE (with safe fallback) ----------
@router.post("/alerts/notify")
def notify_alert(request: NotifyRequest):
    """
    Looks up the alert, formats a message, sends via Twilio/WhatsApp if
    credentials are configured — otherwise logs what WOULD be sent, so the
    demo doesn't break if the sandbox isn't set up yet.
    """
    db = next(get_db())
    try:
        result = db.execute(
            text("SELECT alert_id, zone_id, estimated_loss_litres, confidence_score, method, status FROM leak_alerts WHERE alert_id = :alert_id"),
            {"alert_id": request.alert_id},
        )
        row = result.mappings().first()
        if not row:
            raise HTTPException(status_code=404, detail=f"No alert with id {request.alert_id}")

        message = format_alert_message(dict(row))
        delivery = send_alert(alert_id=request.alert_id, message=message, channel=request.channel)
        return delivery
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send alert: {str(e)}")
    finally:
        db.close()

from app.engines.latias import flag_anomalous_households, simulate_ppa, estimate_leak_location
import pandas as pd
@router.get("/audit/billing/{zone_id}")
def get_billing_audit(zone_id: str):
    """Ranked list of suspected theft/tampering households for a zone (Section 7.1)."""
    db = next(get_db())
    try:
        rows = db.execute(
            text("SELECT household_id, billed_litres, benchmark_litres FROM billing_records WHERE zone_id = :z"),
            {"z": zone_id},
        ).mappings().all()
        if not rows:
            return {"zone_id": zone_id, "flagged": []}
        df = pd.DataFrame(rows)
        flagged = flag_anomalous_households(df)
        return {"zone_id": zone_id, "flagged": flagged.to_dict(orient="records")}
    finally:
        db.close()

@router.get("/audit/ppa/{zone_id}")
def get_ppa_location(zone_id: str, leak_position_m: float = 320):
    """Simulated pressure-point analysis narrowing a leak's location within a zone (Section 6)."""
    sensors = [0, 150, 300, 450]
    readings = simulate_ppa(sensors, leak_position_m=leak_position_m)
    estimated = estimate_leak_location(readings)
    return {"zone_id": zone_id, "sensor_readings": readings, "estimated_leak_position_m": estimated}        