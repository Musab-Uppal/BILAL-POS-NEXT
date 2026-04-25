# Bilal POS Frontend (Next.js + Supabase)

This project is a pure Next.js App Router frontend connected directly to Supabase.

No Django backend is required.
No legacy React Router/Vite app is required.

## Tech Stack

- Next.js (App Router)
- React
- Tailwind CSS
- Supabase Auth + Postgres

## Clone and Setup (For Collaborators)

1. Clone the repository:

   git clone https://github.com/Musab-Uppal/BILAL-POS-NEXT.git

2. Move into the frontend app:

   cd BILAL-POS-NEXT/frontend

3. Install dependencies:

   npm install

4. Create .env from .env.example and fill real values:

   copy .env.example .env

5. Bootstrap admin accounts in Supabase Auth (from .env):

   npm run bootstrap:admin

6. Apply schema/migrations to Supabase:

   npm run migrate:supabase

7. Verify health (tables, RPC, auth checks):

   npm run check:supabase

8. Run locally:

   npm run dev

## Environment Variables

Required variables are documented in .env.example.

Main keys:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- DATABASE_PASSWORD (used for direct migration script)
- Admin credentials (any of these pairs):
  - ADMIN_USERNAME + ADMIN_PASSWORD
  - USERNAME + PASSWORD
  - USER1NAME + USER1PASSWORD
  - USER2NAME + USER2PASSWORD

If an admin username is not an email, it is mapped to:

username@pos.local

Example:

bilal -> bilal@pos.local

## Auth and Access

- Middleware enforces authenticated access.
- Middleware also enforces admin-only access using usernames from environment variables.
- Non-admin users are signed out and redirected to /login.

## About .next

- .next is generated build cache/output by Next.js.
- Do not commit .next.
- If build cache gets corrupted locally, delete .next and rebuild:

  Remove-Item -Recurse -Force .next
  npm run build

## Useful Scripts

- npm run dev
- npm run build
- npm run start
- npm run bootstrap:admin
- npm run migrate:supabase
- npm run check:supabase

## Troubleshooting

1. Admin bootstrap says credentials missing:
   - Check .env keys match one of the supported credential pairs.

2. check:supabase fails RLS anonymous block:
   - Review your Supabase RLS policies and ensure public/anon cannot read private POS tables.

3. Login fails with a username:
   - Ensure bootstrap:admin ran successfully for that username.
