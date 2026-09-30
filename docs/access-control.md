# Access control contract

This document is the deterministic source of truth for the RoleGuard browser-testing demo.
Jev may choose browser actions, but it must not determine whether an observed result passes or fails.

| Role | Dashboard | Employees | Reports | Settings |
| --- | --- | --- | --- | --- |
| Admin | Allowed | Allowed | Allowed | Allowed |
| Manager | Allowed | Allowed | Allowed | Denied |
| Employee | Allowed | Denied | Denied | Denied |

## Expected route behavior

- Allowed routes render their page title and protected page content.
- Denied routes return HTTP 403 and render `403 · Access denied` without protected page content.
- Unauthenticated requests redirect to `/login`.
- The sidebar only displays routes allowed for the signed-in role.

## Local demo accounts

| Role | Username | Password |
| --- | --- | --- |
| Admin | `admin` | `admin123` |
| Manager | `manager` | `manager123` |
| Employee | `employee` | `employee123` |

These credentials are intentionally local, static, and suitable only for this controlled demo.
