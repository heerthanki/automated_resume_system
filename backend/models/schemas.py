from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid


# ── Job Description ───────────────────────────────────────────
class JDSchema(BaseModel):
    title: str
    department: str
    experience: str
    location: str
    description: str
    required_skills: list[str] = []
    nice_to_have: list[str] = []
    experience_years_min: int = 0
    experience_years_max: int = 10


class JobCreate(BaseModel):
    title: str
    department: str
    experience: str
    location: str = "Remote"
    description: str = ""
    requirements: list[str] = []


class Job(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    title: str
    department: str
    experience: str
    location: str
    description: str
    requirements: list[str] = []
    status: str = "active"
    candidate_count: int = 0
    shortlisted_count: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    jd_schema: Optional[JDSchema] = None


# ── Candidate ─────────────────────────────────────────────────
class ScoreBreakdown(BaseModel):
    skills_match: int = 0
    experience_match: int = 0
    education: int = 0
    domain_relevance: int = 0


class Candidate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    job_id: str
    run_id: str
    filename: str
    name: str = "Unknown"
    current_role: str = ""
    education: str = ""
    experience_years: int = 0
    skills: list[str] = []
    raw_text: str = ""
    parsed_data: dict = {}
    scores: ScoreBreakdown = Field(default_factory=ScoreBreakdown)
    overall_score: int = 0
    strengths: list[str] = []
    gaps: list[str] = []
    summary: str = ""
    status: str = "pending"
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())


# ── Pipeline Run ──────────────────────────────────────────────
class PipelineRunRequest(BaseModel):
    job_id: str
    folder_path: str
    threshold: int = 70

class PipelineRun(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    job_id: str
    job_title: str = ""
    folder_path: str
    threshold: int = 70
    status: str = "pending"       # pending | running | completed | error
    total_resumes: int = 0
    processed: int = 0
    shortlisted: int = 0
    agent_status: dict = {}       # { agent_name: 'idle'|'running'|'done'|'error' }
    log_lines: list[str] = []
    error: Optional[str] = None
    started_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    completed_at: Optional[str] = None


# ── LangGraph State ───────────────────────────────────────────
class PipelineState(BaseModel):
    """Shared state passed between all LangGraph agent nodes."""
    run_id: str
    job_id: str
    folder_path: str
    threshold: int = 70

    # Populated by JD Agent
    jd_text: str = ""
    jd_schema: Optional[JDSchema] = None

    # Populated by Resume Agent (list of parsed candidates)
    resume_files: list[str] = []
    candidates: list[dict] = []

    # Populated by Matching + Scoring + Explanation agents
    evaluated_candidates: list[dict] = []

    # Populated by Ranking Agent
    ranked_candidates: list[dict] = []

    # Metadata
    log: list[str] = []
    error: Optional[str] = None
