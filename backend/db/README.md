# ERV Database Setup

This project uses PostgreSQL and keeps the database schema versioned through SQL migration files.

## Source of truth

The application schema is managed under `backend/db/migrations/`.

- `001_initial_schema.sql` contains the base schema and indexes.
- `002_legacy_compatibility.sql` adds compatibility updates for the existing deployed schema.
- `schema.sql` remains as a legacy reference file and is not used as the live migration source of truth.

## Migration tracking

Each successful migration is recorded in the `schema_migrations` table.

Table shape:

- `id` - serial primary key
- `migration_name` - unique migration filename
- `applied_at` - timestamp when the migration succeeded

## Environment variables

Required:

- `DATABASE_URL` - PostgreSQL connection string for the active environment

Optional for local development:

- `TEST_DATABASE_URL` - separate database for test runs

Example:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/erv_db
```

## Development

Create or update the local PostgreSQL database and then run:

```bash
cd backend
npm run db:migrate
```

To view pending/applied migration state:

```bash
cd backend
npm run db:migrate:status
```

Development seed data is kept separate and intentionally not part of the production migration flow:

```bash
cd backend
npm run db:seed
```

## Production / Neon PostgreSQL

Use your Neon `DATABASE_URL` in the environment variables for the deployment service.

The migration runner uses standard PostgreSQL SQL and can be run against Neon without changing the schema files.

## Safety rules

- Migrations are forward-only and non-destructive.
- Existing data is preserved.
- The migration runner stops immediately if any migration fails.
- Attendance, leave, payroll, and salary-related tables are intentionally kept in place because those features are paused but not deleted.

## Important tables

- `admins` and `roles`
- `employees` and `employee_attendance`
- `products` and `product_images`
- `gallery` and `gallery_categories`
- `careers` and `applications`
- `settings` and `company_information`
- `notifications`, `activity_logs`, and `refresh_tokens`
