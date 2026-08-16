"""
The 7 core endpoints from Section 11.2 of the Master Execution Document.

DAY 2 STATE:
- GET /zones       -> NOW WIRED to real Supabase data (Ayantika's zones table)
- POST /readings   -> NOW WIRED to real Supabase data (writes to raw_readings table)
- Everything else still returns mock data from mock_data.py, pending each
  owner's module being ready:
    GET /alerts               -> Kushagra's leak_alerts (Day 3)
    POST /quality              -> Palak's quality_readings (Day 2, her side)
    GET /correlation/{zone_id} -> Palak's correlation_events (Day 3)
    GET /revenue/summary       -> Piyush's revenue_log aggregation (Day 4)
    POST /alerts/notify        -> Piyush's Twilio/WhatsApp trigger (Day 4)
"""

import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException
from sqlalchemy import text

from app.db import get_db
from app.models import (
    Zone, RawReadingIn, RawReading, LeakAlert,
    QualityReadingIn, QualityReading, CorrelationEvent,
    RevenueSummary, NotifyRequest,
)
from app.mock_data import (
    MOCK_ALERTS, MOCK_CORRELATIONS, MOCK_REVENUE_SUMMARY,
)

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


# ---------- 3. GET /alerts (still mock — Kushagra's module, Day 3) ----------
@router.get("/alerts", response_model=list[LeakAlert])
def get_alerts(zone_id: str | None = None, status: str | None = None):
    """TODO Day 3: replace with Kushagra's live leak_alerts table query."""
    results = MOCK_ALERTS
    if zone_id:
        results = [a for a in results if a["zone_id"] == zone_id]
    if status:
        results = [a for a in results if a["status"] == status]
    return results


# ---------- 4. POST /quality (still mock — Palak's module) ----------
@router.post("/quality", response_model=QualityReading)
def post_quality(reading: QualityReadingIn):
    """TODO: wire to Palak's quality_readings insert logic once her engine is ready."""
    return QualityReading(
        reading_id=str(uuid.uuid4())[:8],
        timestamp=reading.timestamp or datetime.utcnow(),
        **reading.dict(exclude={"timestamp"}),
    )


# ---------- 5. GET /correlation/{zone_id} (still mock — Palak's module, Day 3) ----------
@router.get("/correlation/{zone_id}", response_model=CorrelationEvent)
def get_correlation(zone_id: str):
    """TODO Day 3: replace with Palak's live correlation_events query."""
    result = MOCK_CORRELATIONS.get(zone_id)
    if not result:
        raise HTTPException(status_code=404, detail=f"No correlation data for {zone_id} yet")
    return result


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
