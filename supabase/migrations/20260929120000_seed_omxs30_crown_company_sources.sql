-- Verified first-party sources for Industrivärden, Nordea, Swedbank and Tele2.
-- Skanska is no longer a bot block, but dates are still missing, so it stays
-- source_link_only. Existing follows, documents and jobs are left in place.
-- This file is not applied by the change that adds it.

alter table public.company_facts drop constraint if exists company_facts_type_check;
alter table public.company_facts
  add constraint company_facts_type_check check (
    fact_type in (
      'ceo',
      'dividend_per_share',
      'dividend_currency',
      'dividend_year',
      'dividend_kind',
      'dividend_ex_date',
      'dividend_record_date',
      'dividend_payment_date'
    )
  );

update public.company_sources as source
set
  source_url = replacement.source_url,
  support_mode = replacement.support_mode,
  publisher = replacement.publisher,
  is_official = true,
  is_active = true,
  -- A replaced URL or support mode is a new source. Clear only that row so
  -- the daily cron treats an automated source as never checked.
  last_checked_at = null,
  last_success_at = null,
  last_failure_reason = null,
  updated_at = now()
from public.companies as company
join (
  values
    ('industrivarden', 'press_releases', 'https://www.industrivarden.se/media/Pressmeddelanden/', 'https://www.industrivarden.se/rss/', 'automated', 'Industrivärden'),
    ('industrivarden', 'financial_reports', 'https://www.industrivarden.se/', 'https://www.industrivarden.se/rss/', 'automated', 'Industrivärden'),
    ('industrivarden', 'financial_calendar', 'https://www.industrivarden.se/investerare/Kalender/', 'https://www.industrivarden.se/investerare/Kalender/', 'automated', 'Industrivärden'),
    ('nordea', 'press_releases', 'https://www.nordea.com/en/investors', 'https://www.nordea.com/en/investors', 'automated', 'Nordea'),
    ('nordea', 'financial_reports', 'https://www.nordea.com/en/investors', 'https://www.nordea.com/en/investors', 'automated', 'Nordea'),
    ('nordea', 'financial_calendar', 'https://www.nordea.com/en/investors', 'https://www.nordea.com/en/investors/financial-calendar', 'source_link_only', 'Nordea'),
    ('swedbank', 'press_releases', 'https://www.swedbank.com/investor-relations.html', 'https://www.swedbank.com/investor-relations.html', 'automated', 'Swedbank'),
    ('swedbank', 'financial_reports', 'https://www.swedbank.com/investor-relations.html', 'https://www.swedbank.com/investor-relations.html', 'automated', 'Swedbank'),
    ('swedbank', 'financial_calendar', 'https://www.swedbank.com/investor-relations.html', 'https://www.swedbank.com/investor-relations/financial-calendar.html', 'source_link_only', 'Swedbank'),
    ('tele2', 'press_releases', 'https://www.tele2.com/investors', 'https://www.tele2.com/investors/', 'automated', 'Tele2'),
    ('tele2', 'financial_reports', 'https://www.tele2.com/investors', 'https://www.tele2.com/investors/', 'automated', 'Tele2'),
    ('tele2', 'financial_calendar', 'https://www.tele2.com/investors', 'https://www.tele2.com/investors/', 'automated', 'Tele2'),
    ('skanska', 'press_releases', 'https://www.skanska.com/investors/', 'https://www.skanska.com/group/en/media/press-releases', 'source_link_only', 'Skanska'),
    ('skanska', 'financial_reports', 'https://www.skanska.com/investors/', 'https://www.skanska.com/group/en/investors/financial-reports/interim-reports', 'source_link_only', 'Skanska'),
    ('skanska', 'financial_calendar', 'https://www.skanska.com/investors/', 'https://www.skanska.com/group/en/investors/financial-reports/calendar', 'source_link_only', 'Skanska')
) as replacement(slug, source_type, previous_url, source_url, support_mode, publisher)
  on company.slug = replacement.slug
where source.company_id = company.id
  and source.source_type = replacement.source_type
  and source.source_url = replacement.previous_url
  and (
    source.source_url is distinct from replacement.source_url
    or source.support_mode is distinct from replacement.support_mode
  );

insert into public.company_sources (
  company_id,
  source_type,
  publisher,
  source_url,
  is_official,
  is_active,
  support_mode
)
select
  company.id,
  source.source_type,
  source.publisher,
  source.source_url,
  true,
  true,
  source.support_mode
from (
  values
    ('industrivarden', 'press_releases', 'Industrivärden', 'https://www.industrivarden.se/rss/', 'automated'),
    ('industrivarden', 'financial_reports', 'Industrivärden', 'https://www.industrivarden.se/rss/', 'automated'),
    ('industrivarden', 'financial_calendar', 'Industrivärden', 'https://www.industrivarden.se/investerare/Kalender/', 'automated'),
    ('nordea', 'press_releases', 'Nordea', 'https://www.nordea.com/en/investors', 'automated'),
    ('nordea', 'financial_reports', 'Nordea', 'https://www.nordea.com/en/investors', 'automated'),
    ('nordea', 'financial_calendar', 'Nordea', 'https://www.nordea.com/en/investors/financial-calendar', 'source_link_only'),
    ('nordea', 'dividend', 'Nordea', 'https://www.nordea.com/en/investors', 'automated'),
    ('swedbank', 'press_releases', 'Swedbank', 'https://www.swedbank.com/investor-relations.html', 'automated'),
    ('swedbank', 'financial_reports', 'Swedbank', 'https://www.swedbank.com/investor-relations.html', 'automated'),
    ('swedbank', 'financial_calendar', 'Swedbank', 'https://www.swedbank.com/investor-relations/financial-calendar.html', 'source_link_only'),
    ('tele2', 'press_releases', 'Tele2', 'https://www.tele2.com/investors/', 'automated'),
    ('tele2', 'financial_reports', 'Tele2', 'https://www.tele2.com/investors/', 'automated'),
    ('tele2', 'financial_calendar', 'Tele2', 'https://www.tele2.com/investors/', 'automated'),
    ('tele2', 'management', 'Tele2', 'https://www.tele2.com/investors/', 'automated'),
    ('skanska', 'press_releases', 'Skanska', 'https://www.skanska.com/group/en/media/press-releases', 'source_link_only'),
    ('skanska', 'financial_reports', 'Skanska', 'https://www.skanska.com/group/en/investors/financial-reports/interim-reports', 'source_link_only'),
    ('skanska', 'financial_calendar', 'Skanska', 'https://www.skanska.com/group/en/investors/financial-reports/calendar', 'source_link_only')
) as source(company_slug, source_type, publisher, source_url, support_mode)
join public.companies as company on company.slug = source.company_slug
on conflict (company_id, source_type, source_url) do update
set
  publisher = excluded.publisher,
  support_mode = excluded.support_mode,
  is_official = true,
  is_active = true,
  last_checked_at = case
    when company_sources.support_mode is distinct from excluded.support_mode then null
    else company_sources.last_checked_at
  end,
  last_success_at = case
    when company_sources.support_mode is distinct from excluded.support_mode then null
    else company_sources.last_success_at
  end,
  last_failure_reason = case
    when company_sources.support_mode is distinct from excluded.support_mode then null
    else company_sources.last_failure_reason
  end,
  updated_at = now();
