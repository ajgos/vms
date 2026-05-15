# Railway Deployment

## Files added (Railway-specific — safe to delete to roll back)
```
backend/Dockerfile.railway
backend/railway.toml
frontend/Dockerfile.railway
frontend/railway.toml
RAILWAY.md  (this file)
```
Nothing else was modified.

## Steps

### 1. Install Railway CLI
```
npm install -g @railway/cli
railway login
```

### 2. Create a new Railway project
```
railway init
```

### 3. Add PostgreSQL
In the Railway dashboard → **New Service → Database → PostgreSQL**.  
Railway will inject `DATABASE_URL` automatically into services in the same project.

### 4. Deploy the backend
```
cd backend
railway service create --name backend
railway up --service backend
```

Set these environment variables on the backend service (Railway dashboard → backend → Variables):
| Variable | Value |
|----------|-------|
| `SECRET_KEY` | A long random string (e.g. `openssl rand -hex 32`) |
| `APP_ENV` | `production` |
| `SETUP_SECRET` | A secret for creating the first admin (then remove it) |

> `DATABASE_URL` is injected automatically from the linked Postgres service.

### 5. Get the backend URL
From the Railway dashboard, copy the backend public URL (e.g. `https://backend-xxx.railway.app`).

### 6. Deploy the frontend
```
cd ../frontend
railway service create --name frontend
railway up --service frontend
```

Set these environment variables on the frontend service:
| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | The backend URL from step 5 (no trailing slash) |

### 7. Create the first admin
```
curl -X POST https://<backend-url>/auth/setup-admin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yourdomain.com","password":"<strong-password>","setup_secret":"<SETUP_SECRET>"}'
```
Then remove `SETUP_SECRET` from the backend environment variables.

## Rollback
Delete the four Railway-specific files listed above. The original `docker-compose.yml` and `Dockerfile`s are untouched.

## Future cloud migration (GCP / Azure / AWS)
The production `Dockerfile.railway` files are standard multi-stage-ready Dockerfiles — they work on any container platform. When migrating:
- Use the same `Dockerfile.railway` (or rename to `Dockerfile.prod`)
- Replace Railway's managed Postgres with Cloud SQL / Azure Database / RDS
- Set the same environment variables in your cloud provider's secret manager
