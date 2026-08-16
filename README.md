# AltoMare — Team Kryptix (Decode SIH 2026 — PS1288)

## Repo structure

```
altomare/
├── backend/                  <- Naqi owns overall, but everyone commits here
│   ├── app/
│   │   ├── main.py            (Naqi — app entrypoint)
│   │   ├── models.py          (shared schema — everyone reads this, ask before changing)
│   │   ├── db.py               (Naqi — Supabase connection, TODO Day 2)
│   │   ├── mock_data.py        (Naqi — temporary fake data, deleted once db.py is live)
│   │   ├── routers/
│   │   │   └── core.py         (Naqi — the 7 contract endpoints)
│   │   ├── engines/
│   │   │   ├── latias.py       <- KUSHAGRA'S FILE — leak detection / NRW
│   │   │   ├── latios.py       <- PALAK'S FILE — water quality + correlation
│   │   │   └── revenue.py      <- PIYUSH'S FILE — revenue + payback calculators
│   │   └── alerts/
│   │       └── notify.py       <- PIYUSH'S FILE — WhatsApp/SMS delivery
│   └── requirements.txt
├── frontend/                  <- ARYAN'S FOLDER — React app goes here
└── docs/                      <- reference material (Master Execution Document, etc.)
```

## How to work in this repo

1. **Clone it.** Everyone works on their own files above — stick to your named file(s)
   so we don't get merge conflicts on Day 3-4.
2. **Don't touch `models.py` or the endpoint contract in `routers/core.py`** without
   messaging the team first — those are the shared contract everything else depends on.
3. **Kushagra, Palak, Piyush:** your files already have a docstring at the top explaining
   what functions to build and how they'll connect to the rest of the system. Start there.
4. **Naqi** will progressively wire each engine's real functions into `routers/core.py`,
   replacing the mock data, as each person's module becomes ready (Day 2-4).

## Setup (backend)

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Then open `http://localhost:8000/docs` to see/test the live API.

## Reference

Full research, architecture rationale, and the day-by-day plan for every person is in
`docs/` — read your section before starting.
