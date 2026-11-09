# Architecture

Static site (GitHub Pages, no build step) + Supabase (Google login, Postgres, Realtime, private file storage). All libraries and fonts are bundled in `vendor/`.

| Part | Job |
| --- | --- |
| `config/app.js` | All settings |
| `supabase/schema.sql` | Tables and every security rule |
| `js/adapters/backend.js` | Picks a backend |
| `js/adapters/supabase.js` | The only code that talks to Supabase; swap this to change provider |
| `js/adapters/practice.js` | In-memory stand-in, loads only on localhost with `?practice` |
| `js/core/` | DOM builder, formatting, photo shrinking |
| `js/features/auth` | Login, not-allowed and not-ready screens |
| `js/features/chat` | Shell, sidebar, thread, message, composer |
| `js/features/admin` | Owner's allowlist |
| `js/features/profile` | Name, theme, sign out |
| `js/features/house` | Time-of-day house; a lit window per online member |
| `js/features/ui` | Avatar, dialog, theme |
| `css/` | Tokens first, one file per area |

**Security:** access is decided in Postgres (RLS). Only Google identities whose email is in `allowed_emails` and not blocked pass `is_family()`. Only the seeded owner passes `is_owner()`. Files are in a private bucket, served by signed links.

**New feature:** add `js/features/<name>/`, add its methods to the backend contract in both adapters, register it in `chat/shell.js`.

Tests: `node --test tests/`
