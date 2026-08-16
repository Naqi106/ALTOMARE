"""
LATIOS ENGINE — owned by Palak
Water quality monitoring + leak-contamination correlation.

This is where your Day 1-3 logic lives:
- 6-parameter threshold engine (pH, turbidity, TDS, chlorine, bacteria,
  hardness) — Section 8, Master Execution Document
- SAFE / WARNING / ALERT / CRITICAL status classification
- Correlation logic: does a leak_alert + quality_reading in the same
  zone, same time window, mean the leak caused contamination?

HOW THIS CONNECTS TO THE REST OF THE SYSTEM:
- Read quality data using app/db.py (Ayantika's quality_readings table)
- Read Kushagra's leak alerts (from his latias.py output, or directly
  from the leak_alerts table once it's populated) to run correlation
- Whatever you compute, shape it like QualityReading and
  CorrelationEvent in app/models.py — Naqi will wire this into
  POST /quality and GET /correlation/{zone_id} in app/routers/core.py

Suggested function signatures to build toward:

    def classify_reading(reading: dict) -> dict:
        # returns status (SAFE/WARNING/ALERT/CRITICAL), violations list
        ...

    def check_correlation(zone_id: str, leak_alert: dict, quality_reading: dict) -> CorrelationEvent:
        # returns leak_caused_contamination bool + risk_level
        ...

Start standalone (Day 1: test against mock readings on paper). Wire
to real data on Day 2, finish correlation logic Day 3. Reference
Section 8 for exact thresholds and the honest Level 0 limitations
(correlation is coarser when data isn't real-time).
"""

# Your code starts here.

from dataclasses import dataclass
from typing import List

THRESHOLDS = {
    "ph":         {"min": 6.5, "max": 8.5},
    "turbidity":  {"min": 0,   "max": 5},
    "tds":        {"min": 0,   "max": 500},
    "chlorine":   {"min": 0.2, "max": 2.0},
    "bacteria_cfu": {"min": 0, "max": 0},
    "hardness":   {"min": 0,   "max": 200},
}

@dataclass
class QualityReading:
    zone_id: int
    ph: float
    turbidity: float
    tds: float
    chlorine: float
    bacteria_cfu: float
    hardness: float
    timestamp: str
    source: str  


def check_violations(reading: QualityReading) -> List[str]:

    violations = []
    values = {
        "ph": reading.ph,
        "turbidity": reading.turbidity,
        "tds": reading.tds,
        "chlorine": reading.chlorine,
        "bacteria_cfu": reading.bacteria_cfu,
        "hardness": reading.hardness,
    }
    for param, value in values.items():
        bounds = THRESHOLDS[param]
        if value < bounds["min"] or value > bounds["max"]:
            direction = "low" if value < bounds["min"] else "high"
            violations.append(f"{param}_{direction}")
    return violations


def classify_status(violations: List[str]) -> str:
    """
    SAFE     -> no violations
    WARNING  -> 1 minor violation (turbidity/hardness/TDS only)
    ALERT    -> 1 violation on pH/chlorine, or 2+ violations
    CRITICAL -> bacteria present, or 3+ violations
    """
    if not violations:
        return "SAFE"
    if any("bacteria" in v for v in violations):
        return "CRITICAL"
    if len(violations) >= 3:
        return "CRITICAL"
    if len(violations) >= 2:
        return "ALERT"
    minor_params = {"turbidity", "hardness", "tds"}
    param_name = violations[0].rsplit("_", 1)[0]
    if param_name in minor_params:
        return "WARNING"
    return "ALERT"  # single pH or chlorine violation


def evaluate_reading(reading: QualityReading) -> dict:
    violations = check_violations(reading)
    status = classify_status(violations)
    return {
        "zone_id": reading.zone_id,
        "status": status,
        "violations": violations,
    }

if __name__ == "__main__":
    test_cases = [
        QualityReading(1, 7.2, 2, 300, 0.5, 0, 150, "2026-08-16T10:00", "manual"),
        QualityReading(2, 7.0, 8, 400, 0.5, 0, 150, "2026-08-16T10:00", "manual"),
        QualityReading(3, 6.1, 2, 300, 0.1, 0, 150, "2026-08-16T10:00", "manual"),
        QualityReading(4, 7.0, 2, 300, 0.5, 12, 150, "2026-08-16T10:00", "manual"),
        QualityReading(5, 6.0, 9, 600, 0.1, 0, 250, "2026-08-16T10:00", "manual"),
    ]

    for tc in test_cases:
        print(evaluate_reading(tc))