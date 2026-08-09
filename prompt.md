Trinity —Prompts

This file contains the main prompts we used while building Trinity during the hackathon.

We used AI mainly for UI development, debugging, component creation, animation refinement, and improving the overall user experience. We still tested and modified the generated code ourselves.

---

## 1. Project Direction

1.	We are building an AI-powered interview platform called Trinity.
2.	The idea is to help interviewers conduct better interviews and get useful insights from the conversation.
3.	Help us plan the basic frontend structure and suggest the main pages/components we should build first.
4.	Keep the implementation realistic for a hackathon project.

---

## 2. Landing Page

1.	Create a modern dark landing page for Trinity, an AI-powered interview intelligence platform.
2.	The visual style should be minimal, premium and technical rather than colorful.
3.	Use a black/dark navy background, subtle blue lighting, white typography and small animations.
4.	The hero section should clearly communicate what Trinity does and include a primary CTA to start an interview.
5.	Keep the design practical and implementable in React.

---

## 3. Splash Screen

1.	Create a React splash screen for Trinity using Framer Motion.
2.	I want a completely black/dark background with a centered white glowing card containing the Trinity logo.
3.	The card should be medium-sized and stay in the center of the screen instead of stretching across the screen.
4.	Add subtle particles, blue ambient glow and a soft shine animation.
5.	After the logo animation finishes, reveal:
6.	"Built to Question"
7.	"Designed to Know"
8.	The second line should have a slightly elegant/cursive feel.
9.	After the animation, smoothly transition to the main landing page.

---

## 4. Splash Screen Debugging

1.	The splash screen is taking up too much space and the logo/card looks stretched across the screen.
2.	Keep the background full-screen, but make the actual logo card medium-sized and perfectly centered.
3.	Do not change the logo itself.
4.	Give me the corrected React/CSS code and explain which part controls the card size.

---

## 5. Transparent Logo Handling

1.	The Trinity logo is a transparent PNG.
2.	I want it to look good on a black background.
3.	Instead of placing the transparent logo directly on the background, put it inside a clean white glowing card.
4.	The card should have subtle shadows and a soft blue aura so that it matches the rest of the Trinity interface.

---

## 6. Navbar

1.	Create a responsive navbar for Trinity.
2.	Use a dark glassmorphism style with a subtle bottom border.
3.	Include:
- Trinity logo/name
- Product
- How it Works
- About
- Get Started button
4.	Keep the navbar minimal and consistent with the dark blue/white visual style.

---

## 7. Hero Section

1.Design the main Trinity hero section.
2.The headline should communicate that Trinity helps interviewers ask better questions and understand candidates better.
3.Use a dark background with subtle blue gradients.
4.Add:
short product badge
main headline
supporting description
Start Interview CTA
secondary Explore Trinity CTA
5.	Keep the typography clean and avoid making the page look like a generic SaaS template.

---

## 8. Feature Section

	Create a feature section for Trinity that explains the actual functionality of the platform.
	Use simple cards with subtle hover animations.
	Don't use exaggerated marketing language.
	Keep the cards consistent with the dark interface and use blue/white accents.

---

## 9. Interview Timer

	Add a background interview timer to the interview flow.
	The timer should start automatically when the interview starts.
	The timer should NOT be visible to the candidate/interview user during the interview.
	When the interview is completed, include timing information in the analysis report showing how long the user took to complete each question.
	Keep the timer running in the background and make sure the timing data is associated with the correct question.

---

## 10. Interview Start Trigger

	When the user starts an interview, show a trigger/warning screen before the interview begins.
	Clearly explain that the interview is about to start and that the browser will enter a restricted/lockdown-style mode.
	The user should have to acknowledge the warning before continuing.
	Keep the UI consistent with Trinity's dark theme.

---

## 11. Browser Lockdown Mode

	Implement the interview lockdown flow for the browser.
	When the interview starts, switch into the browser's supported fullscreen/restricted interview mode where possible.
	The goal is to reduce distractions and discourage switching away from the interview.
	Handle browser limitations gracefully instead of assuming that a normal web page can completely control the user's browser.
	Keep the implementation suitable for a React web application.

---

## 12. Interview Interface

	Build the interview screen for Trinity.
	The interface should focus the user on the current interview question.
	Keep unnecessary UI elements out of the screen.
	Include the question, answer area, navigation/submit controls and any necessary interview status information.
	Use the same dark navy, black, white and subtle blue visual language as the landing page.

---

## 13. Analysis Report

	Create an interview analysis/report screen for Trinity.
	The report should present the candidate's interview results in a clean and readable way.
	Include the available scores and insights from the interview.
	Also show the time taken for each question so the interviewer can see how quickly the candidate responded.
	Use cards, simple visual indicators and clear hierarchy rather than making the page overly complicated.

---

## 14. UI Refinement

	Review this React page and improve the visual consistency.
	Keep the existing functionality unchanged.

	Focus only on:
 - spacing
 - typography
 - alignment
 - responsive behaviour
 - button styling
 - card styling
	- subtle animations

	Keep the dark Trinity visual style and don't introduce unnecessary UI elements.

---

## 15. Debugging React Errors

	Here is my current React code and the error I'm getting.
	Find the actual cause of the error first.

	Then provide the corrected code.

	Do not rewrite unrelated components or change the existing design unless necessary.

	Also point out exactly what was wrong so I can understand the fix.

---

## 16. Responsive Design

	Make the Trinity interface responsive for desktop, tablet and mobile.
	Preserve the existing visual design.

	Make sure the navbar, hero section, cards, logo card and buttons adapt properly to smaller screens.

	Avoid horizontal scrolling and prevent elements from overflowing the viewport.

## 17. Final UI Review

	Review the complete Trinity frontend as if you were testing it before a hackathon demo.
	Look for:
 - broken layouts
 - inconsistent spacing
 - animation issues
 - buttons that don't work
> - responsive problems
> - unnecessary elements
> - visual inconsistencies
	Don't add random features.
	Only suggest changes that would improve the actual demo experience.

---

## 18. README

	Rewrite our README so it sounds like it was written by a student/developer team for a hackathon.
	Keep all technically correct information.
	
	Don't invent technologies or features.

	Avoid generic AI-generated phrases and corporate marketing language.

	Explain what we actually built, how it works, what technologies we used, how AI tools helped during development, and what we would improve next.

---

## How We Used AI

AI was mainly used as a development assistant during the hackathon.

We used it to:
- generate and refine React components
- debug React and CSS issues
- improve animations and UI spacing
- experiment with different landing page designs
- refine the splash screen
- work through responsive layout problems
- structure the interview and analysis screens
- improve documentation

The generated code was reviewed, modified and tested by us before being used in the project.

The goal was not to blindly copy generated code, but to use AI to iterate faster while building and debugging Trinity.


This section contains the main prompts we used while working on the backend,
database, interview logic, candidate management, AI evaluation, and overall
data flow of Trinity.

The prompts were mainly used to help us structure the backend, debug data-flow
issues, connect different parts of the application, and make sure candidate
and interview data stayed consistent.

---

## 19. Backend Architecture

1. We are building the backend for an AI-powered technical interview platform
   called Trinity.
2. Inspect the existing project before making changes.
3. Reuse existing APIs, services, models and utilities wherever possible.
4. Do not create duplicate systems if an equivalent implementation already
   exists.
5. Keep the backend architecture realistic for a hackathon project.
6. Make sure candidate data, interview sessions, questions, evaluations and
   results remain properly connected.

---

## 20. Candidate Management

1. Trinity supports both existing and new candidates.
2. Existing candidates are stored in `candidate.json`.
3. If the entered candidate name matches an existing candidate, use the
   existing candidate ID and profile.
4. If the candidate does not exist, generate a unique candidate ID.
5. Preserve the name entered by the user.
6. Never display `"New Candidate"` as the candidate's actual name.
7. Keep candidate identity separate from individual interview sessions.

---

## 21. Candidate Resolution

Create or reuse a centralized candidate resolution function.

The function should:

- normalize the entered name
- trim unnecessary whitespace
- handle repeated spaces
- perform case-insensitive matching
- search the existing candidate dataset
- return the existing candidate if found
- create a new candidate identity if no match exists

The same candidate ID should remain stable across multiple tests.

---

## 22. Candidate Data Separation

Keep candidate profile data separate from interview/test data.

`candidate.json` should remain the source of truth for existing candidate
profiles.

Do not overwrite or mutate the original candidate profile when a candidate
takes an interview.

Interview sessions and results should be stored separately.

---

## 23. Candidate Object

Use a consistent candidate structure:

```json
{
  "candidate_id": "...",
  "candidate_name": "...",
  "display_name": "...",
  "candidate_type": "new | existing"
}

Important:

candidate_type is metadata.

It must never replace the candidate's actual name.

24. Session and Test IDs

Keep these identifiers separate:

candidate_id → identifies the candidate
session_id   → identifies one interview session
test_id      → identifies one saved test/result

A candidate can have multiple sessions and tests while keeping the same
candidate ID.

25. Dashboard Data

The dashboard should be connected to the candidate's actual data.

For existing candidates, show available information such as:

candidate profile
course progress
completed curriculum days
modules
missions
attempts
skipped topics
learning signals
test history

For new candidates, do not fabricate course progress or learning history.

Instead, clearly indicate that cohort/course history is not available yet.

26. Test History

Every completed or terminated test should be associated with:

candidate_id
session_id
test_id

Retrieve history using candidate_id rather than relying on the candidate's
display name.

Make sure multiple tests from the same candidate remain separate records.

27. Start New Test

If a candidate is already on the dashboard:

Dashboard
    ↓
Start New Test
    ↓
Create new test session

Do not send the candidate through registration again.

Existing candidates should retain their existing candidate ID.

New candidates should retain both their generated candidate ID and entered
display name.

28. Interview Session

Create a clear session lifecycle.

The basic flow should be:

Candidate
    ↓
Create Session
    ↓
Generate Questions
    ↓
Candidate Answers
    ↓
AI Evaluation
    ↓
Adaptive Next Question
    ↓
Test Completion
    ↓
Result

Make sure the session state is preserved throughout the interview.

29. Question Count

Each Trinity test should contain exactly:

16 questions

The frontend should always be able to display:

Question X / 16

The backend should keep the question count consistent instead of returning
different totals at different stages of the interview.

30. Question Status

Maintain a clear status for every question:

ANSWERED
SKIPPED
NOT_ATTEMPTED

Do not treat skipped questions as unanswered questions.

The system should always satisfy:

Answered + Skipped + Not Attempted = 16
31. Question Data Model

A question result should contain information similar to:

{
  "question_number": 5,
  "question_id": "Q005",
  "status": "answered",
  "answer": "...",
  "is_correct": true,
  "marks": 10,
  "time_spent_seconds": 47,
  "topic": "RAG"
}

For skipped questions:

{
  "question_number": 6,
  "status": "skipped",
  "marks": 0
}

For questions that were never attempted:

{
  "question_number": 7,
  "status": "not_attempted",
  "marks": 0
}
32. Question Navigation

Keep track of the current question and all previous question states.

The system should know whether each question is:

current
answered
skipped
not attempted

Do not confuse the current question with its answer status.

33. Question Skipping

Add support for skipping a question.

When the candidate skips:

status = SKIPPED
marks = 0

The question should remain part of the 16-question test.

It should not be removed from the test.

34. Scoring

Use the configured marks for each question.

For the current 16-question structure:

16 × 10 = 160 maximum marks

Correct answers receive full marks.

Wrong answers receive zero marks.

Skipped and not-attempted questions receive zero marks.

The percentage should always be calculated using the full maximum score:

percentage = score / maximum_score × 100
35. AI Answer Evaluation

When an answer is submitted, send the required information to the configured
AI evaluator.

The evaluation should consider:

correctness
relevance
technical depth
conceptual understanding
completeness

Return structured evaluation data where possible.

Example:

{
  "correctness": 0.82,
  "score": 8,
  "feedback": "Good understanding of vector retrieval."
}

Map the evaluation result to the question's configured marks.

36. AI Evaluation API Contract

Evaluation requests should retain the candidate and session context.

The request should contain information similar to:

{
  "candidate_id": "...",
  "session_id": "...",
  "test_id": "...",
  "question_id": "...",
  "answer": "..."
}

Do not identify candidates only by their display name.

37. Adaptive Questioning

The interview should not behave like a fixed questionnaire.

Use the previous answer and its AI evaluation to determine the next question.

For example:

Weak answer
    ↓
Slightly easier/foundational question

Strong answer
    ↓
Deeper/harder question

Maintain the current difficulty level:

Easy
Medium
Hard
38. Follow-up Questions

Questions should be able to follow up on previous answers.

For example:

Question:
Explain RAG.

Candidate:
Explains retrieval but misses grounding.

Next question:
Ask specifically about grounding/context injection.

The goal is to make the interview feel conversational rather than like a
static list of questions.

39. Interview Context

Maintain relevant context throughout the interview:

previous questions
previous answers
evaluation results
candidate profile
curriculum context
current difficulty
previously covered topics

Use this information when generating the next question.

40. Curriculum Integration

The interview should use curriculum information when generating relevant
questions.

The flow should be approximately:

Curriculum
    ↓
Knowledge Engine
    ↓
Relevant Topics
    ↓
Interview Question Generation
    ↓
Candidate Answer
    ↓
AI Evaluation

The Knowledge Engine should provide curriculum context but should not conduct
the final interview conversation itself.

41. Knowledge Engine

The Knowledge Engine should work approximately as:

Curriculum JSON
      ↓
Chunking
      ↓
Embeddings
      ↓
FAISS
      ↓
Retriever
      ↓
Topic Ranking
      ↓
Topic Relationships
      ↓
Relevant Curriculum Context

The system should return relevant curriculum information to the interview
service.

Keep the Knowledge Engine separate from the final interview conversation
logic.

42. Candidate Personalization

Use available candidate learning information to personalize interviews.

Relevant information can include:

completed missions
previous attempts
skipped topics
learning signals
course progress

Do not assume that a candidate has mastered a topic simply because it exists
in the curriculum.

43. Curriculum Coverage

The interview should cover multiple curriculum areas.

The system should support:

at least 8 meaningful questions where applicable
at least 4 different curriculum days
follow-up questions
multi-turn context
structured feedback

Since Trinity currently uses 16 questions, the interview should naturally
cover multiple relevant curriculum areas.

44. Background Question Timer

Add background timing for each question.

The timer should:

start when a question becomes active
track elapsed time
stop when the candidate submits or skips
persist the time spent
remain hidden from the candidate during the interview

Example:

{
  "question_number": 5,
  "time_spent_seconds": 47
}

The timing information should be shown later in the analysis/result.

45. Timer Edge Cases

Make sure question timing is saved when the candidate:

submits an answer
skips a question
exits the interview
gets terminated

Do not lose timing information when the interview ends unexpectedly.

46. Result Data

A completed test should contain information similar to:

{
  "test_id": "T004",
  "session_id": "S004",
  "candidate_id": "C023",
  "candidate_name": "Rahul Sharma",
  "status": "completed",
  "score": 125,
  "max_score": 160,
  "percentage": 78.125,
  "answered": 14,
  "skipped": 1,
  "not_attempted": 1,
  "questions": []
}

Keep the candidate identity and test identity separate.

47. Test Status

Support these test states:

in_progress
completed
voluntarily_exited
tab_switch_terminated

Once a test reaches a terminal state, it should not be processed again.

48. Terminal State Protection

Before completing or terminating a test, check:

test.status === "in_progress"

If the test has already reached a terminal state, ignore additional
completion or termination events.

Only one final result should be generated.

49. Exit Test

Support voluntary test exit.

When the candidate exits:

Save the current test state.
Save answers and timing data.
Calculate the result from the available answers.
Set:
status = voluntarily_exited
Release fullscreen/lockdown state.
Navigate to the result.
50. Basic Browser Lockdown

The lockdown requirement is intentionally basic.

Use browser-supported mechanisms only.

The lifecycle should be:

Start Test
    ↓
Confirmation
    ↓
Fullscreen
    ↓
Interview
    ↓
Test Ends
    ↓
Exit Fullscreen
    ↓
Normal Browser

Do not attempt to control the user's operating system or use invasive browser
techniques.

51. Lockdown Confirmation

Before entering the test, show a confirmation message explaining that the
browser will enter fullscreen/restricted mode.

The user should explicitly continue before requesting fullscreen.

Conceptually:

Your browser will enter lockdown mode while you take this test.
Please allow fullscreen access to continue.

[ Cancel ]
[ Continue ]
52. Fullscreen Lifecycle

Use the browser's standard Fullscreen API.

Conceptually:

document.documentElement.requestFullscreen()

When the test ends:

document.exitFullscreen()

Handle unsupported browser behavior gracefully.

Lockdown should only remain active while the test is actually in progress.

53. Tab Switch Termination

If tab-switch detection is enabled by the current implementation:

When a tab switch is detected during an active test:

Terminate the test.
Save the reason as:
Tab Switch
Calculate the result from submitted answers.
Save timing information.
Release fullscreen.
Navigate to the result.

Do not trigger another termination after the test has already ended.

54. Logout

Implement logout without deleting candidate or test history.

Logout should:

Clear active session
      ↓
Return to homepage

Previously saved test history should remain available when the candidate
logs in/resolves their identity again.

55. Interview Feedback

Generate structured feedback after the interview.

The result should include available information such as:

overall score
percentage
strengths
weaknesses
topic-wise performance
technical depth
accuracy
areas to improve
recommended topics
interview readiness

Keep the result understandable instead of returning raw AI output.

56. Result and Question Details

The main result page should focus on the overall performance.

Keep detailed question-by-question information in a separate section/page.

For each question, show information such as:

Question
Status
Answer
Evaluation
Marks
Time Spent
Topic

Skipped and not-attempted questions should still be represented.

57. Result Visualization

Use simple visualizations where useful:

overall score
percentage
topic performance
correct/incorrect distribution
question status
timing information

Do not overload the result page with unnecessary charts.

58. Backend Debugging

When a backend or data-flow bug occurs:

Inspect the existing implementation.
Trace the data from the original input.
Check the API request.
Check the stored session/test state.
Check the result generation.
Check what the dashboard receives.

Do not immediately patch the frontend to hide a backend data issue.

59. Data Flow Debugging

For candidate-related issues, trace:

Candidate Input
    ↓
Candidate Resolution
    ↓
Candidate ID
    ↓
Session Creation
    ↓
Interview
    ↓
Result
    ↓
Dashboard

For test issues:

Question
    ↓
Answer
    ↓
AI Evaluation
    ↓
Score
    ↓
Result

For lockdown issues:

Test Start
    ↓
Lockdown Start
    ↓
Test State
    ↓
Test End
    ↓
Lockdown Release

Find where the state becomes incorrect instead of masking the problem.

60. API / State Validation

When implementing a new backend feature, verify:

candidate ID is preserved
session ID is unique
test ID is unique
question ID is preserved
question status is correct
score is calculated correctly
timing is saved
terminal states cannot be processed twice
61. Regression Testing

Whenever changing one part of the backend, check the related flows again.

At minimum verify:

New Candidate
Existing Candidate
Dashboard
Start Test
Question Generation
Answer Evaluation
Question Skip
Scoring
Timer
Result
Test History
Logout
Lockdown

Do not assume that a backend change only affects one endpoint.

62. Backend Code Review

Review the backend as if it is being prepared for the hackathon demo.

Check for:

broken API routes
incorrect candidate IDs
inconsistent response structures
missing error handling
duplicate logic
incorrect scoring
lost session state
missing timing data
terminal-state bugs
unnecessary debug logs

Fix actual issues instead of rewriting working code.

63. Final System Flow

The complete backend flow should support:

Homepage
    ↓
Candidate Name
    ↓
Candidate Resolution
    ↓
Dashboard
    ↓
Start Test
    ↓
Create Session
    ↓
Generate Question
    ↓
Candidate Answer
    ↓
AI Evaluation
    ↓
Adaptive Next Question
    ↓
16 Questions
    ↓
Final Evaluation
    ↓
Score + Feedback
    ↓
Save Result
    ↓
Dashboard History
64. Final Integration Review

Review the complete Trinity system before the hackathon demo.

Check that:

candidate identity remains consistent
existing candidates use their JSON profile
new candidates keep their entered name
multiple tests remain separate
every test contains 16 questions
question statuses are correctly tracked
scoring uses the correct denominator
AI evaluation is connected
adaptive questioning uses previous answers
question timing is stored
lockdown starts and ends correctly
results are saved
dashboard history is updated
logout does not delete history

Do not add unrelated features during the final review.

65. AI-Assisted Backend Development

AI was used as a development assistant while working on the backend and
interview logic.

We used prompts to help with things such as:

backend architecture
API and data-flow planning
candidate resolution logic
session and test state management
debugging API issues
question evaluation flow
adaptive questioning logic
scoring calculations
timer implementation
result generation
database/data-model structure
debugging integration issues

The generated suggestions were reviewed and modified by the team.

We did not treat generated code as automatically correct. We tested the
actual flows and fixed issues based on the project's requirements.

66. Final Principle

The main goal was to keep Trinity's interview flow connected from beginning
to end:

Candidate
    ↓
Profile
    ↓
Learning Context
    ↓
Interview
    ↓
AI Evaluation
    ↓
Adaptive Questions
    ↓
Scoring
    ↓
Timing Analysis
    ↓
Feedback
    ↓
Test History
