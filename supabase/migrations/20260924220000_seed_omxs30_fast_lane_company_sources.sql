-- Verified official investor-relations entry points for Evolution, Essity and H&M.
--
-- Addtech, Boliden, Epiroc, Industrivärden, Nordea, SEB, Swedbank and Tele2 stay
-- without source rows. Their first-party pages were checked on 2026-09-24 and
-- do not yet expose all three source types with real dates under the existing
-- fetch policy. Existing company, follow, document and job rows are unchanged.

insert into public.company_sources (
  company_id,
  source_type,
  publisher,
  source_url,
  is_official,
  is_active
)
select
  company.id,
  source.source_type,
  source.publisher,
  source.source_url,
  true,
  true
from (
  values
    (
      'evolution',
      'press_releases',
      'Evolution',
      'https://www.evolution.com/investors/financial-publications/press-releases'
    ),
    (
      'evolution',
      'financial_reports',
      'Evolution',
      'https://www.evolution.com/investors/financial-publications/reports'
    ),
    (
      'evolution',
      'financial_calendar',
      'Evolution',
      'https://www.evolution.com/investors/financial-data/financial-calendar'
    ),
    (
      'essity',
      'press_releases',
      'Essity',
      'https://www.essity.com/media/press-releases/'
    ),
    (
      'essity',
      'financial_reports',
      'Essity',
      'https://www.essity.com/investors/financial-reports/interim-reports/'
    ),
    (
      'essity',
      'financial_calendar',
      'Essity',
      'https://www.essity.com/investors/calendar/'
    ),
    (
      'hm',
      'press_releases',
      'H&M Group',
      'https://hmgroup.com/media/news/'
    ),
    (
      'hm',
      'financial_reports',
      'H&M Group',
      'https://hmgroup.com/investors/'
    ),
    (
      'hm',
      'financial_calendar',
      'H&M Group',
      'https://hmgroup.com/investors/financial-calendar/'
    )
) as source(company_slug, source_type, publisher, source_url)
join public.companies as company on company.slug = source.company_slug
on conflict (company_id, source_type, source_url) do update
set
  publisher = excluded.publisher,
  is_official = true,
  is_active = true,
  updated_at = now();
