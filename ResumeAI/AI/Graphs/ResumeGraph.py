from typing import TypedDict

from langgraph.graph import StateGraph, START, END

from AI.Agents.ResumeParserAgent import ResumeParserAgent
from AI.Agents.ResumeAnalysisAgent import ResumeAnalysisAgent

from AI.Schemas.ResumeSchema import ResumeSchema
from AI.Schemas.AnalysisSchema import AnalysisSchema


class ResumeState(TypedDict, total=False):
   
    resume_text: str
    parsed_resume: ResumeSchema
    analysis: AnalysisSchema
    error: str


def parse_resume_node(state: ResumeState) -> dict:

    parser = ResumeParserAgent()

    parsed_resume = parser.run(state["resume_text"])

    return {
            "parsed_resume": parsed_resume
            }


def analyze_resume_node(state: ResumeState) -> dict:

    resume = state["parsed_resume"]

    analyzer = ResumeAnalysisAgent()

    analysis = analyzer.run(resume)

    return {
            "analysis": analysis
            }


def build_resume_graph():

    graph = StateGraph(ResumeState)

    # Nodes
    graph.add_node("parse_resume",parse_resume_node)

    graph.add_node("analyze_resume",analyze_resume_node)

   
    # Edges
    graph.add_edge(START,"parse_resume")

    graph.add_edge("parse_resume","analyze_resume")

    graph.add_edge("analyze_resume",END)

    return graph.compile()


# Compile once when the module loads
resume_graph = build_resume_graph()


def run_resume_graph(resume_text: str):

    return resume_graph.invoke(
        {
            "resume_text": resume_text
        }
    )