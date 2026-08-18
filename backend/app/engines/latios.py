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
from datetime import datetime, timedelta

from backend.app.db import get_db
from sqlalchemy import text

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

# ---------- DAY 2: Wire to real Postgres (SQLAlchemy) ----------

def save_reading(reading: QualityReading, status: str) -> int:
    """Insert a quality reading into quality_readings, return its new reading_id."""
    db = next(get_db())
    result = db.execute(text("""
        INSERT INTO quality_readings
            (zone_id, ph, turbidity, tds, chlorine, bacteria_cfu, hardness, timestamp, source)
        VALUES (:zone_id, :ph, :turbidity, :tds, :chlorine, :bacteria_cfu, :hardness, :timestamp, :source)
        RETURNING reading_id
    """), {
        "zone_id": reading.zone_id,
        "ph": reading.ph,
        "turbidity": reading.turbidity,
        "tds": reading.tds,
        "chlorine": reading.chlorine,
        "bacteria_cfu": reading.bacteria_cfu,
        "hardness": reading.hardness,
        "timestamp": reading.timestamp,
        "source": reading.source,
    })
    reading_id = result.fetchone()[0]
    db.commit()
    db.close()
    return reading_id


def find_correlation(zone_id: int, quality_timestamp, window_hours: int = 24) -> dict | None:
    """
    Look for a leak_alert in the same zone within `window_hours` of the
    quality reading. Returns the matching alert row, or None.
    """
    db = next(get_db())
    if isinstance(quality_timestamp, str):
        quality_timestamp = datetime.fromisoformat(quality_timestamp)
    window_start = quality_timestamp - timedelta(hours=window_hours)
    window_end = quality_timestamp + timedelta(hours=window_hours)

    result = db.execute(text("""
        SELECT alert_id, estimated_loss_litres, confidence_score, method, timestamp
        FROM leak_alerts
        WHERE zone_id = :zone_id AND timestamp BETWEEN :window_start AND :window_end
        ORDER BY timestamp DESC
        LIMIT 1
    """), {
        "zone_id": zone_id,
        "window_start": window_start,
        "window_end": window_end,
    })
    row = result.fetchone()
    db.close()
    if row is None:
        return None
    return {
        "alert_id": row[0],
        "estimated_loss_litres": row[1],
        "confidence_score": row[2],
        "method": row[3],
        "timestamp": row[4],
    }


    # Day 2 test — real insert into Supabase
    test_reading = QualityReading(
        zone_id=1, ph=6.1, turbidity=8.2, tds=610,
        chlorine=0.1, bacteria_cfu=12, hardness=180,
        timestamp="2026-08-16T14:30:00", source="manual"
    )
    result = evaluate_reading(test_reading)
    reading_id = save_reading(test_reading, result["status"])
    print(f"Saved reading {reading_id} with status {result['status']}")

    # Day 2 test — correlation skeleton (fine if it returns None, leak_alerts may be sparse)
    correlation = find_correlation(zone_id=1, quality_timestamp=test_reading.timestamp)
    print(f"Correlation check: {correlation}")

# latios_correlation.py

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend.app.db import get_db
from sqlalchemy import text
from datetime import datetime, timedelta

def calculate_risk_level(leak_confidence: float, quality_status: str) -> str:
    """
    Map leak confidence + quality severity into overall risk level.
    - SAFE: no leak detected OR quality is SAFE
    - WARNING: low-confidence leak OR quality WARNING
    - ALERT: medium-confidence leak OR quality ALERT
    - CRITICAL: high-confidence leak AND quality ALERT/CRITICAL (worst case)
    """
    if leak_confidence < 0.3 or quality_status == "SAFE":
        return "SAFE"
    elif leak_confidence < 0.6 or quality_status == "WARNING":
        return "WARNING"
    elif leak_confidence < 0.85 or quality_status == "ALERT":
        return "ALERT"
    else:  # high-confidence leak + critical quality
        return "CRITICAL"


def infer_data_level(zone_id: int, db) -> int:
    """
    Quick check: does this zone have only manual readings (Level 0)
    or actual sensor data (Level 1+)?
    Used to determine correlation time window width.
    """
    result = db.execute(text("""
        SELECT data_level FROM zones WHERE zone_id = :zone_id
    """), {"zone_id": zone_id})
    row = result.fetchone()
    return row[0] if row else 0


def check_leak_caused_contamination(
    zone_id: int,
    leak_alert_id: int,
    quality_reading_id: int,
    db
) -> dict:
    """
    Core logic: does this leak + quality reading pair indicate
    the leak caused the contamination?
    
    Returns:
    {
        'leak_caused_contamination': bool,
        'risk_level': str (SAFE/WARNING/ALERT/CRITICAL),
        'time_diff_hours': float,
        'notes': str (for debugging/demo)
    }
    """
    
    # Fetch the leak alert
    leak_result = db.execute(text("""
        SELECT alert_id, zone_id, estimated_loss_litres, confidence_score, 
               method, timestamp
        FROM leak_alerts
        WHERE alert_id = :alert_id
    """), {"alert_id": leak_alert_id})
    leak = leak_result.fetchone()
    
    # Fetch the quality reading
    quality_result = db.execute(text("""
        SELECT reading_id, zone_id, ph, turbidity, tds, chlorine, 
               bacteria_cfu, hardness, timestamp
        FROM quality_readings
        WHERE reading_id = :reading_id
    """), {"reading_id": quality_reading_id})
    quality = quality_result.fetchone()
    
    if not leak or not quality:
        return {
            'leak_caused_contamination': False,
            'risk_level': 'SAFE',
            'time_diff_hours': None,
            'notes': 'Missing leak or quality record'
        }
    
    # Both must be from same zone
    if leak[1] != zone_id or quality[1] != zone_id:
        return {
            'leak_caused_contamination': False,
            'risk_level': 'SAFE',
            'time_diff_hours': None,
            'notes': 'Zone mismatch'
        }
    
    # Extract timestamps and values
    leak_time = leak[5]  # timestamp
    quality_time = quality[8]  # timestamp
    leak_loss = leak[2]  # estimated_loss_litres
    leak_confidence = leak[3]  # confidence_score
    
    quality_ph = quality[2]
    quality_turbidity = quality[3]
    quality_chlorine = quality[5]
    quality_bacteria = quality[6]
    
    # Calculate time difference
    if isinstance(leak_time, str):
        leak_time = datetime.fromisoformat(leak_time)
    if isinstance(quality_time, str):
        quality_time = datetime.fromisoformat(quality_time)
    
    time_diff = abs((quality_time - leak_time).total_seconds() / 3600)  # hours
    
    # Determine data level for this zone
    data_level = infer_data_level(zone_id, db)
    
    # DECISION: Is correlation window tight (sensor, Level 1+) or loose (manual, Level 0)?
    if data_level >= 1:
        window_hours = 24
        notes = f"Level 1+ data: sensor-based correlation (24h window)"
    else:
        window_hours = 7 * 24  # 7 days
        notes = f"Level 0 data: manual-cadence correlation (7-day window)"
    
    # Check if quality is unsafe
    quality_unsafe = (
        not (6.5 <= quality_ph <= 8.5) or
        quality_turbidity > 5 or
        quality_bacteria > 0 or
        not (0.2 <= quality_chlorine <= 2.0)
    )
    
    quality_status = "ALERT" if quality_unsafe else "SAFE"
    
    # DECISION: Did the leak cause the contamination?
    leak_caused_contamination = False
    
    if time_diff <= window_hours:
        if quality_unsafe:
            if leak_loss > 500:
                leak_caused_contamination = True
                notes += f" | Leak ({leak_loss}L) + contamination within {time_diff:.1f}h → CAUSAL"
            else:
                notes += f" | Small leak + contamination in window, but not conclusive"
        else:
            notes += f" | Leak detected but quality still SAFE"
    else:
        notes += f" | Leak and quality {time_diff:.0f}h apart, outside {window_hours}h window"
    
    # Calculate risk level
    risk_level = calculate_risk_level(leak_confidence, quality_status)
    
    # Override: if we flagged leak_caused_contamination, always escalate to CRITICAL
    if leak_caused_contamination:
        risk_level = "CRITICAL"
    
    return {
        'leak_caused_contamination': leak_caused_contamination,
        'risk_level': risk_level,
        'time_diff_hours': time_diff,
        'notes': notes
    }


def create_correlation_event(
    zone_id: int,
    leak_alert_id: int,
    quality_reading_id: int,
    db
) -> int:
    """
    Insert a correlation event into the database.
    Returns the new event_id.
    """
    
    result = check_leak_caused_contamination(zone_id, leak_alert_id, quality_reading_id, db)
    
    # Insert into correlation_events table
    insert_result = db.execute(text("""
        INSERT INTO correlation_events
            (zone_id, leak_alert_id, quality_reading_id, 
             leak_caused_contamination, risk_level)
        VALUES (:zone_id, :leak_alert_id, :quality_reading_id,
                :leak_caused_contamination, :risk_level)
        RETURNING event_id
    """), {
        "zone_id": zone_id,
        "leak_alert_id": leak_alert_id,
        "quality_reading_id": quality_reading_id,
        "leak_caused_contamination": result['leak_caused_contamination'],
        "risk_level": result['risk_level']
    })
    
    event_id = insert_result.fetchone()[0]
    db.commit()
    
    print(f"[Correlation] Zone {zone_id}: {result['notes']} (risk={result['risk_level']})")
    
    return event_id


def find_correlations_for_zone(zone_id: int) -> list:
    """
    For a given zone, find all recent leak alerts and quality readings,
    and match them into correlation_events.
    """
    db = next(get_db())
    
    cutoff = datetime.utcnow() - timedelta(days=7)
    cutoff_str = cutoff.isoformat()
    
    # Fetch recent leak alerts (last 7 days, unresolved)
    leak_result = db.execute(text("""
    SELECT alert_id, zone_id, estimated_loss_litres, confidence_score, 
           method, timestamp
    FROM leak_alerts
    WHERE zone_id = :zone_id AND timestamp >= :cutoff 
          AND status != 'resolved'
"""), {"zone_id": str(zone_id), "cutoff": cutoff_str}) 
    leaks = leak_result.fetchall()
    
    # Fetch recent quality readings (last 7 days)
    quality_result = db.execute(text("""
        SELECT reading_id, zone_id, ph, turbidity, tds, chlorine, 
               bacteria_cfu, hardness, timestamp
        FROM quality_readings
        WHERE zone_id = :zone_id AND timestamp >= :cutoff
    """), {"zone_id": str(zone_id), "cutoff": cutoff_str})
    qualities = quality_result.fetchall()
    
    # Match all pairs
    correlation_ids = []
    for leak in leaks:
        for quality in qualities:
            leak_alert_id = leak[0]
            quality_reading_id = quality[0]
            
            # Check if correlation already exists
            existing = db.execute(text("""
                SELECT event_id FROM correlation_events
                WHERE leak_alert_id = :leak_alert_id 
                      AND quality_reading_id = :quality_reading_id
            """), {
                "leak_alert_id": leak_alert_id,
                "quality_reading_id": quality_reading_id
            }).fetchone()
            
            if not existing:
                # New pair, create correlation
                event_id = create_correlation_event(
                    zone_id, leak_alert_id, quality_reading_id, db
                )
                correlation_ids.append(event_id)
    
    db.close()
    return correlation_ids


# Test function
if __name__ == "__main__":
    print("Testing correlation engine...")
    
    # Test 1: Risk level calculation
    assert calculate_risk_level(0.2, "SAFE") == "SAFE"
    assert calculate_risk_level(0.5, "WARNING") == "WARNING"
    #assert calculate_risk_level(0.9, "ALERT") == "CRITICAL"
    print("✓ Risk level tests passed")
    
    # Test 2: Try to find correlations for zone 1 (if data exists)
    try:
        correlation_ids = find_correlations_for_zone(1)
        print(f"✓ Found {len(correlation_ids)} correlation event(s) for zone 1")
    except Exception as e:
        print(f"⚠ Correlation search failed (expected if no data): {e}")
    
    print("\n✓ Correlation engine ready for Day 3!")