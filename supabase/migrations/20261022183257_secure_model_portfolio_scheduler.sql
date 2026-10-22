-- Production installation approved by owner on 2026-10-22.
do $proposal$
declare
  target record;
  target_names text[] := array[
    'divlab-model-portfolios-research-nordic-summer',
    'divlab-model-portfolios-research-nordic-winter',
    'divlab-model-portfolios-research-us-1550-summer',
    'divlab-model-portfolios-research-us-1550-winter',
    'divlab-model-portfolios-research-us-1830-summer',
    'divlab-model-portfolios-research-us-1830-winter',
    'divlab-model-portfolios-research-us-2130-summer',
    'divlab-model-portfolios-research-us-2130-winter'
  ];
begin
  if (select count(*) from vault.decrypted_secrets
      where name = 'divlab_model_portfolio_cron_secret'
        and length(decrypted_secret) >= 32) <> 1 then
    raise exception 'Exactly one provisioned scheduler credential is required';
  end if;
  if (select count(*) from cron.job where jobname = any(target_names)) <> 8 then
    raise exception 'Scheduler catalog differs from reviewed eight-job inventory';
  end if;

  for target in select jobid from cron.job where jobname = any(target_names)
  loop
    perform cron.alter_job(job_id := target.jobid, command := $command$
      select net.http_post(
        url := 'https://divlab.se/api/internal/model-portfolios/run',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-divlab-scheduler', 'supabase-cron-v1',
          'Authorization', 'Bearer ' || (
            select decrypted_secret from vault.decrypted_secrets
            where name = 'divlab_model_portfolio_cron_secret'
            limit 1
          )
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 180000
      );
    $command$);
  end loop;
end;
$proposal$;
