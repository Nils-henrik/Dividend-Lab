-- Verified official investor-relations entry points for Saab, Sandvik and SCA.
--
-- The other OMXS30 companies stay without source rows until a first-party page
-- exposes press releases, reports and a financial calendar in markup this
-- worker can parse. Existing company, follow, document and job rows are left
-- unchanged. The conflict target is the existing source identity, so applying
-- the migration again only refreshes these verified rows.

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
      'saab',
      'press_releases',
      'Saab',
      'https://www.saab.com/newsroom/press-releases'
    ),
    (
      'saab',
      'financial_reports',
      'Saab',
      'https://www.saab.com/investors/reports-and-presentations'
    ),
    (
      'saab',
      'financial_calendar',
      'Saab',
      'https://www.saab.com/investors/calendar'
    ),
    (
      'sandvik',
      'press_releases',
      'Sandvik',
      'https://www.home.sandvik/en/investors/press-releases/'
    ),
    (
      'sandvik',
      'financial_reports',
      'Sandvik',
      'https://www.home.sandvik/en/investors/reports-presentations/'
    ),
    (
      'sandvik',
      'financial_calendar',
      'Sandvik',
      'https://www.home.sandvik/en/investors/calendar/'
    ),
    (
      'sca',
      'press_releases',
      'SCA',
      'https://www.sca.com/en/media/press-releases/'
    ),
    (
      'sca',
      'financial_reports',
      'SCA',
      'https://www.sca.com/en/investors/reports-and-presentations/interim-reports/'
    ),
    (
      'sca',
      'financial_calendar',
      'SCA',
      'https://www.sca.com/en/investors/ir-calendar/'
    )
) as source(company_slug, source_type, publisher, source_url)
join public.companies as company on company.slug = source.company_slug
on conflict (company_id, source_type, source_url) do update
set
  publisher = excluded.publisher,
  is_official = true,
  is_active = true,
  updated_at = now();
