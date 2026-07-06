# Dividend Lab Domain Layer

Business domains live under `lib/{domain}/`.

| Domain | Path | Status |
|--------|------|--------|
| Event Core | `lib/events/` | Active |
| Portfolio Core | `lib/portfolio/` | Planned |
| Market Core | `lib/market/` | Planned |
| Dividend Brain Core | `lib/brain/` | Planned |
| Community Core | `lib/community/` | Planned |
| User Core | `lib/user/` | Planned |

Each domain owns its types, providers, mappers, repository, services and presenters. UI consumes domain services only.

Full architectural map: `docs/project/CORE_DOMAINS.md`
