#!/bin/sh
set -e

if [ -n "$DB_PATH" ]; then
  mkdir -p "$(dirname "$DB_PATH")"
fi

python manage.py migrate --noinput

exec gunicorn core.wsgi:application --bind 0.0.0.0:8000 --workers 2 --timeout 120
