"""
Scoring Agent
-------------
Input  : candidates with match_scores
Output : each candidate gets overall_score (0-100)
LLM    : None — pure Python weighted math
"""

#from core.config import SCORE_WEIGHTS, SHORTLIST_THRESHOLD
from core.config import SCORE_WEIGHTS
from models.schemas import PipelineState


def compute_overall_score(match_scores: dict) -> int:
    """
    Weighted average of match_scores using weights from config.
    Returns integer 0-100.
    """
    total = 0
    weight_sum = 0

    for key, weight in SCORE_WEIGHTS.items():
        score = match_scores.get(key, 0)
        total += score * weight
        weight_sum += weight

    if weight_sum == 0:
        return 0

    return round(total / weight_sum)


def run_scoring_agent(state: PipelineState) -> PipelineState:
    """
    Computes overall_score for each candidate.
    Assigns status: 'shortlisted' or 'pending' based on threshold.
    Moves candidates to state.evaluated_candidates.
    """
    # state.log.append(
    #     f"[Scoring Agent] Computing scores (threshold: {SHORTLIST_THRESHOLD})..."
    # )
    threshold = getattr(state, 'threshold', 70)
    state.log.append(
        f"[Scoring Agent] Computing scores (threshold: {threshold})..."
    )

    evaluated = []
    for candidate in state.candidates:
        match_scores = candidate.get("match_scores", {})
        overall = compute_overall_score(match_scores)

        candidate["scores"] = match_scores
        candidate["overall_score"] = overall
        candidate["status"] = (
            "shortlisted" if overall >= threshold else "pending"
        )
        evaluated.append(candidate)

    shortlisted_count = sum(1 for c in evaluated if c["status"] == "shortlisted")
    state.evaluated_candidates = evaluated
    state.log.append(
        f"[Scoring Agent] Done. {shortlisted_count}/{len(evaluated)} candidates "
        f"scored ≥ {threshold}."
    )

    return state
