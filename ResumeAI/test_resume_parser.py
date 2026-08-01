from AI.Agents.ResumeParserAgent import ResumeParserAgent

sample_text = """
hardiksarvaiya57@gmail.com
+918780976539
From :- Methali Sub_Dist :- Lathi Dist
rict :- Amreli Pin_Code :- 365220

HTMl /CSS
C / C++ languages
JAVA / PYTHON languages
Speaking Skills
Team Building

Reading
Coding

Gita jayanti speech compitition 2nd No.
In High school I participated of teachers
day

R :- Reading , W :- Writing , S :- Speaking
Gujarati : R.W.S
Hindi : R.W.S
English : R.W
March-2020
March-2022
December-2022
April-2023
October-2023
April-2024
HARDIK SARVAIYA

I am a highly motivated recent programming half graduate looking
for a full time position in programming field, where i can lend my
knowledge to help your company. I seek challenging opportunities
where I can fully utilize my skills for the success of the company.

10th
Shri Swami Narayan Gurukul Damnagar
61%
12th
Shri Swami Narayan High School Damnagar
71%
BCA Sem1
Saurashtra University
68%
BCA Sem2
Saurashtra University
61%
BCA Sem3
Saurashtra University
76%
BCA Sem4
Saurashtra University
74%

I have an experience of instructor to my junior 
and I also have an learning experience of all
Languages in included my skills section 

I am quite natured boy. And l like playing 
Phisical games.I like of my work. I give first importance 
to my work. 
I am very good at saving rupees. My father 
also lets me manage rupees. In the end I am
a mature boy.
SKILLS
INTERESTS
ACTIVITIES
LANGUAGES
OBJECTIVE
EDUCATION
ADDITIONAL INFORMATION
ABOUT ME

"""

agent = ResumeParserAgent()

resume = agent.run(sample_text)

print(resume.model_dump())