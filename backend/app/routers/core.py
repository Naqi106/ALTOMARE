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
    RevenueSummary, NotifyRequest,
)
from app.mock_data import MOCK_REVENUE_SUMMARY

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

        data = reading.dict(exclude={"timestamp"})
        data["bacteria_cfu"] = bacteria_cfu
        return QualityReading(reading_id=reading_id, timestamp=timestamp, **data)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save quality reading: {str(e)}")
    finally:
        db.close()


# ---------- 5. GET /correlation/{zone_id} — NOW LIVE ----------
@router.get("/correlation/{zone_id}", response_model=CorrelationEvent)
def get_correlation(zone_id: str):
    """
    Get the most recent leak-quality correlation status for a zone.
    Reads from Palak's Supabase 'correlation_events' table.
    """
    db = next(get_db())
    try:
        result = db.execute(
            text("""
                SELECT event_id, zone_id, leak_alert_id, quality_reading_id,
                       leak_caused_contamination, risk_level
                FROM correlation_events
                WHERE zone_id = :zone_id
                ORDER BY created_at DESC
                LIMIT 1
            """),
            {"zone_id": zone_id},
        )
        row = result.mappings().first()
        if not row:
            raise HTTPException(status_code=404, detail=f"No correlation data for {zone_id} yet")
        return CorrelationEvent(**dict(row))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch correlation data: {str(e)}")
    finally:
        db.close()


# ---------- 6. GET /revenue/summary (still mock — Piyush's module, Day 4) ----------
@router.get("/revenue/summary", response_model=RevenueSummary)
def get_revenue_summary():
    """TODO Day 4: replace with Piyush's live revenue_log aggregation."""
    return MOCK_REVENUE_SUMMARY


# ---------- 7. POST /alerts/notify (still mock — Piyush's module, Day 4) ----------
@router.post("/alerts/notify")
def notify_alert(request: NotifyRequest):
    """TODO Day 4: wire to Piyush's Twilio/WhatsApp sandbox trigger."""
    return {
        "status": "queued (mock - not actually sent yet)",
        "alert_id": request.alert_id,
        "channel": request.channel,
    }
