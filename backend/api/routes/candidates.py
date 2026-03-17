from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from core.database import get_db

router = APIRouter(prefix="/candidates", tags=["candidates"])


class StatusUpdate(BaseModel):
    status: str  # shortlisted | rejected | pending


@router.get("")
async def list_candidates(job_id: str = None, run_id: str = None):
    db = get_db()
    query = {}
    if job_id: query["job_id"] = job_id
    if run_id: query["run_id"] = run_id

    candidates = await db.candidates.find(
        query, {"_id": 0, "raw_text": 0}  # exclude large raw text
    ).sort("overall_score", -1).to_list(500)
    return candidates


@router.get("/{candidate_id}")
async def get_candidate(candidate_id: str):
    db = get_db()
    candidate = await db.candidates.find_one(
        {"id": candidate_id}, {"_id": 0, "raw_text": 0}
    )
    if not candidate:
        raise HTTPException(404, "Candidate not found")
    return candidate


@router.patch("/{candidate_id}/status")
async def update_status(candidate_id: str, body: StatusUpdate):
    valid = {"shortlisted", "rejected", "pending"}
    if body.status not in valid:
        raise HTTPException(400, f"Status must be one of {valid}")

    db = get_db()
    result = await db.candidates.update_one(
        {"id": candidate_id},
        {"$set": {"status": body.status}}
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Candidate not found")
    return {"id": candidate_id, "status": body.status}
