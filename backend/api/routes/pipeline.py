from fastapi import APIRouter, BackgroundTasks, HTTPException
from datetime import datetime
import uuid, json

from models.schemas import PipelineRunRequest, PipelineRun
from core.database import get_db, get_redis
from agents.pipeline import run_pipeline

router = APIRouter(prefix="/pipeline", tags=["pipeline"])


async def _save_run(run: PipelineRun):
    db = get_db()
    await db.pipeline_runs.replace_one(
        {"id": run.id}, run.model_dump(), upsert=True
    )


async def _execute_pipeline(run_id: str, job_id: str, folder_path: str, jd_text: str, threshold: int = 70):
    """Background task — runs the full pipeline and saves results to MongoDB."""
    redis = get_redis()
    db    = get_db()

    async def update_run(patch: dict):
        await db.pipeline_runs.update_one({"id": run_id}, {"$set": patch})
        await redis.set(f"run:{run_id}", json.dumps(patch), ex=3600)

    try:
        await update_run({"status": "running"})

        final_state = run_pipeline(
            run_id=run_id,
            job_id=job_id,
            folder_path=folder_path,
            jd_text=jd_text,
            threshold=threshold,
        )

        ranked = final_state.get("ranked_candidates", [])
        shortlisted = [c for c in ranked if c.get("status") == "shortlisted"]

        if ranked:
            await db.candidates.insert_many(ranked)

        await db.jobs.update_one(
            {"id": job_id},
            {"$set": {
                "candidate_count": len(ranked),
                "shortlisted_count": len(shortlisted)
            }}
        )

        await update_run({
            "status": "completed" if not final_state.get("error") else "error",
            "total_resumes": len(final_state.get("resume_files", [])),
            "processed": len(ranked),
            "shortlisted": len(shortlisted),
            "log_lines": final_state.get("log", []),
            "error": final_state.get("error"),
            "completed_at": datetime.now().isoformat(),
        })

    except Exception as e:
        await update_run({
            "status": "error",
            "error": str(e),
            "completed_at": datetime.now().isoformat(),
        })


@router.post("/run")
async def start_pipeline(req: PipelineRunRequest, background_tasks: BackgroundTasks):
    db = get_db()

    job = await db.jobs.find_one({"id": req.job_id})
    if not job:
        raise HTTPException(404, f"Job {req.job_id} not found")

    jd_text = job.get("description", "") + "\n" + " ".join(job.get("requirements", []))

    run = PipelineRun(
        id=str(uuid.uuid4())[:8],
        job_id=req.job_id,
        job_title=job.get("title", ""),
        folder_path=req.folder_path,
        status="pending",
    )
    await _save_run(run)

    background_tasks.add_task(
        _execute_pipeline, run.id, req.job_id, req.folder_path, jd_text, req.threshold
    )

    return {"run_id": run.id, "status": "started"}


@router.get("/status/{run_id}")
async def get_pipeline_status(run_id: str):
    redis = get_redis()

    cached = await redis.get(f"run:{run_id}")
    if cached:
        return json.loads(cached)

    db = get_db()
    run = await db.pipeline_runs.find_one({"id": run_id}, {"_id": 0})
    if not run:
        raise HTTPException(404, "Run not found")
    return run


@router.get("/history")
async def get_pipeline_history():
    db = get_db()
    runs = await db.pipeline_runs.find(
        {}, {"_id": 0}
    ).sort("started_at", -1).limit(20).to_list(20)
    return runs