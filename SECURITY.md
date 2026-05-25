# InvoiceKit Security Notes

InvoiceKit is currently a no-signup frontend MVP. That means there is no backend database, no authentication system, no server-side PDF storage, and no payment API integration yet.

## Current Stage 1 security posture

### Implemented now

- React JSX rendering is used instead of `dangerouslySetInnerHTML`, reducing XSS risk from invoice fields.
- Logo uploads are limited to image MIME types and capped below 750KB.
- Text fields and line item descriptions have practical length limits.
- Quantity and price inputs are capped to reduce accidental huge values.
- PDF download is blocked when a priced item has no description.
- Saved data stays in the user's browser through localStorage only.
- No passwords, JWTs, API keys, M-Pesa Daraja secrets, or email service secrets are stored in the frontend.
- Saved document deletion requires confirmation.

### Current limitation

Invoices saved in localStorage are readable by JavaScript running on the page. This is acceptable for the no-login MVP, but it is not a long-term storage strategy for sensitive invoice history.

## Rules for future backend phases

When accounts, subscriptions, email sending, invoice history sync, M-Pesa, or stored PDFs are added:

1. Never store plain-text passwords. Use Supabase Auth, Firebase Auth, or a secure password hashing strategy such as Argon2id or bcrypt.
2. Never store JWTs in localStorage. Prefer secure httpOnly cookies where possible.
3. Never expose API keys client-side. Daraja, email, and payment provider secrets must stay server-side.
4. Validate invoice ownership on every API endpoint.
5. Validate every field server-side, even if the frontend already validates it.
6. Encrypt sensitive database fields where practical, including KRA PINs and payment details.
7. Use strict CORS and production security headers.
8. Use signed URLs for stored PDFs.
9. Add account deletion and data export/delete flows before public SaaS launch.
10. Publish a privacy policy before users store real client data.

## Pre-launch requirement

Before accepting paying users, complete a dedicated security review covering authentication, database rules, file storage, payment callbacks, privacy policy, and data retention.
