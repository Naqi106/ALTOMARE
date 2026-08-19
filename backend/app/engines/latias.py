# Copy-Paste Code Additions For AltoMare Repo (Kushagra)

## File 1: Update `backend/app/engines/latias.py`

"""
LATIAS ENGINE — owned by Kushagra
Leak detection / Non-Revenue Water (NRW) tracing.

Implements:
- Water balance calculation (Section 5, Master Execution Document)
- Minimum Night Flow (MNF) estimation (Section 5.2)
- UARL (Unavoidable Annual Real Losses) component-based audit (Section 5.1)
- Billing anomaly scoring (Section 5.3) — targets apparent loss
- PPA (Point Pressure Analysis) simulation for leak location narrowing (Day 3)

Returns data shaped like LeakAlert model in app/models.py
"""

from datetime import datetime
from sqlalchemy import text
import pandas as pd
import numpy as np

from app.db import get_db
from app.models import LeakAlert


# ============================================================================
# DAY 1 — STANDALONE FORMULAS (no database needed)
# ============================================================================

def water_balance_loss(inflow_litres: float, billed_litres: float, authorized_unbilled_litres: float) -> float:
    """
    Loss(zone) = Inflow(zone) - [Billed Consumption(zone) + Authorized Unbilled Use(zone)]

    inflow_litres: total water pumped/supplied into the zone
    billed_litres: total litres billed to customers in the zone
    authorized_unbilled_litres: legitimate unbilled use (fire hydrants, public taps, etc.)

    Returns estimated water loss in litres for the zone.
    """
    return inflow_litres - (billed_litres + authorized_unbilled_litres)


def mnf_loss_estimate(pump_run_hours_2to4am: float, rated_discharge_lph: float) -> float:
    """
    Estimated night-time loss ~= Pump run-hours (2-4 AM) x Rated pump discharge

    Between ~2-4 AM, legitimate household use is close to zero almost everywhere.
    Water still being pumped in this window is very likely lost, not used.

    pump_run_hours_2to4am: hours the pump ran during the 2-4 AM window
    rated_discharge_lph: rated pump discharge in litres per hour

    Returns estimated night-time loss in litres.
    """
    return pump_run_hours_2to4am * rated_discharge_lph


def unavoidable_annual_real_losses(pipe_length_km: float, num_connections: int, avg_pressure_m: float) -> float:
    """
    Simplified UARL estimate (IWA/AWWA-style component-based audit), Section 5.1.
    Standard IWA formula (litres/day):
        UARL = (18 x Lm + 0.8 x Nc + 25 x Lp) x P
    Lm  = mains length (km)
    Nc  = number of service connections
    Lp  = total length of underground pipe between the edge of the street and the
          customer meter (km) - set to 0 if unknown/not applicable
    P   = average operating pressure (metres of head)

    Returns UARL in litres/day. Anything above this baseline in the measured loss
    is the genuinely fixable portion, not unavoidable background leakage.
    """
    lp_km = 0.0  # unknown at Level 0 for most towns; adjust if data is available
    return (18 * pipe_length_km + 0.8 * num_connections + 25 * lp_km) * avg_pressure_m


# ============================================================================
# DAY 2 — DATABASE WIRING
# ============================================================================

def get_zone_readings(zone_id: str):
    """
    Pull the most recent inflow reading and total billed litres for a zone.
    Returns (inflow, billed) — either can be None if no data exists yet.
    """
    db = next(get_db())
    try:
        inflow = db.execute(
            text("""
                SELECT value FROM raw_readings
                WHERE zone_id = :z AND type = 'inflow'
                ORDER BY timestamp DESC LIMIT 1
            """),
            {"z": zone_id}
        ).scalar()

        billed = db.execute(
            text("SELECT SUM(billed_litres) FROM billing_records WHERE zone_id = :z"),
            {"z": zone_id}
        ).scalar()

        return inflow, billed
    finally:
        db.close()


def write_leak_alert(zone_id: str, estimated_loss_litres: float, confidence_score: float, method: str) -> LeakAlert:
    """
    Write a row to leak_alerts table.
    Returns the LeakAlert object that was written.
    """
    db = next(get_db())
    try:
        result = db.execute(
            text("""
                INSERT INTO leak_alerts (zone_id, estimated_loss_litres, confidence_score, method, timestamp, status)
                VALUES (:zone_id, :loss, :conf, :method, now(), 'active')
                RETURNING alert_id, timestamp
            """),
            {
                "zone_id": zone_id,
                "loss": estimated_loss_litres,
                "conf": confidence_score,
                "method": method,
            }
        )
        row = result.mappings().first()
        alert_id = row["alert_id"]
        timestamp = row["timestamp"]
        db.commit()
        
        return LeakAlert(
            alert_id=alert_id,
            zone_id=zone_id,
            estimated_loss_litres=estimated_loss_litres,
            confidence_score=confidence_score,
            method=method,
            timestamp=timestamp,
            status="active"
        )
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


def process_zone(zone_id: str, authorized_unbilled_litres: float = 0) -> LeakAlert | None:
    """
    End-to-end Day 2 pipeline: pull real data for a zone, run the water balance
    formula, and write the result back as a leak alert if loss is detected.
    
    Returns the LeakAlert if one was created, None otherwise.
    """
    inflow, billed = get_zone_readings(zone_id)
    if inflow is None or billed is None:
        print(f"Zone {zone_id}: missing inflow or billing data, skipping")
        return None
    
    loss = water_balance_loss(inflow, billed, authorized_unbilled_litres)
    if loss > 0:
        alert = write_leak_alert(zone_id, loss, confidence_score=0.7, method="water_balance")
        print(f"Wrote leak_alert for zone {zone_id}: {loss} litres via water_balance")
        return alert
    else:
        print(f"Zone {zone_id}: no loss detected (loss={loss})")
        return None


# ============================================================================
# DAY 3 — BILLING ANOMALY SCORING (targets apparent/commercial loss)
# ============================================================================

def billing_anomaly_score(billed_litres: float, benchmark_litres: float, threshold_pct: float = 0.4) -> float:
    """
    Returns a suspicion score 0-1. A household billed more than `threshold_pct`
    below its peer benchmark is flagged (default: 40% below benchmark).
    """
    if benchmark_litres == 0:
        return 0.0
    deviation = (benchmark_litres - billed_litres) / benchmark_litres
    if deviation >= threshold_pct:
        return min(deviation, 1.0)
    return 0.0


def flag_anomalous_households(df: pd.DataFrame) -> pd.DataFrame:
    """
    df must have columns: household_id, billed_litres, benchmark_litres
    
    Returns only the flagged rows, sorted by suspicion_score descending —
    this is the ranked audit list for the billing department (Section 7.1).
    """
    df = df.copy()
    df["suspicion_score"] = df.apply(
        lambda r: billing_anomaly_score(r.billed_litres, r.benchmark_litres), axis=1
    )
    return df[df.suspicion_score > 0].sort_values("suspicion_score", ascending=False)


# ============================================================================
# DAY 3 — PPA SIMULATION (Point Pressure Analysis for leak location narrowing)
# ============================================================================

def simulate_ppa(sensor_positions_m: list, base_pressure_bar: float = 4.0,
                  leak_position_m: float = None, leak_severity: float = 0.6) -> dict:
    """
    Simulates pressure readings at multiple sensor points when a leak exists.
    
    sensor_positions_m: distances (m) along the pipe where sensors sit
    leak_position_m: the true (simulated) leak location, for demo purposes
    
    Returns: dict of sensor_position -> observed pressure (bar)
    
    Note: This is explicitly simulated data standing in for real Level 1 hardware,
    since real sensors are out of scope for a 5-day hackathon prototype.
    """
    readings = {}
    for pos in sensor_positions_m:
        distance_to_leak = abs(pos - leak_position_m) if leak_position_m is not None else 9999
        drop = leak_severity * np.exp(-distance_to_leak / 50)
        readings[pos] = round(base_pressure_bar - drop, 3)
    return readings


def estimate_leak_location(readings: dict) -> float:
    """Naive estimate: leak is nearest the sensor with the lowest pressure reading."""
    return min(readings, key=readings.get)


if __name__ == "__main__":
    # Quick manual sanity check when running `python -m app.engines.latias` directly
    print("Water balance loss:", water_balance_loss(100_000, 78_000, 4_000), "litres")
    print("MNF loss estimate:", mnf_loss_estimate(1.5, 12_000), "litres")
    print("UARL estimate:", unavoidable_annual_real_losses(12.5, 3000, 25), "litres/day")
