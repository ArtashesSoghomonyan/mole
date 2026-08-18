# Mole

A full-stack social media platform built with Next.js, Django REST Framework, PostgreSQL, Redis and JWT authentication.

## ✨ Features

- User authentication
- Light/Dark themes
- Create posts
- Like posts
- Comments and replies
- Infinite scrolling feed
- User profiles
- Messaging
- Real-time notifications (Coming soon)
- Polls (Coming soon)
- Image filters (Coming soon)
- Email verification and OAuth (Coming soon)

## ⚙️ Requirements

The easiest way to run the full stack is with Docker.

* [🐳 Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes the Compose plugin) — or Docker Engine with Compose v2
* For the [Manual Setup](#-manual-setup-without-docker) below: [🐍 Python 3.14](https://www.python.org/), [🪐 uv](https://docs.astral.sh/uv/), [🐘 PostgreSQL](https://www.postgresql.org/), [⬢ Node.js and pnpm](https://nodejs.org/en)

## 🛠️ Tech Stack

Frontend:
- Next.js
- TypeScript
- Tailwind CSS
- ShadCN UI library

Backend:
- Django
- Django REST Framework
- PostgreSQL
- Redis
- SimpleJWT

## 📷 Screenshot (Home Feed)
![Feed](./docs/screenshots/1.png)

## 🚀 Quick Start (Docker)

### 1. Clone this repository

```shell
git clone https://github.com/ArtashesSoghomonyan/mole.git
cd mole
```

### 2. Run the stack

```shell
docker compose up --build
```

This builds and starts the whole stack. Migrations run automatically on startup.

| Service  | URL                                 |
|----------|-------------------------------------|
| Frontend | http://localhost:3000               |
| API      | http://localhost:8000/api           |
| Admin    | http://localhost:8000/admin/        |

PostgreSQL and Redis run in containers inside the Docker network.

### 3. Create a superuser and sample data

With the stack running, open a shell inside the backend container and run
Django management commands:

```shell
docker compose exec backend python manage.py createsuperuser
```

This project uses a custom user model where **email is the login**. The command
prompts for:

* `Email` — your login
* `Username` — lowercase letters and underscores only (`a-z_`)
* `First name` and `Last name`
* `Password`

To create one non-interactively (for scripts), pass the password through the
`DJANGO_SUPERUSER_PASSWORD` environment variable:

```shell
DJANGO_SUPERUSER_PASSWORD=admin docker compose exec backend \
  python manage.py createsuperuser --noinput \
  --email admin@example.com --username admin \
  --first_name Admin --last_name User
```

Then log in at http://localhost:8000/admin/ (or your custom `ADMIN_PATH`).

Seed the database with realistic dummy users, posts, likes, comments, and
follows — every generated user has the password `testpass123`:

```shell
docker compose exec backend python manage.py createdummydata
```

Useful options:

```shell
# 50 users with reproducible output
docker compose exec backend python manage.py createdummydata --count 50 --seed 42

# Skip the picsum.photos downloads and use the bundled dog.jpg instead
docker compose exec backend python manage.py createdummydata --no-online-images
```

> Note: `--seed` makes output reproducible, so re-running with the **same** seed
> on an already-seeded database fails on duplicate usernames. Omit `--seed` (or
> pick a new one) for each additional run.

When using the dev override, add the same `-f` flags as for `up`:

```shell
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend \
  python manage.py createdummydata
```

### 4. Stop the stack

```shell
docker compose down      # stops containers, keeps DB data & uploaded media
docker compose down -v   # full reset (also wipes the database and media)
```

### Development mode (hot reload)

The containers above run production-style servers (built frontend + daphne) and
do **not** reload on code changes. For day-to-day development, use the dev
override — the backend runs `runserver` (auto-reload) and the frontend runs
`next dev` (HMR):

```shell
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Or export `COMPOSE_FILE` once and use plain commands afterwards:

```shell
export COMPOSE_FILE="docker-compose.yml:docker-compose.dev.yml"
docker compose up --build
```

Code edits are picked up instantly; only rebuild when **dependencies** change
(`pyproject.toml` / `uv.lock` or `package.json` / `pnpm-lock.yaml`).

### Optional: override the defaults

All settings have sensible development defaults (dev-only `SECRET_KEY`,
`DB_PASSWORD=password`, `ADMIN_PATH=admin`). To override any of them, copy the
example env file — `docker compose` reads `.env` automatically:

```shell
cp .env.example .env
```

## 🛠️ Manual Setup (without Docker)

Prefer running everything locally? You'll need Python 3.14, uv, PostgreSQL,
Node.js, and pnpm installed on your machine.

### 1. Install the packages

```shell
cd mole/backend
uv venv
source .venv/bin/activate
uv sync
cd ../frontend
pnpm install
```

### 2. Create the environment variables

```shell
cd mole/backend
cp .env.example .env
cd ../frontend
cp .env.local.example .env.local
```

### 3. Create a database in Postgres shell

```sql
CREATE USER moleuser WITH PASSWORD 'password1234!';
CREATE DATABASE mole OWNER moleuser;
GRANT ALL PRIVILEGES ON DATABASE mole TO moleuser;
```

### 4. Run migrations and run the project

* Inside mole/backend run
  ```shell
  source .venv/bin/activate
  uv run manage.py migrate
  uv run manage.py runserver
  ```

* Inside mole/frontend run
  ```shell
  pnpm run dev
  ```

### 5. Create a superuser and sample data

From `mole/backend` (with the virtualenv activated):

```shell
uv run manage.py createsuperuser
uv run manage.py createdummydata
```

`createsuperuser` prompts for email (the login), username, first and last name,
and a password. The dummy data command seeds realistic users, posts, likes,
comments, and follows — every generated user's password is `testpass123`.

## 🧑‍💻 API Documentation

The API documentation is available via Swagger and drf-spectacular.
