-- Verified official sources for Addtech, EQT, Evolution and NIBE.
--
-- Addtech press and reports are read from the Cision feed identifier embedded
-- on the issuer pages. EQT and Evolution stay on the issuer origin. NIBE press
-- stays on nibegroup.com; report PDFs are the English files from the MFN
-- archive widget embedded on the issuer investors page. Existing follows,
-- documents, jobs, RLS and cron are unchanged.

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
      'addtech',
      'press_releases',
      'Addtech',
      'https://www.addtech.com/investors-and-media/press-releases'
    ),
    (
      'addtech',
      'financial_reports',
      'Addtech',
      'https://www.addtech.com/investors-and-media/financial-reports'
    ),
    (
      'addtech',
      'financial_calendar',
      'Addtech',
      'https://www.addtech.com/investors-and-media/financial-calendar'
    ),
    (
      'eqt',
      'press_releases',
      'EQT',
      'https://eqtgroup.com/news'
    ),
    (
      'eqt',
      'financial_reports',
      'EQT',
      'https://eqtgroup.com/shareholders/reports-and-presentations'
    ),
    (
      'eqt',
      'financial_calendar',
      'EQT',
      'https://eqtgroup.com/shareholders/financial-calendar'
    ),
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
      'nibe',
      'press_releases',
      'NIBE',
      'https://www.nibegroup.com/news'
    ),
    (
      'nibe',
      'financial_reports',
      'NIBE',
      'https://www.nibegroup.com/investors'
    ),
    (
      'nibe',
      'financial_calendar',
      'NIBE',
      'https://www.nibegroup.com/investors'
    )
) as source(company_slug, source_type, publisher, source_url)
join public.companies as company on company.slug = source.company_slug
on conflict (company_id, source_type, source_url) do update
set
  publisher = excluded.publisher,
  is_official = true,
  is_active = true,
  updated_at = now();
