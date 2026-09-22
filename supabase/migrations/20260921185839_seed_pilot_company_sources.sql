-- Verified official investor-relations entry points for the five-company pilot.
--
-- These are source landing pages, not scraped documents. A later ingestion job
-- can discover report dates and document links from them only after a company
-- has at least one follower.

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
      'investor',
      'press_releases',
      'Investor AB',
      'https://www.investorab.com/investors-media/press-releases'
    ),
    (
      'investor',
      'financial_reports',
      'Investor AB',
      'https://www.investorab.com/investors-media/reports-presentations/'
    ),
    (
      'investor',
      'financial_calendar',
      'Investor AB',
      'https://www.investorab.com/investors-media/events-calendar'
    ),
    (
      'volvo',
      'press_releases',
      'Volvo Group',
      'https://www.volvogroup.com/en/news-and-media.html'
    ),
    (
      'volvo',
      'financial_reports',
      'Volvo Group',
      'https://www.volvogroup.com/en/investors/reports-and-presentations.html'
    ),
    (
      'volvo',
      'financial_calendar',
      'Volvo Group',
      'https://www.volvogroup.com/en/investors/financial-calendar.html'
    ),
    (
      'ericsson',
      'press_releases',
      'Ericsson',
      'https://www.ericsson.com/en/newsroom/latest-news?locs=68304&typeFilters=3'
    ),
    (
      'ericsson',
      'financial_reports',
      'Ericsson',
      'https://www.ericsson.com/en/investors/financial-reports-and-presentations'
    ),
    (
      'ericsson',
      'financial_calendar',
      'Ericsson',
      'https://www.ericsson.com/en/investors/financial-calendar'
    ),
    (
      'atlas-copco',
      'press_releases',
      'Atlas Copco Group',
      'https://www.atlascopcogroup.com/en/media/press-releases'
    ),
    (
      'atlas-copco',
      'financial_reports',
      'Atlas Copco Group',
      'https://www.atlascopcogroup.com/en/investors/reports-and-presentations'
    ),
    (
      'atlas-copco',
      'financial_calendar',
      'Atlas Copco Group',
      'https://www.atlascopcogroup.com/en/investors/calendar-and-events'
    ),
    (
      'astrazeneca',
      'press_releases',
      'AstraZeneca',
      'https://www.astrazeneca.com/media-centre/press-releases.html'
    ),
    (
      'astrazeneca',
      'financial_reports',
      'AstraZeneca',
      'https://www.astrazeneca.com/investor-relations/results-and-presentations.html'
    ),
    (
      'astrazeneca',
      'financial_calendar',
      'AstraZeneca',
      'https://www.astrazeneca.com/investor-relations/events.html'
    )
) as source(company_slug, source_type, publisher, source_url)
join public.companies as company on company.slug = source.company_slug
on conflict (company_id, source_type, source_url) do update
set
  publisher = excluded.publisher,
  is_official = true,
  is_active = true,
  updated_at = now();
