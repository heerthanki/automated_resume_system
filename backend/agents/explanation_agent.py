"""
Explanation Agent
-----------------
Input  : evaluated candidates with scores + jd_schema
Output : each candidate gets strengths, gaps, summary
LLM    : Groq (llama3)
"""

from core.groq_client import call_llm_json
from models.schemas import PipelineState

SYSTEM_PROMPT = """
You are a senior HR consultant. Given a candidate's profile and their match scores
against a job, generate a clear explainability report.
Return ONLY valid JSON, no explanation, no markdown fences.

Required JSON format:
{
  "summary": "2-3 sentence plain English evaluation of the candidate",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "gaps": ["gap 1", "gap 2"]
}

Rules:
- summary: honest, specific, mention score-relevant facts
- strengths: concrete skills or experiences that match the JD well
- gaps: specific skills or experience missing compared to JD
- Max 4 strengths, max 3 gaps
- Be direct, no corporate fluff
"""


def explain_single_candidate(candidate: dict, jd_schema) -> dict:
    """Generate explanation for one candidate using Groq."""

    context = (
        f"Job: {jd_schema.title} ({jd_schema.department})\n"
        f"Required skills: {', '.join(jd_schema.required_skills)}\n"
        f"Experience needed: {jd_schema.experience}\n\n"
        f"Candidate: {candidate.get('name')}\n"
        f"Role: {candidate.get('current_role')}\n"
        f"Skills: {', '.join(candidate.get('skills', []))}\n"
        f"Experience: {candidate.get('experience_years')} years\n"
        f"Education: {candidate.get('education')}\n"
        f"Overall score: {candidate.get('overall_score')}/100\n"
        f"Skills match: {candidate.get('scores', {}).get('skills_match', 0)}%\n"
        f"Experience match: {candidate.get('scores', {}).get('experience_match', 0)}%"
    )

    try:
        result = call_llm_json(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=f"Generate explainability report for this candidate:\n\n{context}"
        )
        candidate["summary"]   = result.get("summary", "")
        candidate["strengths"] = result.get("strengths", [])
        candidate["gaps"]      = result.get("gaps", [])
    except Exception as e:
        candidate["summary"]   = "Explanation generation failed."
        candidate["strengths"] = []
        candidate["gaps"]      = [str(e)]

    return candidate


def run_explanation_agent(state: PipelineState) -> PipelineState:
    """
    Generates explanation (summary, strengths, gaps) for each candidate.
    Only generates for shortlisted candidates to save API calls.
    Pending/rejected still get a brief explanation.
    """
    state.log.append("[Explanation Agent] Generating insights...")

    explained = []
    for i, candidate in enumerate(state.evaluated_candidates):
        name = candidate.get("name", candidate.get("filename"))
        state.log.append(
            f"[Explanation Agent] {i+1}/{len(state.evaluated_candidates)}: {name}"
        )
        explained.append(explain_single_candidate(candidate, state.jd_schema))

    state.evaluated_candidates = explained
    state.log.append(
        f"[Explanation Agent] Done. Generated reports for {len(explained)} candidates."
    )

    return state
