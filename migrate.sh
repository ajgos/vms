#!/bin/bash
set -e

echo "Starting Volunteer Management System..."
echo ""

# Run DB migrations inside the backend container
echo "Running database migrations..."
docker compose exec backend alembic upgrade head
echo "Migrations complete."
echo ""
echo "All services running:"
echo "  Frontend  → http://localhost:3000"
echo "  Backend   → http://localhost:8000"
echo "  API Docs  → http://localhost:8000/docs"
echo "  Adminer   → http://localhost:8080"
