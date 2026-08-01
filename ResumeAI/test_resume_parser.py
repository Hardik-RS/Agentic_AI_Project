from AI.Agents.ResumeParserAgent import ResumeParserAgent

sample_text = """

 john@example.com
 9876543210


Python
Django
React

Hardik sarvaiya


Bachelor of Computer Engineering
"""

agent = ResumeParserAgent()

resume = agent.run(sample_text)

print(resume.model_dump())