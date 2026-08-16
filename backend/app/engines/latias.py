"""
LATIAS ENGINE — owned by Kushagra
Leak detection / Non-Revenue Water (NRW) tracing.

This is where your Day 1-3 logic lives:
- Water balance calculation (Section 5, Master Execution Document)
- Minimum Night Flow (MNF) estimation (Section 5.2)
- Billing anomaly scoring (Section 5.3)
- PPA (Point Pressure Analysis) simulation for leak location narrowing (Day 3)

HOW THIS CONNECTS TO THE REST OF THE SYSTEM:
- Read zone/reading data using the functions in app/db.py (Ayantika's
  Supabase tables: zones, raw_readings, billing_records)
- Whatever you compute, return it shaped like the LeakAlert model in
  app/models.py — Naqi will wire this into the GET /alerts endpoint
  in app/routers/core.py once your function is ready.

Suggested function signatures to build toward (adjust as needed,
just tell Naqi if the shape changes):

    def calculate_water_balance(zone_id: str) -> dict:
        ...

    def estimate_mnf_loss(zone_id: str) -> dict:
        ...

    def score_billing_anomalies(zone_id: str) -> list[dict]:
        ...

    def run_ppa_simulation(zone_id: str, pressure_points: list[float]) -> dict:
        ...

    def detect_leaks(zone_id: str) -> list[LeakAlert]:
        # combines the above into final LeakAlert objects
        ...

Start standalone (Day 1: test with hand-written sample numbers, no
DB needed yet). Wire to real data on Day 2. Reference Section 5 and
6 of the Master Execution Document for the exact formulas and honest
limitations to keep in mind.
"""

# Your code starts here.
"""
Latias Engine — Leak Detection / NRW Tracing
Owner: Kushagra

Day 1 scope: standalone formulas, no database connection yet.
Reference: Section 5 of the AltoMare Master Execution Document.
"""


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


if __name__ == "__main__":
    # Quick manual sanity check when running `python latias.py` directly
    print("Water balance loss:", water_balance_loss(100_000, 78_000, 4_000), "litres")
    print("MNF loss estimate:", mnf_loss_estimate(1.5, 12_000), "litres")
    print("UARL estimate:", unavoidable_annual_real_losses(12.5, 3000, 25), "litres/day")