"""
Test suite for Kushagra's Latias engine.

Run with: pytest tests/test_latias.py -v
"""

import pytest
import pandas as pd
from app.engines.latias import (
    water_balance_loss,
    mnf_loss_estimate,
    unavoidable_annual_real_losses,
    billing_anomaly_score,
    flag_anomalous_households,
    simulate_ppa,
    estimate_leak_location,
)


# ============================================================================
# DAY 1 TESTS
# ============================================================================

def test_water_balance_basic():
    """100,000L in, 78,000L billed, 4,000L authorized unbilled -> 18,000L loss"""
    assert water_balance_loss(100_000, 78_000, 4_000) == 18_000


def test_water_balance_zero_loss():
    """Everything supplied is accounted for -> zero loss"""
    assert water_balance_loss(50_000, 45_000, 5_000) == 0


def test_water_balance_negative_guard():
    """Billed + unbilled slightly exceeds inflow due to metering noise -> small negative"""
    result = water_balance_loss(10_000, 9_000, 1_500)
    assert result == -500


def test_mnf_basic():
    """Pump ran 1.5 hrs during 2-4AM window, rated at 12,000 L/hr -> 18,000L likely lost"""
    assert mnf_loss_estimate(1.5, 12_000) == 18_000


def test_mnf_zero_run_hours():
    """No pump activity at night -> no estimated night loss"""
    assert mnf_loss_estimate(0, 12_000) == 0


def test_uarl_sanity():
    """UARL should scale up with more pipe length, connections, and pressure"""
    low = unavoidable_annual_real_losses(pipe_length_km=5, num_connections=1000, avg_pressure_m=20)
    high = unavoidable_annual_real_losses(pipe_length_km=15, num_connections=3000, avg_pressure_m=30)
    assert high > low


# ============================================================================
# DAY 3 TESTS — BILLING ANOMALY
# ============================================================================

def test_billing_anomaly_flags_low_consumption():
    """60% below benchmark -> should be flagged with a positive score"""
    score = billing_anomaly_score(2000, 5000)
    assert score > 0


def test_billing_anomaly_ignores_normal_consumption():
    """Only 4% below benchmark -> should NOT be flagged"""
    score = billing_anomaly_score(4800, 5000)
    assert score == 0


def test_flag_anomalous_households_ranks_correctly():
    """Test ranking: households far below benchmark should be flagged and ranked by severity"""
    df = pd.DataFrame([
        {"household_id": "H001", "billed_litres": 2000, "benchmark_litres": 5000},
        {"household_id": "H002", "billed_litres": 4800, "benchmark_litres": 5000},
        {"household_id": "H003", "billed_litres": 500, "benchmark_litres": 4500},
    ])
    flagged = flag_anomalous_households(df)
    # Only H001 and H003 should be flagged; H003 is more severe and should rank first
    assert set(flagged.household_id) == {"H001", "H003"}
    assert flagged.iloc[0].household_id == "H003"


# ============================================================================
# DAY 3 TESTS — PPA SIMULATION
# ============================================================================

def test_ppa_locates_leak_near_correct_sensor():
    """PPA should identify the sensor closest to the simulated leak location"""
    sensors = [0, 150, 300, 450]
    readings = simulate_ppa(sensors, leak_position_m=320)
    estimated = estimate_leak_location(readings)
    # The sensor at 300m is closest to the true simulated leak at 320m
    assert estimated == 300


def test_ppa_no_leak_gives_uniform_readings():
    """With no leak (leak_position_m=None), all sensors should read the same base pressure"""
    sensors = [0, 150, 300]
    readings = simulate_ppa(sensors, leak_position_m=None)
    # With no leak, all sensors should read the same base pressure
    assert len(set(readings.values())) == 1