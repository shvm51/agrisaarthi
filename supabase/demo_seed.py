"""DEMO SEED — Ramesh Patil (Pune, 2.5 acres, Tomato, Fruiting).

Outputs SQL INSERTs for the Supabase SQL editor. Clearly demo data only —
replace the placeholder auth user id with a real one before running.
"""
from datetime import date

DEMO_USER_ID = "00000000-0000-0000-0000-000000000001"  # TODO: replace with real auth.users id

seed = {
    "profile": {
        "id": DEMO_USER_ID, "full_name": "Ramesh Patil", "phone": "+91-98000-00000",
        "language": "mr", "role": "farmer",
    },
    "farm": {
        "farmer_id": DEMO_USER_ID, "location_name": "Pune, Maharashtra",
        "latitude": 18.5204, "longitude": 73.8567,
        "land_acres": 2.5, "soil_type": "Loamy", "water_availability": "MEDIUM",
    },
    "crop": {"crop": "Tomato", "crop_stage": "Fruiting", "planted_on": str(date(2026, 7, 15))},
    "soil": {"ph": 6.8, "nitrogen": 65, "phosphorus": 38, "potassium": 55},
    "alerts": [
        {"category": "WEATHER", "title": "Rain expected tomorrow", "priority": 1},
        {"category": "DISEASE", "title": "Disease risk elevated — inspect lower leaves", "priority": 2},
        {"category": "MARKET", "title": "Tomato prices trending upward", "priority": 4},
    ],
}

SQL = f"""
-- DEMO SEED: Ramesh Patil (replace '{DEMO_USER_ID}' with a real auth user id)
insert into profiles (id, full_name, phone, language, role)
values ('{DEMO_USER_ID}', 'Ramesh Patil', '+91-98000-00000', 'mr', 'farmer')
on conflict (id) do nothing;

insert into farms (id, farmer_id, location_name, latitude, longitude, land_acres, soil_type, water_availability)
values ('11111111-0000-0000-0000-000000000001', '{DEMO_USER_ID}', 'Pune, Maharashtra',
        18.5204, 73.8567, 2.5, 'Loamy', 'MEDIUM')
on conflict (id) do nothing;

insert into farm_crops (farm_id, crop, crop_stage, planted_on)
values ('11111111-0000-0000-0000-000000000001', 'Tomato', 'Fruiting', '2026-07-15');

insert into soil_data (farm_id, ph, nitrogen, phosphorus, potassium)
values ('11111111-0000-0000-0000-000000000001', 6.8, 65, 38, 55);

insert into farm_alerts (farm_id, category, title, priority)
values
  ('11111111-0000-0000-0000-000000000001', 'WEATHER', 'Rain expected tomorrow', 1),
  ('11111111-0000-0000-0000-000000000001', 'DISEASE', 'Disease risk elevated — inspect lower leaves', 2),
  ('11111111-0000-0000-0000-000000000001', 'MARKET', 'Tomato prices trending upward', 4);
""".strip()

if __name__ == "__main__":
    print(SQL)
    assert "Ramesh Patil" in SQL and "Tomato" in SQL
    print("\n-- OK: demo seed SQL generated")
