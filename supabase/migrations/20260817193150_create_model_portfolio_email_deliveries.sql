create table if not exists public.model_portfolio_email_deliveries (
  transaction_id uuid not null references public.model_portfolio_transactions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  attempts integer not null default 0 check (attempts >= 0),
  provider_message_id text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz,
  primary key (transaction_id, user_id)
);

create index if not exists model_portfolio_email_deliveries_user_idx
  on public.model_portfolio_email_deliveries (user_id, created_at desc);

alter table public.model_portfolio_email_deliveries enable row level security;

revoke all on table public.model_portfolio_email_deliveries from anon, authenticated;
grant all on table public.model_portfolio_email_deliveries to service_role;

comment on table public.model_portfolio_email_deliveries is
  'Server-only delivery ledger for transactional email notifications about executed model-portfolio trades.';
