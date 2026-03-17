"""
Ranking Agent
-------------
Input  : evaluated + explained candidates
Output : ranked list (sorted by overall_score desc)
LLM    : None — pure Python sort
"""

from models.schemas import PipelineState
import uuid


def run_ranking_agent(state: PipelineState) -> PipelineState:
    """
    Sorts evaluated_candidates by overall_score descending.
    Assigns final rank and unique ID to each candidate.
    Moves result to state.ranked_candidates.
    """
    state.log.append("[Ranking Agent] Sorting candidates by score...")

    candidates = state.evaluated_candidates

    # Sort descending by overall_score
    ranked = sorted(candidates, key=lambda c: c.get("overall_score", 0), reverse=True)

    # Assign rank + unique ID
    for i, candidate in enumerate(ranked):
        candidate["rank"] = i + 1
        if not candidate.get("id"):
            candidate["id"] = str(uuid.uuid4())[:8]

    shortlisted = [c for c in ranked if c.get("status") == "shortlisted"]
    state.ranked_candidates = ranked

    state.log.append(
        f"[Ranking Agent] Done. Final ranking complete. "
        f"Top candidate: {ranked[0].get('name')} ({ranked[0].get('overall_score')}/100)"
        if ranked else "[Ranking Agent] No candidates to rank."
    )
    state.log.append(
        f"[Ranking Agent] Shortlisted: {len(shortlisted)} / {len(ranked)} candidates."
    )

    return state
