"""
LangGraph Pipeline
------------------
Orchestrates all 6 agents as a directed state graph.

Flow:
  START
    → jd_agent         (extract JD requirements via Groq)
    → resume_agent     (parse PDFs via PyMuPDF + Groq)
    → matching_agent   (score each resume vs JD via Groq)
    → scoring_agent    (compute weighted overall score, pure Python)
    → explanation_agent(generate insights via Groq)
    → ranking_agent    (sort by score, pure Python)
  END

State is a PipelineState dict passed between all nodes.
If any node sets state["error"], the graph routes to END early.
"""

from langgraph.graph import StateGraph, END
from typing import TypedDict, Optional
import json

from agents.jd_agent         import run_jd_agent
from agents.resume_agent      import run_resume_agent
from agents.matching_agent    import run_matching_agent
from agents.scoring_agent     import run_scoring_agent
from agents.explanation_agent import run_explanation_agent
from agents.ranking_agent     import run_ranking_agent
from models.schemas import PipelineState


# ── LangGraph requires a TypedDict for state ─────────────────
class GraphState(TypedDict):
    run_id: str
    job_id: str
    folder_path: str
    jd_text: str
    jd_schema: Optional[dict]
    threshold: int
    resume_files: list
    candidates: list
    evaluated_candidates: list
    ranked_candidates: list
    log: list
    error: Optional[str]


# ── Node wrappers (convert dict ↔ PipelineState) ─────────────
def _to_state(data: dict) -> PipelineState:
    return PipelineState(**{k: v for k, v in data.items() if k in PipelineState.model_fields})


def _from_state(state: PipelineState) -> dict:
    return state.model_dump()


def node_jd_agent(data: GraphState) -> GraphState:
    state = _to_state(data)
    state = run_jd_agent(state)
    return {**data, **_from_state(state)}


def node_resume_agent(data: GraphState) -> GraphState:
    state = _to_state(data)
    state = run_resume_agent(state)
    return {**data, **_from_state(state)}


def node_matching_agent(data: GraphState) -> GraphState:
    state = _to_state(data)
    state = run_matching_agent(state)
    return {**data, **_from_state(state)}


def node_scoring_agent(data: GraphState) -> GraphState:
    state = _to_state(data)
    state = run_scoring_agent(state)
    return {**data, **_from_state(state)}


def node_explanation_agent(data: GraphState) -> GraphState:
    state = _to_state(data)
    state = run_explanation_agent(state)
    return {**data, **_from_state(state)}


def node_ranking_agent(data: GraphState) -> GraphState:
    state = _to_state(data)
    state = run_ranking_agent(state)
    return {**data, **_from_state(state)}


# ── Error gate: stop graph if error is set ────────────────────
def should_continue(data: GraphState) -> str:
    return "stop" if data.get("error") else "continue"


# ── Build the graph ───────────────────────────────────────────
def build_pipeline() -> StateGraph:
    graph = StateGraph(GraphState)

    # Register nodes
    graph.add_node("jd_agent",          node_jd_agent)
    graph.add_node("resume_agent",      node_resume_agent)
    graph.add_node("matching_agent",    node_matching_agent)
    graph.add_node("scoring_agent",     node_scoring_agent)
    graph.add_node("explanation_agent", node_explanation_agent)
    graph.add_node("ranking_agent",     node_ranking_agent)

    # Entry point
    graph.set_entry_point("jd_agent")

    # Edges with error gates after each critical step
    graph.add_conditional_edges(
        "jd_agent",
        should_continue,
        {"continue": "resume_agent", "stop": END}
    )
    graph.add_conditional_edges(
        "resume_agent",
        should_continue,
        {"continue": "matching_agent", "stop": END}
    )
    graph.add_edge("matching_agent",    "scoring_agent")
    graph.add_edge("scoring_agent",     "explanation_agent")
    graph.add_edge("explanation_agent", "ranking_agent")
    graph.add_edge("ranking_agent",     END)

    return graph.compile()


# ── Public runner ─────────────────────────────────────────────
def run_pipeline(
    run_id: str,
    job_id: str,
    folder_path: str,
    jd_text: str,
    threshold: int = 70,
    on_agent_complete=None,   # optional callback(agent_name, state)
) -> dict:
    """
    Runs the full 6-agent pipeline synchronously.

    Args:
        run_id      : unique ID for this pipeline run
        job_id      : the job being evaluated against
        folder_path : server-side path to folder of PDF resumes
        jd_text     : raw job description text
        on_agent_complete : optional callback after each node completes

    Returns:
        Final GraphState dict with ranked_candidates, log, etc.
    """
    pipeline = build_pipeline()

    initial_state: GraphState = {
        "run_id":               run_id,
        "job_id":               job_id,
        "folder_path":          folder_path,
        "jd_text":              jd_text,
        "jd_schema":            None,
        "threshold":            threshold,
        "resume_files":         [],
        "candidates":           [],
        "evaluated_candidates": [],
        "ranked_candidates":    [],
        "log":                  [],
        "error":                None,
    }

    final_state = pipeline.invoke(initial_state)
    return final_state