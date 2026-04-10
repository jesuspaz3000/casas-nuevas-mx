#!/bin/sh
set -e
# Hikari puede fallar en ~1s con "connection refused" si Postgres aún no abre 5432 (init de datos).
# Esperamos a que el puerto acepte TCP antes de arrancar Spring.
HOST="${POSTGRES_WAIT_HOST:-172.30.0.10}"
PORT="${POSTGRES_WAIT_PORT:-5432}"
MAX_TRIES="${POSTGRES_WAIT_MAX_TRIES:-90}"

echo "Waiting for PostgreSQL at ${HOST}:${PORT} ..."
n=0
while ! nc -z "$HOST" "$PORT" 2>/dev/null; do
  n=$((n + 1))
  if [ "$n" -gt "$MAX_TRIES" ]; then
    echo "Timeout: Postgres did not open ${PORT} after $((MAX_TRIES * 2))s (check docker logs casas-postgres)."
    exit 1
  fi
  sleep 2
done
echo "PostgreSQL port is open; starting Spring Boot."
exec java -jar /app/app.jar
