-- ─────────────────────────────────────────────────────────────────────────
-- Datenschutz-Checks je Anwendungsfall (DSFA · AVV · Art. 22)
--
-- Bewusst eigene Tabelle statt Spalte auf ai_use_cases: fehlt sie, degradiert
-- nur dieses Feature auf localStorage — das Speichern von Anwendungsfällen
-- bleibt unberührt.
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists public.ai_case_checks (
  use_case_id text        primary key,
  checks      jsonb       not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

alter table public.ai_case_checks enable row level security;

-- ACHTUNG: offene Policy — entspricht dem heutigen Stand der übrigen Tabellen
-- dieses Projekts (anon key, keine Nutzertrennung). Sobald Auth + RLS sauber
-- eingeführt werden, muss diese Policy mit angepasst werden.
drop policy if exists "ai_case_checks_open" on public.ai_case_checks;
create policy "ai_case_checks_open" on public.ai_case_checks
  for all using (true) with check (true);
