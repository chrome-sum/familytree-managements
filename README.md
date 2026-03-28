# Families - Modern Family Tree Management

<p align="center">
  <img src="public/images/main-page.png" alt="Main Graph Page" width="800">
</p>

A Next.js application for visualizing and managing family trees with a PostgreSQL backend.

## Features

- Interactive family tree visualization
- Pinch-to-zoom (mobile), wheel-to-zoom (desktop), and pan controls
- Support for multi-generation genealogy data
- Role-based access control:
  - `admin`: manage users and family tree
  - `editor`: manage family tree
  - `viewer`: view family tree
  - `guest`: must log in first and cannot view the tree
- Admin pages:
  - `/users`: user management
  - `/audit-logs`: audit trail for admin/editor actions
- PostgreSQL backend using `postgres.js`
- Modern UI built with Tailwind CSS and Framer Motion

## Getting Started

### 1. Prerequisites

- Node.js 18.17.0 or later
- PostgreSQL database (Supabase is supported)

### 2. Installation

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the project root:

```bash
POSTGRES_URL="postgresql://user:password@localhost:5432/familytree"
JWT_SECRET="replace-with-a-secure-random-secret"
```

### 4. Database Setup

Apply the database schema:

```bash
npm run db:setup
```

Important:
- This script applies `supabase/schema.sql`
- It does not seed sample family data
- It does not create a default admin user
- It is intended for schema setup only

### 5. Apply Migrations (Recommended for existing DB)

If your database already exists, apply SQL migrations from `supabase/migrations`, especially:

- `202603280001_add_users_role_rbac.sql`
- `202603280003_add_audit_logs.sql`

### 6. Create Initial Admin

After the schema is ready, run the app and open:

```text
/init-admin
```

Use that page to create your first admin account.

### 7. Start Development

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Deploy to Supabase and Vercel

This section covers a production deployment using Supabase for PostgreSQL and Vercel for hosting.

### 1. Create a Supabase project

1. Open the Supabase dashboard.
2. Create a new project.
3. Wait until the database is ready.
4. Open `Project Settings -> Database`.
5. Copy the connection string and use the direct Postgres connection string for `POSTGRES_URL`.

Notes:
- This app uses `postgres.js` and connects directly to PostgreSQL.
- Keep the database password private.

### 2. Apply the database schema in Supabase

You can set up the database in either of these ways.

Option A: Using the SQL Editor in Supabase
1. Open `SQL Editor` in your Supabase project.
2. Copy the contents of `supabase/schema.sql`.
3. Run the SQL script.
4. If your database already existed before this version, also run the SQL files inside `supabase/migrations` in order.

Option B: Using the local setup script
1. Create a local `.env` file.
2. Fill in:

```bash
POSTGRES_URL="your-supabase-postgres-connection-string"
JWT_SECRET="generate-a-long-random-secret"
```

3. Run:

```bash
npm install
npm run db:setup
```

Important:
- `npm run db:setup` applies `supabase/schema.sql`.
- It does not create sample family members.
- It does not create the initial admin account.

### 3. Prepare environment variables for production

Set these variables in Vercel:

```bash
POSTGRES_URL="your-supabase-postgres-connection-string"
JWT_SECRET="generate-a-long-random-secret"
NEXT_PUBLIC_SUPABASE_PROJECT_ID="your-supabase-project-id"
```

Notes:
- `JWT_SECRET` should be long, random, and unique for production.
- `NEXT_PUBLIC_SUPABASE_PROJECT_ID` is listed in `.env.example`. If you are not using it in your deployment flow yet, you can still set it to keep environments aligned with the project template.

### 4. Push the project to GitHub

1. Create a GitHub repository.
2. Push this project to that repository.
3. Make sure `.env` is not committed.

### 5. Import the project into Vercel

1. Open the Vercel dashboard.
2. Click `Add New -> Project`.
3. Import the GitHub repository.
4. In the project setup screen, add the environment variables:
   - `POSTGRES_URL`
   - `JWT_SECRET`
   - `NEXT_PUBLIC_SUPABASE_PROJECT_ID`
5. Click `Deploy`.

### 6. Verify the production deployment

After Vercel finishes deploying:

1. Open the Vercel production URL.
2. Visit `/init-admin`.
3. Create the first admin account.
4. Log in with that admin account.
5. Confirm that:
   - the family tree page loads
   - `/users` is accessible for admin
   - `/audit-logs` is accessible for admin

### 7. Redeploy after future schema changes

If you update the database schema later:

1. Apply the new SQL changes to Supabase first.
2. Then redeploy the app on Vercel if application code also changed.

Recommended order:
1. Update database schema or run the new migration.
2. Update environment variables if needed.
3. Redeploy Vercel.

### 8. Production checklist

- Supabase project is created
- `supabase/schema.sql` has been applied
- Required migrations have been applied if using an older database
- `POSTGRES_URL` is set in Vercel
- `JWT_SECRET` is set in Vercel
- Initial admin has been created from `/init-admin`
- Admin can log in successfully after deployment

## Tech Stack

- Framework: Next.js
- Database: PostgreSQL / Supabase
- Driver: `postgres.js`
- Styling: Tailwind CSS
- Animation: Framer Motion
- Icons: Lucide React

## Project Structure

- `/app`: routes and layouts
- `/components`: UI components
- `/lib`: auth, db access, server actions, and shared types
- `/supabase`: SQL schema
- `migrate.js`: schema setup script

## Notes

- Access to the family tree requires login
- User management is available only for `admin`
- Family tree editing is available for `admin` and `editor`
- RBAC policy can be tested with:

```bash
npm run test:rbac
```

## Credits

- Original project: [fiandev/familytree-managements](https://github.com/fiandev/familytree-managements)
- This repository is an extended fork with RBAC, admin user management, audit logs, and improved mobile/desktop interaction.

## License

MIT
