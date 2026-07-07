# Auth Email Setup

Dividend Lab uses Supabase Auth for MVP email and password authentication.

During development, Supabase's default auth confirmation email is acceptable. It keeps the MVP simple and avoids adding email infrastructure before the product needs it.

Before public launch, Dividend Lab should configure Supabase Auth email templates so confirmation, recovery and account emails use Dividend Lab wording and a calm, trustworthy tone.

A branded sender such as `noreply@dividendlab.se` can be considered closer to launch when trust, deliverability or user experience require it.

Do not add custom SMTP, paid email tooling or third-party email automation until it is needed for launch readiness.

Never store SMTP credentials or auth secrets in documentation.
