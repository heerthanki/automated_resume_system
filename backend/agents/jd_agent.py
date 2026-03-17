"""
JD Agent
--------
Input  : raw JD text (from uploaded file or manual input)
Output : structured JDSchema with skills, experience, etc.
LLM    : Groq (llama3)
"""

from core.groq_client import call_llm_json
from models.schemas import PipelineState, JDSchema

SYSTEM_PROMPT = """
You are an expert HR analyst. Extract structured information from a job description.
Return ONLY valid JSON, no explanation, no markdown fences.

Required JSON format:
{
  "title": "job title",
  "department": "department name",
  "experience": "e.g. 3-5 years",
  "experience_years_min": 3,
  "experience_years_max": 5,
  "location": "Remote / On-site / Hybrid",
  "description": "one line summary of role",
  "required_skills": ["skill1", "skill2"],
  "nice_to_have": ["skill1", "skill2"]
}
"""


def run_jd_agent(state: PipelineState) -> PipelineState:
    """
    Reads jd_text from state, calls Groq to extract structured JD schema.
    Updates state.jd_schema.
    """
    state.log.append("[JD Agent] Extracting requirements from JD...")

    if not state.jd_text.strip():
        state.log.append("[JD Agent] ERROR: No JD text provided.")
        state.error = "JD text is empty"
        return state

    try:
        result = call_llm_json(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=f"Extract structured data from this job description:\n\n{state.jd_text}"
        )

        state.jd_schema = JDSchema(
            title=result.get("title", ""),
            department=result.get("department", ""),
            experience=result.get("experience", ""),
            experience_years_min=int(result.get("experience_years_min") or 0),
            experience_years_max=int(result.get("experience_years_max") or 10),
            location=result.get("location", "Remote"),
            description=result.get("description", ""),
            required_skills=result.get("required_skills", []),
            nice_to_have=result.get("nice_to_have", []),
        )

        state.log.append(
            f"[JD Agent] Done. Found {len(state.jd_schema.required_skills)} required skills: "
            f"{', '.join(state.jd_schema.required_skills[:5])}"
        )

    except Exception as e:
        state.log.append(f"[JD Agent] ERROR: {e}")
        state.error = str(e)

    return state
