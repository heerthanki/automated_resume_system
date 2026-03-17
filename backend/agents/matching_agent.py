"""
Matching Agent
--------------
Input  : jd_schema + list of parsed candidates
Output : each candidate gets match_scores dict
LLM    : Groq — semantic comparison of resume vs JD
"""

from core.groq_client import call_llm_json
from models.schemas import PipelineState

SYSTEM_PROMPT = """
You are an expert technical recruiter. Compare a candidate's profile against
a job description and score the match on 4 dimensions.
Return ONLY valid JSON, no explanation, no markdown fences.

Required JSON format:
{
  "skills_match": 75,
  "experience_match": 80,
  "education": 70,
  "domain_relevance": 65
}

Rules:
- Each score is 0-100 (integer only)
- skills_match: how many required skills the candidate has
- experience_match: years of experience vs required range
- education: relevance and level of education
- domain_relevance: how relevant their past work domain is to this role
"""


def match_single_candidate(candidate: dict, jd_schema) -> dict:
    """
    Call Groq to score one candidate against the JD.
    Returns the candidate dict with match_scores added.
    """
    jd_summary = (
        f"Job: {jd_schema.title}\n"
        f"Required skills: {', '.join(jd_schema.required_skills)}\n"
        f"Experience needed: {jd_schema.experience}\n"
        f"Domain: {jd_schema.department}\n"
        f"Description: {jd_schema.description}"
    )

    candidate_summary = (
        f"Name: {candidate.get('name')}\n"
        f"Current role: {candidate.get('current_role')}\n"
        f"Skills: {', '.join(candidate.get('skills', []))}\n"
        f"Experience: {candidate.get('experience_years')} years\n"
        f"Education: {candidate.get('education')}\n"
        f"Summary: {candidate.get('parsed_summary', '')}"
    )

    try:
        scores = call_llm_json(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=(
                f"JOB DESCRIPTION:\n{jd_summary}\n\n"
                f"CANDIDATE PROFILE:\n{candidate_summary}\n\n"
                f"Score this candidate against the job."
            )
        )
        # Clamp all values 0-100
        candidate["match_scores"] = {
            k: max(0, min(100, int(v)))
            for k, v in scores.items()
        }
    except Exception as e:
        # Fallback scores on error
        candidate["match_scores"] = {
            "skills_match": 0,
            "experience_match": 0,
            "education": 0,
            "domain_relevance": 0,
        }
        candidate["match_error"] = str(e)

    return candidate


def run_matching_agent(state: PipelineState) -> PipelineState:
    """
    For each parsed candidate, calls Groq to score match against JD.
    Updates state.candidates with match_scores on each candidate.
    """
    state.log.append("[Matching Agent] Starting semantic matching...")

    if not state.jd_schema:
        state.error = "No JD schema found. JD Agent may have failed."
        state.log.append(f"[Matching Agent] ERROR: {state.error}")
        return state

    matched = []
    for i, candidate in enumerate(state.candidates):
        name = candidate.get("name", candidate.get("filename"))
        state.log.append(
            f"[Matching Agent] Matching {i+1}/{len(state.candidates)}: {name}"
        )
        matched.append(match_single_candidate(candidate, state.jd_schema))

    state.candidates = matched
    state.log.append(f"[Matching Agent] Done. Scored {len(matched)} candidates.")

    return state
