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
    reading_id: str
    timestamp: datetime


# ---------- LEAK ALERTS (Kushagra's module writes these) ----------
class LeakAlert(BaseModel):
    alert_id: str
    zone_id: str
    estimated_loss_litres: float
    confidence_score: float  # 0-100
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
    reading_id: str
    timestamp: datetime


# ---------- CORRELATION EVENTS (Palak's correlation logic writes these) ----------
class CorrelationEvent(BaseModel):
    event_id: str
    zone_id: str
    leak_alert_id: Optional[str] = None
    quality_reading_id: Optional[str] = None
    leak_caused_contamination: bool = False
    risk_level: Literal["low", "monitor", "alert", "critical"] = "low"


# ---------- REVENUE LOG (Piyush's calculators write/read these) ----------
class RevenueLogEntry(BaseModel):
    log_id: str
    zone_id: str
    leak_alert_id: Optional[str] = None
    litres_recovered: float
    amount_recovered: float
    billing_cycle: str


class RevenueSummary(BaseModel):
    total_recovered: float
    by_zone: dict[str, float]


# ---------- NOTIFY REQUEST (Piyush triggers this) ----------
class NotifyRequest(BaseModel):
    alert_id: str
    channel: Literal["whatsapp", "sms"] = "whatsapp"
