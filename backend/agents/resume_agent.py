"""
Resume Agent
------------
Input  : folder_path with PDF resumes
Output : list of parsed candidate dicts
LLM    : Groq (llama3) — structures the raw text
Parser : PyMuPDF — extracts raw text from PDF
"""

import os
import fitz  # PyMuPDF
from core.groq_client import call_llm_json
from models.schemas import PipelineState

SYSTEM_PROMPT = """
You are an expert resume parser. Extract structured information from resume text.
Return ONLY valid JSON, no explanation, no markdown fences.

Required JSON format:
{
  "name": "full name",
  "current_role": "current job title at company",
  "education": "highest degree — institution",
  "experience_years": 4,
  "skills": ["skill1", "skill2", "skill3"],
  "work_history": [
    {"title": "role", "company": "company", "duration": "2 years"}
  ],
  "certifications": ["cert1"],
  "summary": "2 sentence professional summary"
}
"""


def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract raw text from a PDF using PyMuPDF."""
    try:
        doc = fitz.open(pdf_path)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text.strip()
    except Exception as e:
        return f"ERROR extracting PDF: {e}"


def parse_single_resume(pdf_path: str, job_id: str, run_id: str) -> dict:
    """
    1. Extract raw text via PyMuPDF
    2. Send to Groq for structuring
    3. Return candidate dict
    """
    filename = os.path.basename(pdf_path)
    raw_text = extract_text_from_pdf(pdf_path)

    if raw_text.startswith("ERROR"):
        return {
            "filename": filename,
            "job_id": job_id,
            "run_id": run_id,
            "error": raw_text,
        }

    # Truncate to 3000 chars to stay within token limits
    truncated = raw_text[:3000]

    try:
        parsed = call_llm_json(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=f"Parse this resume:\n\n{truncated}"
        )
    except Exception as e:
        parsed = {"name": filename.replace(".pdf", ""), "skills": [], "experience_years": 0}

    return {
        "id": None,  # assigned later
        "filename": filename,
        "job_id": job_id,
        "run_id": run_id,
        "raw_text": raw_text,
        "name": parsed.get("name", "Unknown"),
        "current_role": parsed.get("current_role", ""),
        "education": parsed.get("education", ""),
        "experience_years": int(parsed.get("experience_years", 0)),
        "skills": parsed.get("skills", []),
        "work_history": parsed.get("work_history", []),
        "certifications": parsed.get("certifications", []),
        "parsed_summary": parsed.get("summary", ""),
    }


def run_resume_agent(state: PipelineState) -> PipelineState:
    """
    Scans folder_path for PDF files, parses each one.
    Updates state.candidates with list of parsed candidate dicts.
    """
    state.log.append(f"[Resume Agent] Scanning folder: {state.folder_path}")

    if not os.path.isdir(state.folder_path):
        state.error = f"Folder not found: {state.folder_path}"
        state.log.append(f"[Resume Agent] ERROR: {state.error}")
        return state

    # Find all PDF files in folder
    pdf_files = [
        os.path.join(state.folder_path, f)
        for f in os.listdir(state.folder_path)
        if f.lower().endswith(".pdf")
    ]

    if not pdf_files:
        state.error = "No PDF files found in folder"
        state.log.append(f"[Resume Agent] ERROR: {state.error}")
        return state

    state.resume_files = pdf_files
    state.log.append(f"[Resume Agent] Found {len(pdf_files)} PDF files")

    candidates = []
    for i, pdf_path in enumerate(pdf_files):
        filename = os.path.basename(pdf_path)
        state.log.append(f"[Resume Agent] Parsing {i+1}/{len(pdf_files)}: {filename}")

        candidate = parse_single_resume(pdf_path, state.job_id, state.run_id)
        candidates.append(candidate)

    state.candidates = candidates
    state.log.append(f"[Resume Agent] Done. Parsed {len(candidates)} resumes.")

    return state
