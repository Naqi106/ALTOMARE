"""
Pydantic models matching the Shared System Contract (Section 11 of the
Master Execution Document). Everyone's module should produce/consume
data shaped like this. If you need a new field, add it here AND tell
the whole team before using it elsewhere.
"""

from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime


# ---------- ZONES ----------
class Zone(BaseModel):
    zone_id: str
    name: str
    pipe_age_years: Optional[int] = None
    population: Optional[int] = None
    data_level: Literal[0, 1, 2] = 0


# ---------- RAW READINGS (inflow / pressure / flow) ----------
class RawReadingIn(BaseModel):
    zone_id: str
    type: Literal["inflow", "pressure", "flow"]
    value: float
    unit: str
    source: Literal["sensor", "manual"] = "manual"
    timestamp: Optional[datetime] = None


class RawReading(RawReadingIn):
    reading_id: int
    timestamp: datetime


# ---------- LEAK ALERTS (Kushagra's module writes these) ----------
class LeakAlert(BaseModel):
    alert_id: int
    zone_id: str
    estimated_loss_litres: float
    confidence_score: float  # 0-1 (DB CHECK constraint: 0 <= confidence_score <= 1)
    method: Literal["water_balance", "mnf", "ppa", "billing_anomaly"]
    timestamp: datetime
    status: Literal["active", "resolved", "monitoring"] = "active"


# ---------- QUALITY READINGS (Palak's module writes these) ----------
class QualityReadingIn(BaseModel):
    zone_id: str
    ph: Optional[float] = None
    turbidity: Optional[float] = None
    tds: Optional[float] = None
    chlorine: Optional[float] = None
    bacteria_cfu: Optional[float] = None
    hardness: Optional[float] = None
    source: Literal["sensor", "manual", "lab"] = "manual"
    timestamp: Optional[datetime] = None


class QualityReading(QualityReadingIn):
    reading_id: int  # SERIAL in Supabase (quality_readings.reading_id)
    timestamp: datetime


# ---------- CORRELATION EVENTS (Palak's correlation logic writes these) ----------
class CorrelationEvent(BaseModel):
    event_id: int  # SERIAL in Supabase (correlation_events.event_id)
    zone_id: str
    leak_alert_id: Optional[int] = None       # INT FK -> leak_alerts.alert_id
    quality_reading_id: Optional[int] = None  # INT FK -> quality_readings.reading_id
    leak_caused_contamination: bool = False
    # Must match the DB CHECK constraint exactly (uppercase, these 4 values only)
    risk_level: Literal["SAFE", "WARNING", "ALERT", "CRITICAL"] = "SAFE"


# ---------- REVENUE LOG (Piyush's calculators write/read these) ----------
class RevenueLogEntry(BaseModel):
    log_id: int  # SERIAL in Supabase (revenue_log.log_id)
    zone_id: str
    leak_alert_id: Optional[int] = None  # INT FK -> leak_alerts.alert_id
    litres_recovered: float
    amount_recovered: float
    billing_cycle: str


class RevenueSummary(BaseModel):
    total_recovered: float
    by_zone: dict[str, float]


# ---------- NRW SUMMARY (real water-balance NRW%, per Section 2/5) ----------
class NRWSummary(BaseModel):
    total_nrw_percent: float
    by_zone: dict[str, float]  # zones with zero inflow data are omitted, not shown as 0


# ---------- NOTIFY REQUEST (Piyush triggers this) ----------
class NotifyRequest(BaseModel):
    alert_id: int  # references leak_alerts.alert_id (SERIAL/int)
    channel: Literal["whatsapp", "sms"] = "whatsapp"
