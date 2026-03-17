from fastapi import APIRouter, HTTPException, UploadFile, File
from models.schemas import Job, JobCreate
from core.database import get_db
import uuid, os, shutil

router = APIRouter(prefix="/jobs", tags=["jobs"])

UPLOAD_DIR = "uploads/jd"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("")
async def list_jobs():
    db = get_db()
    jobs = await db.jobs.find({}, {"_id": 0}).to_list(100)
    return jobs


@router.get("/{job_id}")
async def get_job(job_id: str):
    db = get_db()
    job = await db.jobs.find_one({"id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(404, "Job not found")
    return job


@router.post("")
async def create_job(data: JobCreate):
    db = get_db()
    job = Job(
        id=str(uuid.uuid4())[:8],
        **data.model_dump()
    )
    await db.jobs.insert_one(job.model_dump())
    return job


@router.delete("/{job_id}")
async def delete_job(job_id: str):
    db = get_db()
    result = await db.jobs.delete_one({"id": job_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Job not found")
    return {"deleted": job_id}


@router.post("/{job_id}/upload-jd")
async def upload_jd(job_id: str, file: UploadFile = File(...)):
    """Save uploaded JD file and extract text into job description."""
    db = get_db()
    job = await db.jobs.find_one({"id": job_id})
    if not job:
        raise HTTPException(404, "Job not found")

    # Save file
    path = os.path.join(UPLOAD_DIR, f"{job_id}_{file.filename}")
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Extract text if PDF
    jd_text = ""
    if file.filename.endswith(".pdf"):
        import fitz
        doc = fitz.open(path)
        jd_text = " ".join(page.get_text() for page in doc)
        doc.close()
    else:
        with open(path, "r", errors="ignore") as f:
            jd_text = f.read()

    await db.jobs.update_one(
        {"id": job_id},
        {"$set": {"description": jd_text[:3000], "jd_file": path}}
    )

    return {"message": "JD uploaded", "chars": len(jd_text)}
