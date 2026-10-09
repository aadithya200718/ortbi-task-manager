# Security

## Security Model

Orbit uses a server-enforced security model shared by its web and Android clients.

- **JWT authentication:** private API routes require a verified Passport JWT. Resource ownership is derived from the authenticated token.
- **Password storage:** passwords are hashed with bcrypt at cost factor 12. Authentication DTOs enforce bcrypt's 72-byte boundary using UTF-8 byte length.
- **Anti-IDOR controls:** projects and tasks are queried through the authenticated user's ownership chain. A resource identifier alone is not sufficient for access.
- **Request validation:** a global NestJS validation pipe transforms approved inputs and rejects unknown properties. DTOs define field, enum, length, pagination, and date constraints.
- **Rate limiting:** NestJS Throttler applies a default request limit and stricter limits to registration and login.
- **HTTP hardening:** Helmet supplies security headers and CORS permits the explicitly configured web origin.
- **Client token handling:** the web token is session-scoped. Android uses Expo SecureStore with device-only protection. Unauthorized responses clear local authentication state.
- **Sanitized logging:** the error path redacts bearer credentials, JWTs, passwords, hashes, database URLs, and secret-like values. Request logs contain operational metadata only.
- **Transaction safety:** consistency-sensitive project and task writes use PostgreSQL `Serializable` transactions with bounded retries for recognized conflicts.
- **Database isolation in tests:** API integration tests require `TEST_DATABASE_URL` and reject development or production database targets.

Security controls reduce risk but do not make any application immune to vulnerabilities. Authorization and validation are intentionally enforced at the API trust boundary rather than delegated to clients.

## Secret Handling

- Never commit `.env`, `.env.local`, provider credentials, database passwords, signing secrets, or bearer tokens.
- Keep local secrets in ignored environment files.
- Store production credentials in Vercel, Render, Neon, or the relevant deployment provider's secret management interface.
- Commit only sanitized `.env.example` templates.
- Rotate a secret immediately if it is exposed, and verify dependent deployments after rotation.

## Reporting a Security Issue

If you discover a security issue, please open a private security advisory through GitHub rather than a public issue.

Include the affected component, reproduction steps, expected impact, and any suggested remediation. Do not include active credentials or sensitive user data in the report.
