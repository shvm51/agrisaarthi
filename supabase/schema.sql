-- AgriSaarthi Supabase schema (PostgreSQL + RLS).
-- Run in the Supabase SQL editor. Storage buckets are created below via SQL
-- where supported; otherwise create `crop-images` and `marketplace-images`
-- as PRIVATE buckets in the dashboard.

-- ============================ TABLES ============================

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  language text not null default 'en' check (language in ('en','hi','mr')),
  role text not null default 'farmer' check (role in ('farmer','expert','admin')),
  created_at timestamptz not null default now()
);

create table if not exists farms (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null references profiles(id) on delete cascade,
  location_name text not null,
  latitude double precision,
  longitude double precision,
  land_acres numeric not null,
  soil_type text,
  water_availability text check (water_availability in ('LOW','MEDIUM','HIGH')),
  created_at timestamptz not null default now()
);

create table if not exists farm_crops (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references farms(id) on delete cascade,
  crop text not null,
  crop_stage text check (crop_stage in ('Seedling','Vegetative','Flowering','Fruiting','Harvest')),
  planted_on date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists soil_data (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references farms(id) on delete cascade,
  ph numeric,
  nitrogen numeric,
  phosphorus numeric,
  potassium numeric,
  recorded_at timestamptz not null default now()
);

create table if not exists crop_scans (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references farms(id) on delete cascade,
  farmer_id uuid not null references profiles(id) on delete cascade,
  image_path text not null,           -- supabase storage path in crop-images
  created_at timestamptz not null default now()
);

create table if not exists disease_predictions (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references crop_scans(id) on delete cascade,
  disease text,
  confidence numeric,
  severity text check (severity in ('MILD','MODERATE','SEVERE')),
  model_version text not null default 'v1',
  created_at timestamptz not null default now()
);

create table if not exists weather_data (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid references farms(id) on delete cascade,
  latitude double precision, longitude double precision,
  temperature_c numeric, humidity_pct numeric,
  rain_probability_pct numeric, wind_kmh numeric,
  recorded_at timestamptz not null default now()
);

create table if not exists risk_scores (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references farms(id) on delete cascade,
  risk_score numeric not null,
  risk_level text not null check (risk_level in ('LOW','MEDIUM','HIGH')),
  risk_factors jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table if not exists irrigation_recommendations (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references farms(id) on delete cascade,
  recommendation text not null check (recommendation in ('IRRIGATE','WAIT','CAUTION')),
  reason text,
  data_source text not null check (data_source in ('sensor','weather-estimated')),
  created_at timestamptz not null default now()
);

create table if not exists farm_alerts (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references farms(id) on delete cascade,
  category text not null,
  title text not null,
  priority int not null default 5,
  status text not null default 'pending' check (status in ('pending','done','dismissed')),
  created_at timestamptz not null default now()
);

create table if not exists crop_recommendations (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references farms(id) on delete cascade,
  ranked_crops jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists market_prices (
  id uuid primary key default gen_random_uuid(),
  crop text not null,
  market text not null,
  price_per_kg numeric not null,
  distance_km numeric,
  recorded_at timestamptz not null default now()
);

create table if not exists marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null references profiles(id) on delete cascade,
  crop text not null,
  quantity_kg numeric not null,
  expected_price_per_kg numeric,
  quality text,
  location_name text,
  image_path text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists buyers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact text,
  location_name text,
  crops text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists farm_expenses (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references farms(id) on delete cascade,
  category text not null,
  amount numeric not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists farm_yield (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references farms(id) on delete cascade,
  crop text not null,
  yield_kg numeric not null,
  harvest_date date,
  created_at timestamptz not null default now()
);

create table if not exists schemes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text check (type in ('scheme','insurance')),
  benefits text,
  eligibility_indicators text[],
  documents text[],
  official_source text,
  active boolean not null default true
);

create table if not exists insurance_info (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  provider text,
  benefits text,
  official_source text,
  active boolean not null default true
);

create table if not exists chat_history (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null references profiles(id) on delete cascade,
  query text not null,
  answer text not null,
  language text not null default 'en',
  created_at timestamptz not null default now()
);

create table if not exists expert_requests (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null references profiles(id) on delete cascade,
  farm_id uuid references farms(id) on delete set null,
  assigned_expert_id uuid references profiles(id) on delete set null,
  crop text,
  issue text not null,
  risk_level text,
  disease text,
  confidence numeric,
  location_name text,
  image_path text,
  status text not null default 'OPEN' check (status in ('OPEN','ASSIGNED','RESOLVED')),
  created_at timestamptz not null default now()
);

-- ============================ RLS ============================

alter table profiles enable row level security;
alter table farms enable row level security;
alter table farm_crops enable row level security;
alter table soil_data enable row level security;
alter table crop_scans enable row level security;
alter table disease_predictions enable row level security;
alter table weather_data enable row level security;
alter table risk_scores enable row level security;
alter table irrigation_recommendations enable row level security;
alter table farm_alerts enable row level security;
alter table crop_recommendations enable row level security;
alter table marketplace_listings enable row level security;
alter table farm_expenses enable row level security;
alter table farm_yield enable row level security;
alter table chat_history enable row level security;
alter table expert_requests enable row level security;

-- helper: is the requester an admin?
create or replace function is_admin() returns boolean
language sql security definer stable as
$$ select exists (select 1 from profiles where id = auth.uid() and role = 'admin') $$;

-- profiles: users read/update own row; admins all
create policy "own profile" on profiles for all
  using (id = auth.uid() or is_admin()) with check (id = auth.uid() or is_admin());

-- farms: farmer owns via farmer_id
create policy "own farms" on farms for all
  using (farmer_id = auth.uid() or is_admin()) with check (farmer_id = auth.uid() or is_admin());

-- child tables keyed by farm_id: farmer must own the farm
create or replace function owns_farm(f uuid) returns boolean
language sql security definer stable as
$$ select exists (select 1 from farms where id = f and (farmer_id = auth.uid() or auth.uid() in (select id from profiles where role='admin'))) $$;

create policy "own farm_crops" on farm_crops for all using (owns_farm(farm_id)) with check (owns_farm(farm_id));
create policy "own soil_data" on soil_data for all using (owns_farm(farm_id)) with check (owns_farm(farm_id));
create policy "own weather_data" on weather_data for all using (farm_id is null or owns_farm(farm_id)) with check (farm_id is null or owns_farm(farm_id));
create policy "own risk_scores" on risk_scores for all using (owns_farm(farm_id)) with check (owns_farm(farm_id));
create policy "own irrigation" on irrigation_recommendations for all using (owns_farm(farm_id)) with check (owns_farm(farm_id));
create policy "own alerts" on farm_alerts for all using (owns_farm(farm_id)) with check (owns_farm(farm_id));
create policy "own crop_recs" on crop_recommendations for all using (owns_farm(farm_id)) with check (owns_farm(farm_id));
create policy "own expenses" on farm_expenses for all using (owns_farm(farm_id)) with check (owns_farm(farm_id));
create policy "own yield" on farm_yield for all using (owns_farm(farm_id)) with check (owns_farm(farm_id));

-- scans / predictions: farmer owns scan
create policy "own scans" on crop_scans for all
  using (farmer_id = auth.uid() or is_admin()) with check (farmer_id = auth.uid() or is_admin());
create policy "own predictions" on disease_predictions for all
  using (exists (select 1 from crop_scans s where s.id = scan_id and (s.farmer_id = auth.uid() or is_admin())))
  with check (exists (select 1 from crop_scans s where s.id = scan_id and (s.farmer_id = auth.uid() or is_admin())));

-- marketplace listings: farmers manage own; everyone authenticated can read active
create policy "read active listings" on marketplace_listings for select
  using (active = true or farmer_id = auth.uid() or is_admin());
create policy "own listings write" on marketplace_listings for insert with check (farmer_id = auth.uid());
create policy "own listings update" on marketplace_listings for update
  using (farmer_id = auth.uid() or is_admin()) with check (farmer_id = auth.uid() or is_admin());

-- chat history: own only
create policy "own chat" on chat_history for all
  using (farmer_id = auth.uid() or is_admin()) with check (farmer_id = auth.uid() or is_admin());

-- expert requests: farmer owns; assigned expert can read/update; admin all
create policy "farmer expert cases" on expert_requests for all
  using (farmer_id = auth.uid() or is_admin()) with check (farmer_id = auth.uid() or is_admin());
create policy "expert assigned cases" on expert_requests for select
  using (assigned_expert_id = auth.uid());
create policy "expert update assigned" on expert_requests for update
  using (assigned_expert_id = auth.uid()) with check (assigned_expert_id = auth.uid());

-- public reference data: readable by authenticated users
create policy "read schemes" on schemes for select to authenticated using (true);
create policy "read insurance" on insurance_info for select to authenticated using (true);
create policy "read market prices" on market_prices for select to authenticated using (true);
create policy "read buyers" on buyers for select to authenticated using (true);

-- ============================ STORAGE ============================
-- Create PRIVATE buckets `crop-images` and `marketplace-images` in the dashboard,
-- then run equivalent storage policies (storage.objects):
--   farmers: insert/select on crop-images where path starts with their user id
--   e.g. (bucket_id = 'crop-images' and (storage.foldername(name))[1] = auth.uid()::text)
