from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from core.database import connect_mongo, disconnect_mongo, connect_redis, disconnect_redis
from api.routes import jobs, candidates, pipeline, dashboard


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_mongo()
    await connect_redis()
    yield
    # Shutdown
    await disconnect_mongo()
    await disconnect_redis()


app = FastAPI(
    title="TalentOS API",
    description="Multi-Agent AI Recruitment Pipeline",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers under /api prefix
app.include_router(jobs.router,       prefix="/api")
app.include_router(candidates.router, prefix="/api")
app.include_router(pipeline.router,   prefix="/api")
app.include_router(dashboard.router,  prefix="/api")


@app.get("/")
async def root():
    return {"status": "TalentOS API running"}
