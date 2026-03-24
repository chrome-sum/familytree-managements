# 🌳 Families - Modern Family Tree Management

<p align="center">
  <img src="public/images/main-page.png" alt="Main Graph Page" width="800">
</p>

A high-performance Next.js application for visualizing and managing complex family trees with a robust PostgreSQL backend.

## ✨ Features

- **Interactive Tree Visualization**: Smooth, animated family tree with highlighting and zooming.
- **Deep Genealogy**: Support for tracing ancestors through multiple generations (70+ members seeded by default).
- **Comprehensive Relationships**: Handles complex unions, polygamy, and multi-parent child relationships.
- **Modern UI**: Built with a sleek dark-mode aesthetic using Tailwind CSS and Framer Motion.
- **Fast Backend**: Powered by Supabase/PostgreSQL with optimized `postgres.js` queries.

## 🚀 Getting Started

### 1. Prerequisites

- **Node.js**: 18.17.0 or later
- **PostgreSQL**: A running instance (Supabase recommended)

### 2. Installation

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory (you can copy from `.env.example`):

```bash
POSTGRES_URL="postgresql://user:password@localhost:5432/familytree"
```

*Note: The setup scripts automatically detect if you are running locally and adapt SSL settings accordingly.*

### 4. Database Setup & Seeding

The application includes a unified migration and seeding script that initializes the database schema, creates an admin user, and generates a rich sample family tree.

```bash
npm run seed
```

**Default Credentials:**
- **Email:** `admin@gmail.com`
- **Password:** `password`

### 5. Start Development

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to explore the tree.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (via [Supabase](https://supabase.com/))
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **ORM/Driver**: [postgres.js](https://github.com/porsager/postgres)

## 📁 Project Structure

- `/app`: Next.js pages and layouts.
- `/components`: Reusable UI components (Tree container, Sidebar, etc.).
- `/lib`: Database connection, authentication logic, and shared types.
- `/supabase`: SQL schema definitions.
- `migrate.js`: Unified script for database setup and sample data generation.

## 📄 License

MIT License - feel free to use and modify for your own projects!