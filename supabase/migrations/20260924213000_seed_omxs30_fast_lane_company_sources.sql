-- Verified first-party sources for the OMXS30 fast-lane batch.
--
-- Only company/source pairs whose listing already exposes dated press,
-- report or calendar records are inserted. Existing follows, documents,
-- jobs, RLS and cron are unchanged. Re-applying the migration refreshes
-- these rows and does not create duplicates.

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
      'alfa-laval',
      'press_releases',
      'Alfa Laval',
      'https://www.alfalaval.com/media/newsroom/'
    ),
    (
      'alfa-laval',
      'financial_reports',
      'Alfa Laval',
      'https://www.alfalaval.com/media/newsroom/'
    ),
    (
      'assa-abloy',
      'press_releases',
      'ASSA ABLOY',
      'https://www.assaabloy.com/group/en/news-media/press-releases'
    ),
    (
      'assa-abloy',
      'financial_reports',
      'ASSA ABLOY',
      'https://www.assaabloy.com/group/en/investors/reports-presentations/interim-reports'
    ),
    (
      'handelsbanken',
      'financial_reports',
      'Handelsbanken',
      'https://www.handelsbanken.com/en/investor-relations'
    ),
    (
      'handelsbanken',
      'financial_calendar',
      'Handelsbanken',
      'https://www.handelsbanken.com/en/investor-relations'
    ),
    (
      'nibe',
      'press_releases',
      'NIBE',
      'https://www.nibegroup.com/investors/pm-news-reports/news-reports-2026'
    ),
    (
      'nibe',
      'financial_reports',
      'NIBE',
      'https://www.nibegroup.com/investors/pm-news-reports/news-reports-2026'
    ),
    (
      'nibe',
      'financial_calendar',
      'NIBE',
      'https://www.nibegroup.com/investors/calendar-2025-2026'
    )
) as source(company_slug, source_type, publisher, source_url)
join public.companies as company on company.slug = source.company_slug
on conflict (company_id, source_type, source_url) do update
set
  publisher = excluded.publisher,
  is_official = true,
  is_active = true,
  updated_at = now();
