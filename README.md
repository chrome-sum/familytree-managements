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
