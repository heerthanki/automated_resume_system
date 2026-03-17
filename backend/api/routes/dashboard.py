from fastapi import APIRouter
from core.database import get_db
from datetime import datetime, timedelta

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
async def get_stats():
    db = get_db()

    total_jobs        = await db.jobs.count_documents({})
    total_candidates  = await db.candidates.count_documents({})
    shortlisted       = await db.candidates.count_documents({"status": "shortlisted"})
    pipeline_runs     = await db.pipeline_runs.count_documents({})

    # Average score
    pipeline = await db.candidates.aggregate([
        {"$group": {"_id": None, "avg": {"$avg": "$overall_score"}}}
    ]).to_list(1)
    avg_score = round(pipeline[0]["avg"]) if pipeline else 0

    # Last 5 days activity
    activity = []
    for i in range(4, -1, -1):
        day = datetime.now() - timedelta(days=i)
        label = day.strftime("%a")
        count = await db.candidates.count_documents({
            "created_at": {
                "$gte": day.replace(hour=0, minute=0).isoformat(),
                "$lt":  day.replace(hour=23, minute=59).isoformat(),
            }
        })
        activity.append({"date": label, "processed": count})

    return {
        "total_jobs":        total_jobs,
        "total_candidates":  total_candidates,
        "shortlisted":       shortlisted,
        "pipeline_runs":     pipeline_runs,
        "avg_score":         avg_score,
        "recent_activity":   activity,
    }
