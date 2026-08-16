"""
The 7 core endpoints from Section 11.2 of the Master Execution Document.

DAY 1 STATE: all return mock data from mock_data.py so Aryan (frontend)
and the rest of the team can start building against a stable contract
immediately, without waiting for Ayantika's real database.

DAY 2+ TODO (Naqi):
- GET /zones and POST/GET /readings -> wire to real Postgres (Ayantika)
- GET /alerts -> wire to Kushagra's live leak_alerts output
- POST /quality, GET /correlation/{zone_id} -> wire to Palak's live output
- GET /revenue/summary, POST /alerts/notify -> wire to Piyush's live output
"""

import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException

from app.models import (
    Zone, RawReadingIn, RawReading, LeakAlert,
    QualityReadingIn, QualityReading, CorrelationEvent,
    RevenueSummary, NotifyRequest,
)
from app.mock_data import (
    MOCK_ZONES, MOCK_ALERTS, MOCK_CORRELATIONS, MOCK_REVENUE_SUMMARY,
)

router = APIRouter()


# ---------- 1. GET /zones ----------
@router.get("/zones", response_model=list[Zone])
def get_zones():
    """List all zones with current status. TODO Day 2: replace with real Postgres query."""
    return MOCK_ZONES


# ---------- 2. POST /readings ----------
@router.post("/readings", response_model=RawReading)
def post_reading(reading: RawReadingIn):
    """
    Ingest a new raw reading (sensor or manual).
    TODO Day 2: insert into Postgres raw_readings table (Ayantika's schema).
    For now: echoes back what was sent, with a generated id/timestamp,
    so whoever is testing this (Kushagra, Palak) can confirm the shape works.
    """
    return RawReading(
        reading_id=str(uuid.uuid4())[:8],
        timestamp=reading.timestamp or datetime.utcnow(),
        **reading.dict(exclude={"timestamp"}),
    )


# ---------- 3. GET /alerts ----------
@router.get("/alerts", response_model=list[LeakAlert])
def get_alerts(zone_id: str | None = None, status: str | None = None):
    """
    List active leak alerts, filterable by zone/status.
    TODO Day 3: replace with Kushagra's live leak_alerts table query.
    """
    results = MOCK_ALERTS
    if zone_id:
        results = [a for a in results if a["zone_id"] == zone_id]
    if status:
        results = [a for a in results if a["status"] == status]
    return results


# ---------- 4. POST /quality ----------
@router.post("/quality", response_model=QualityReading)
def post_quality(reading: QualityReadingIn):
    """
    Ingest a new water-quality reading.
    TODO Day 2: insert into Postgres quality_readings table (Palak owns the logic,
    this endpoint just needs to persist what Palak's engine sends).
    """
    return QualityReading(
        reading_id=str(uuid.uuid4())[:8],
        timestamp=reading.timestamp or datetime.utcnow(),
        **reading.dict(exclude={"timestamp"}),
    )


# ---------- 5. GET /correlation/{zone_id} ----------
@router.get("/correlation/{zone_id}", response_model=CorrelationEvent)
def get_correlation(zone_id: str):
    """
    Get leak-quality correlation status for a zone.
    TODO Day 3: replace with Palak's live correlation_events query.
    """
    result = MOCK_CORRELATIONS.get(zone_id)
    if not result:
        raise HTTPException(status_code=404, detail=f"No correlation data for {zone_id} yet")
    return result


# ---------- 6. GET /revenue/summary ----------
@router.get("/revenue/summary", response_model=RevenueSummary)
def get_revenue_summary():
    """
    Running Revenue Recovered total + per-zone breakdown.
    TODO Day 4: replace with Piyush's live revenue_log aggregation.
    """
    return MOCK_REVENUE_SUMMARY


# ---------- 7. POST /alerts/notify ----------
@router.post("/alerts/notify")
def notify_alert(request: NotifyRequest):
    """
    Trigger a WhatsApp/SMS alert for a given alert_id.
    TODO Day 4: wire to Piyush's Twilio/WhatsApp sandbox trigger.
    For now: just confirms the request shape is valid and echoes it back.
    """
    return {
        "status": "queued (mock - not actually sent yet)",
        "alert_id": request.alert_id,
        "channel": request.channel,
    }
