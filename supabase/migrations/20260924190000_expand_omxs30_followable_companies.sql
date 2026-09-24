-- Complete the followable OMXS30 universe.
--
-- Composition: Nasdaq OMXS30 as of 1 July 2025, unchanged at the
-- semi-annual review effective 1 June 2026.
-- Existing slugs and follows are preserved. No company_sources rows are
-- added, so a new follow does not queue ingestion without a verified adapter.

insert into public.forum_companies (
  slug,
  name,
  primary_ticker,
  exchange,
  country_code,
  sort_order
)
values
  ('abb', 'ABB', 'ABB', 'Nasdaq Stockholm', 'SE', 160),
  ('addtech', 'Addtech', 'ADDT-B', 'Nasdaq Stockholm', 'SE', 170),
  ('alfa-laval', 'Alfa Laval', 'ALFA', 'Nasdaq Stockholm', 'SE', 180),
  ('boliden', 'Boliden', 'BOL', 'Nasdaq Stockholm', 'SE', 190),
  ('epiroc', 'Epiroc', 'EPI-A', 'Nasdaq Stockholm', 'SE', 200),
  ('eqt', 'EQT', 'EQT', 'Nasdaq Stockholm', 'SE', 210),
  ('essity', 'Essity', 'ESSITY-B', 'Nasdaq Stockholm', 'SE', 220),
  ('lifco', 'Lifco', 'LIFCO-B', 'Nasdaq Stockholm', 'SE', 230),
  ('nibe', 'NIBE', 'NIBE-B', 'Nasdaq Stockholm', 'SE', 240),
  ('nordea', 'Nordea', 'NDA-SE', 'Nasdaq Stockholm', 'SE', 250),
  ('sca', 'SCA', 'SCA-B', 'Nasdaq Stockholm', 'SE', 260),
  ('skanska', 'Skanska', 'SKA-B', 'Nasdaq Stockholm', 'SE', 270),
  ('skf', 'SKF', 'SKF-B', 'Nasdaq Stockholm', 'SE', 280),
  ('tele2', 'Tele2', 'TEL2-B', 'Nasdaq Stockholm', 'SE', 290),
  ('telia', 'Telia', 'TELIA', 'Nasdaq Stockholm', 'SE', 300)
on conflict (slug) do nothing;

insert into public.companies (
  id,
  slug,
  name,
  country_code,
  logo_path,
  is_active,
  created_at,
  updated_at
)
select
  id,
  slug,
  name,
  country_code,
  logo_path,
  is_active,
  created_at,
  updated_at
from public.forum_companies
where slug in (
  'abb',
  'addtech',
  'alfa-laval',
  'boliden',
  'epiroc',
  'eqt',
  'essity',
  'lifco',
  'nibe',
  'nordea',
  'sca',
  'skanska',
  'skf',
  'tele2',
  'telia'
)
on conflict (slug) do nothing;

insert into public.forum_company_collection_members (
  company_id,
  collection_id,
  sort_order
)
select company.id, collection.id, company.sort_order
from public.forum_companies company
join public.forum_company_collections collection
  on collection.slug = 'omxs30'
where company.slug in (
  'abb',
  'addtech',
  'alfa-laval',
  'boliden',
  'epiroc',
  'eqt',
  'essity',
  'lifco',
  'nibe',
  'nordea',
  'sca',
  'skanska',
  'skf',
  'tele2',
  'telia'
)
on conflict (company_id, collection_id) do nothing;

insert into public.company_instruments (
  company_id,
  symbol,
  exchange_name,
  exchange_mic,
  currency_code,
  tradingview_symbol,
  is_primary,
  is_active
)
select
  company.id,
  seed.symbol,
  'Nasdaq Stockholm',
  'XSTO',
  'SEK',
  seed.tradingview_symbol,
  true,
  true
from (
  values
    ('abb', 'ABB', 'OMXSTO:ABB'),
    ('addtech', 'ADDT-B', 'OMXSTO:ADDT_B'),
    ('alfa-laval', 'ALFA', 'OMXSTO:ALFA'),
    ('assa-abloy', 'ASSA-B', 'OMXSTO:ASSA_B'),
    ('boliden', 'BOL', 'OMXSTO:BOL'),
    ('epiroc', 'EPI-A', 'OMXSTO:EPI_A'),
    ('eqt', 'EQT', 'OMXSTO:EQT'),
    ('essity', 'ESSITY-B', 'OMXSTO:ESSITY_B'),
    ('evolution', 'EVO', 'OMXSTO:EVO'),
    ('handelsbanken', 'SHB-A', 'OMXSTO:SHB_A'),
    ('hexagon', 'HEXA-B', 'OMXSTO:HEXA_B'),
    ('hm', 'HM-B', 'OMXSTO:HM_B'),
    ('industrivarden', 'INDU-C', 'OMXSTO:INDU_C'),
    ('lifco', 'LIFCO-B', 'OMXSTO:LIFCO_B'),
    ('nibe', 'NIBE-B', 'OMXSTO:NIBE_B'),
    ('nordea', 'NDA-SE', 'OMXSTO:NDA_SE'),
    ('saab', 'SAAB-B', 'OMXSTO:SAAB_B'),
    ('sandvik', 'SAND', 'OMXSTO:SAND'),
    ('sca', 'SCA-B', 'OMXSTO:SCA_B'),
    ('seb', 'SEB-A', 'OMXSTO:SEB_A'),
    ('skanska', 'SKA-B', 'OMXSTO:SKA_B'),
    ('skf', 'SKF-B', 'OMXSTO:SKF_B'),
    ('swedbank', 'SWED-A', 'OMXSTO:SWED_A'),
    ('tele2', 'TEL2-B', 'OMXSTO:TEL2_B'),
    ('telia', 'TELIA', 'OMXSTO:TELIA')
) as seed(slug, symbol, tradingview_symbol)
join public.companies company on company.slug = seed.slug
on conflict (company_id, exchange_name, symbol) do update
set
  tradingview_symbol = coalesce(
    public.company_instruments.tradingview_symbol,
    excluded.tradingview_symbol
  ),
  exchange_mic = coalesce(
    public.company_instruments.exchange_mic,
    excluded.exchange_mic
  ),
  updated_at = now();
