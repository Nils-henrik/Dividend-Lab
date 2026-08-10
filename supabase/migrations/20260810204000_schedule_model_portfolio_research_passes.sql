-- Replace legacy model-portfolio dry-run cron slots with the four research passes.
-- Both UTC variants are scheduled so Europe/Stockholm DST is handled without
-- hard-coding a season. The route validates the local Stockholm window and
-- rejects the inactive partner with 202 outside_window.

do $$
declare
  r record;
begin
  for r in
    select jobid
    from cron.job
    where jobname like 'divlab-model-portfolios-dry-run-%'
       or jobname like 'divlab-model-portfolios-research-%'
  loop
    perform cron.unschedule(r.jobid);
  end loop;
end
$$;

select cron.schedule(
  'divlab-model-portfolios-research-nordic-summer',
  '20 7 * * 1-5',
  $$select net.http_post(url := 'https://divlab.se/api/internal/model-portfolios/run', headers := '{"Content-Type":"application/json","x-divlab-scheduler":"supabase-cron-v1"}'::jsonb, body := '{}'::jsonb, timeout_milliseconds := 180000);$$
);
select cron.schedule(
  'divlab-model-portfolios-research-nordic-winter',
  '20 8 * * 1-5',
  $$select net.http_post(url := 'https://divlab.se/api/internal/model-portfolios/run', headers := '{"Content-Type":"application/json","x-divlab-scheduler":"supabase-cron-v1"}'::jsonb, body := '{}'::jsonb, timeout_milliseconds := 180000);$$
);
select cron.schedule(
  'divlab-model-portfolios-research-us-1550-summer',
  '50 13 * * 1-5',
  $$select net.http_post(url := 'https://divlab.se/api/internal/model-portfolios/run', headers := '{"Content-Type":"application/json","x-divlab-scheduler":"supabase-cron-v1"}'::jsonb, body := '{}'::jsonb, timeout_milliseconds := 180000);$$
);
select cron.schedule(
  'divlab-model-portfolios-research-us-1550-winter',
  '50 14 * * 1-5',
  $$select net.http_post(url := 'https://divlab.se/api/internal/model-portfolios/run', headers := '{"Content-Type":"application/json","x-divlab-scheduler":"supabase-cron-v1"}'::jsonb, body := '{}'::jsonb, timeout_milliseconds := 180000);$$
);
select cron.schedule(
  'divlab-model-portfolios-research-us-1830-summer',
  '30 16 * * 1-5',
  $$select net.http_post(url := 'https://divlab.se/api/internal/model-portfolios/run', headers := '{"Content-Type":"application/json","x-divlab-scheduler":"supabase-cron-v1"}'::jsonb, body := '{}'::jsonb, timeout_milliseconds := 180000);$$
);
select cron.schedule(
  'divlab-model-portfolios-research-us-1830-winter',
  '30 17 * * 1-5',
  $$select net.http_post(url := 'https://divlab.se/api/internal/model-portfolios/run', headers := '{"Content-Type":"application/json","x-divlab-scheduler":"supabase-cron-v1"}'::jsonb, body := '{}'::jsonb, timeout_milliseconds := 180000);$$
);
select cron.schedule(
  'divlab-model-portfolios-research-us-2130-summer',
  '30 19 * * 1-5',
  $$select net.http_post(url := 'https://divlab.se/api/internal/model-portfolios/run', headers := '{"Content-Type":"application/json","x-divlab-scheduler":"supabase-cron-v1"}'::jsonb, body := '{}'::jsonb, timeout_milliseconds := 180000);$$
);
select cron.schedule(
  'divlab-model-portfolios-research-us-2130-winter',
  '30 20 * * 1-5',
  $$select net.http_post(url := 'https://divlab.se/api/internal/model-portfolios/run', headers := '{"Content-Type":"application/json","x-divlab-scheduler":"supabase-cron-v1"}'::jsonb, body := '{}'::jsonb, timeout_milliseconds := 180000);$$
);
