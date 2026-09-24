-- Verified official investor-relations sources for Essity and H&M.
insert into public.company_sources (
  company_id, source_type, publisher, source_url, is_official, is_active
)
select company.id, source.source_type, source.publisher, source.source_url, true, true
from (
  values
    ('essity','press_releases','Essity','https://www.essity.com/media/press-releases/'),
    ('essity','financial_reports','Essity','https://www.essity.com/investors/financial-reports/interim-reports/'),
    ('essity','financial_calendar','Essity','https://www.essity.com/investors/calendar/'),
    ('hm','press_releases','H&M Group','https://hmgroup.com/media/news/'),
    ('hm','financial_reports','H&M Group','https://hmgroup.com/investors/'),
    ('hm','financial_calendar','H&M Group','https://hmgroup.com/investors/financial-calendar/')
) as source(company_slug, source_type, publisher, source_url)
join public.companies as company on company.slug = source.company_slug
on conflict (company_id, source_type, source_url) do update
set publisher=excluded.publisher,is_official=true,is_active=true,updated_at=now();
