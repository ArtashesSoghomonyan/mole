# syntax=docker/dockerfile:1

# =============================================================================
# Stage 1: builder — install Python dependencies with uv
# =============================================================================
# Python 3.14 is required by pyproject.toml ("requires-python = >=3.14.6").
FROM python:3.14-slim AS builder

# UV_COMPILE_BYTECODE=1  -> pre-compile .py files to .pyc (faster startup)
# UV_LINK_MODE=copy      -> copy files into the venv instead of hardlinking.
#                           Hardlinks don't survive being COPY'd into another
#                           image, so this keeps the venv self-contained.
# UV_PYTHON=/usr/local/bin/python3 -> force the base image's interpreter.
#                           Otherwise uv downloads its own managed CPython
#                           (backend/.python-version pins 3.14.6, which the
#                           python:3.14-slim base image doesn't match) into
#                           /root/.local/share/uv/. Only /app/.venv is copied
#                           to the runtime stage, so a managed interpreter
#                           would leave the venv's python symlink dangling
#                           and break every entry point (daphne, manage.py).
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON=/usr/local/bin/python3

WORKDIR /app

# Install uv, the package manager this project uses (see uv.lock).
RUN pip install --no-cache-dir uv

# Copy ONLY the dependency manifests first. Docker caches this layer, so
# dependency installs are only re-run when pyproject.toml / uv.lock change —
# not on every source-code edit.
COPY pyproject.toml uv.lock ./

# Install locked dependencies into /app/.venv.
#   --frozen             -> use uv.lock exactly as-is (no re-resolving)
#   --no-install-project -> only install deps, not the app itself yet
#                           (there's no source code in this layer)
RUN uv sync --frozen --no-install-project

# Now copy the rest of the application source.
COPY . .

# Re-sync so everything (including dev-group deps used when DEBUG=true,
# e.g. django-extensions) is present. This project is a "virtual" Django
# project (no installable package), so this mostly just finishes the venv.
RUN uv sync --frozen

# =============================================================================
# Stage 2: runtime — a minimal image with just the venv + source
# =============================================================================
FROM python:3.14-slim AS runtime

# Create a non-root user to run the app (good security practice).
RUN groupadd --gid 1000 app \
    && useradd --uid 1000 --gid app --shell /bin/bash --create-home app

WORKDIR /app

# Copy the virtualenv built in stage 1.
COPY --from=builder --chown=app:app /app/.venv /app/.venv

# Copy the application source (respects .dockerignore).
COPY --chown=app:app . .

# Ensure the media upload directory exists and belongs to the app user.
# `.dockerignore` excludes the media dir, so without this a fresh `media`
# named volume would be created root-owned and the app user (uid 1000)
# couldn't write uploads. Docker seeds new volumes from this path.
#
# Same for staticfiles: WORKDIR creates /app as root and COPY --chown only
# fixes the files inside it, so /app stays root-owned (0755). `collectstatic`
# then fails with "PermissionError: [Errno 13] Permission denied:
# '/app/staticfiles'" when it tries to os.makedirs() the STATIC_ROOT.
# Pre-create + chown it here so the app user can write to it.
RUN mkdir -p /app/media /app/staticfiles && chown app:app /app/media /app/staticfiles

# Put the venv's binaries (python, daphne, manage.py wrapper, etc.) on PATH.
# PYTHONUNBUFFERED / PYTHONDONTWRITEBYTECODE make logs immediate and avoid
# writing .pyc files at runtime.
ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

USER app

EXPOSE 8000

# Daphne is the ASGI server required for Django Channels / WebSockets.
# The migration step itself is run by docker-compose (see command: there).
CMD ["daphne", "config.asgi:application", "-b", "0.0.0.0", "-p", "8000"]
