# Firestore Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Public Read Visibility**: Every website visitor can read (`get`, `list`) documents in `/players/{playerId}` and `/teams/{teamId}` only when `resource.data.visibility == 'public'`.
2. **Owner-Restricted Writes**: Only an authenticated Master Owner (`roypriyam950@gmail.com` or `priyam1.3.2008@gmail.com` with verified email, or authorized Master Owner key) can create, update, or delete player profiles, uploaded player pictures, and team branding.
3. **Path & Schema Integrity**: Every document ID (`{playerId}`, `{teamId}`) must match `^[a-zA-Z0-9_\-]+$` with length `<= 128`. All string fields have explicit `.size()` bounds matching `firebase-blueprint.json`.
4. **Immutable Identity**: `id` and `visibility` cannot be mutated after creation.

## 2. The "Dirty Dozen" Payloads
1. **Shadow Field Injection on Player Create**: `{ "id": "ply_1", "name": "Test", "isVerified": true }` -> Rejected by `hasOnly()`.
2. **Oversized Player ID Poisoning**: Document ID of 500 characters -> Rejected by `isValidId()`.
3. **Invalid Role Enum**: `{ "role": "SuperHacker" }` -> Rejected by role enum check.
4. **Unverified Admin Email Spoof**: Auth token with `email == 'roypriyam950@gmail.com'` and `email_verified == false` -> Rejected by `email_verified == true`.
5. **Unauthorized Visitor Write**: Anonymous visitor without owner credentials attempting to overwrite `photo` -> Rejected.
6. **Value Poisoning on Update**: Updating `basePrice` to a string `"free"` -> Rejected by `isValidPlayer()`.
7. **Oversized Name String**: `name` of 500 characters (`> 120`) -> Rejected by `.size() <= 120`.
8. **Immutable ID Tampering on Update**: Changing `id` from `ply_01` to `ply_99` -> Rejected by `incoming().id == existing().id`.
9. **Blanket List Scraping of Non-Public Docs**: Querying `/players` where `visibility != 'public'` -> Rejected by `existing().visibility == 'public'`.
10. **Negative Purse Poisoning on Team**: Setting `purse: -5000` -> Rejected by `data.purse >= 0`.
11. **Shadow Field Injection on Team Update**: Adding `adminOverride: true` on `/teams/team_rcd` -> Rejected by `affectedKeys().hasOnly()`.
12. **Oversized Photo Payload (> 900KB)**: Injecting a 1MB string into `photo` -> Rejected by `data.photo.size() <= 900000`.
