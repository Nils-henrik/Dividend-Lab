# DivBrain Internal Alpha activation note — 2026-08-08

This note records the approved pre-activation cost controls for DivBrain Internal Alpha. It contains no secrets.

## External AI Gateway budget

- Team AI Gateway spend limit: **USD 42 / month**
- Refresh period: **Monthly**
- Dedicated production key name: `divbrain-production`
- Automatic budget increases/refills: disabled by policy

The USD 42 limit was chosen from the Founder hard-stop policy of approximately SEK 400/month using the contemporaneous conversion observed on 2026-08-08: **SEK 400 ≈ USD 42.19**. The external cap is intentionally rounded down to USD 42.

## DivBrain server Cost Guard thresholds

Production environment values approved for Internal Alpha:

```text
DIVBRAIN_COST_GUARD_MAX_REQUEST_MICRO_USD=100000
DIVBRAIN_COST_GUARD_DAILY_HARD_LIMIT_MICRO_USD=2000000
DIVBRAIN_COST_GUARD_MONTHLY_TARGET_MICRO_USD=21000000
DIVBRAIN_COST_GUARD_MONTHLY_WARNING_MICRO_USD=31500000
DIVBRAIN_COST_GUARD_MONTHLY_HARD_LIMIT_MICRO_USD=42000000
```

Interpretation:

- max projected request: USD 0.10
- UTC-day hard stop: USD 2.00
- monthly target/review: USD 21.00 (~SEK 200)
- monthly warning/review: USD 31.50 (~SEK 300)
- monthly application hard stop: USD 42.00 (<~SEK 400 at activation FX)

## Activation state

The Cost Guard migration is applied and the dedicated Gateway-key wiring is merged. `AI_GATEWAY_API_KEY` is configured as a Production-sensitive project variable.

**Provider activation remains intentionally OFF at this checkpoint.** Do not set `DIVBRAIN_PROVIDER` or `DIVBRAIN_PROVIDER_MODEL` until the bounded live benchmark has been completed and reviewed.

The next approved step is the existing bounded benchmark: maximum 3 cases × 3 candidates × 256 output tokens, no retries, followed by Founder model selection and one allowlisted end-to-end Alpha verification.
