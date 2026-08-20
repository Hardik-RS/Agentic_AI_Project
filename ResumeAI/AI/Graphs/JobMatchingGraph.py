from typing import TypedDict

from langgraph.graph import StateGraph, START, END

from AI.Agents.JobMatchingAgent import JobMatchingAgent
from AI.Schemas.ResumeSchema import ResumeSchema
from AI.Schemas.JobMatchSchema import JobMatchSchema


class JobMatchingState(TypedDict, total=False):

    resume: ResumeSchema

    job_title: str

    job_description: str

    match_result: JobMatchSchema

    error: str


def match_job_node(state: JobMatchingState) -> dict:

    agent = JobMatchingAgent()

    result = agent.run(
        resume=state["resume"],
        job_title=state["job_title"],
        job_description=state.get("job_description", ""),
    )

    return {"match_result": result}


def build_job_matching_graph():

    graph = StateGraph(JobMatchingState)

    graph.add_node("match_job",match_job_node)

    graph.add_edge(START,"match_job")

    graph.add_edge("match_job",END)

    return graph.compile()


job_matching_graph = build_job_matching_graph()


def run_job_matching_graph(resume: ResumeSchema,job_title: str,job_description: str = "",):

    return job_matching_graph.invoke(
        {
            "resume": resume,
            "job_title": job_title,
            "job_description": job_description,
        }
    )