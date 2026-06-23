# Deployment

## Backend on Railway or Render

1. Set the project root to `backend`.
2. Install dependencies from `requirements.txt`.
3. Start the API with `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
4. Set environment variables:
   - `APP_ENV=production`
   - `DATA_DIR=/app/data`
   - `SIMULATION_DEFAULT_RUNS=100000`
5. Mount or copy `data/seed` into the deployment image.

## Frontend on Vercel

1. Set the project root to `frontend`.
2. Set `NEXT_PUBLIC_API_BASE_URL` to the deployed backend URL.
3. Deploy with the default Next.js build command.

## Local Docker

Run both services:

```bash
docker compose up --build
```

Backend: `http://localhost:8000`

Frontend: `http://localhost:3000`
