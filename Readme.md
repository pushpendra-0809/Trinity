Trinity

**Built to Question. Designed to Know.**

Trinity is an AI-powered interview platform that helps conduct structured interviews and provides useful insights from candidate responses.

---

## 🎯 Problem

Interviews can be difficult to evaluate consistently. During a conversation, useful details can easily be missed, and different candidates may end up being evaluated in very different ways.

We wanted to build something that makes the interview process more structured while keeping the experience simple for both the interviewer and the candidate.

---

## 💡 Solution

We built Trinity as an AI-assisted interview platform that supports the interview from start to finish.

The idea is simple: provide a structured interview environment, analyse candidate responses, keep track of performance, and present the results in a way that is easy to understand.

Trinity also tracks how long a candidate spends on individual questions. This happens in the background during the interview, so the candidate does not see a running timer. Once the interview is finished, the time spent on each question is shown alongside the relevant scores in the analysis report.

---

## ✨ Key Features

- AI-assisted interview experience
- Structured interview flow
- Pre-interview trigger warning
- Browser fullscreen/lockdown mode during the interview
- Background timer for each question
- Question-wise scoring
- Question-wise time and performance analysis
- Overall interview score
- Post-interview analysis report
- Clean and distraction-free interview interface
- Responsive UI

### Background Question Timer

A timer runs in the background while the candidate is answering each question.

The timer is not visible during the interview, so it does not add unnecessary pressure or distraction.

After the interview, the analysis report shows how much time was spent on individual questions along with the corresponding scores.

### Interview Lockdown

Before the interview starts, Trinity shows a trigger warning explaining what is about to happen.

Once the candidate continues, the browser enters a fullscreen/lockdown-style mode using browser-supported functionality. The purpose is to reduce distractions while the interview is in progress.

When the interview ends, the lockdown state is released and the user returns to the normal browser experience.

---

## 🧠 How It Works

The basic flow of Trinity is:

```text
User
  ↓
Interview Setup
  ↓
Trigger Warning
  ↓
Browser Lockdown
  ↓
Interview
  ↓
Background Timing
  ↓
AI Processing
  ↓
Analysis & Scores
  ↓
Results

During the interview, Trinity keeps track of the time spent on each question in the background.

After the interview, the timing information is combined with the available scoring and analysis to give a clearer picture of the candidate's performance.

Main Screens
Landing Page
Interview Setup
Pre-Interview Warning
Interview Interface
Post-Interview Analysis Report
🏗️ Architecture

The application is divided into a frontend, backend, AI processing layer and JSON-based data storage.

                TRINITY
                   │
                   ▼
            React Frontend
                   │
        ┌──────────┼──────────┐
        │          │          │
        ▼          ▼          ▼
    Landing    Interview    Analysis
     Page       Interface      Report
                   │
                   ▼
           Background Timer
                   │
                   ▼
            Backend Layer
           ┌───────┴───────┐
           │               │
     JavaScript          Python
           │               │
           └───────┬───────┘
                   ▼
             AI Processing
                   │
                   ▼
             JSON Data

The frontend handles the user-facing interview experience.

The backend handles the application logic and communication between the different parts of the system.

Python is used for the AI/knowledge-related processing, while JavaScript is used for the application/backend side.

JSON is used for storing the project's data.

🖥️ Tech Stack
Frontend
React
Vite
CSS
Framer Motion
Backend
JavaScript
Python
AI
AI-assisted interview and analysis functionality
Database / Data Storage
JSON
Deployment
Vercel
🚀 Getting Started
1. Clone the repository
git clone https://github.com/pushpendra-0809/Trinity.git
2. Move into the project folder
cd Trinity
3. Install dependencies
npm install
4. Start the development server
npm run dev

The terminal will show the local URL where the application is running.

🌐 Deployment

Trinity is deployed using Vercel.

Link : https://teen-log-trinity.vercel.app/interview/a35edd2f-7735-4b2c-810d-f4e158e91484/result

The same project can also be run locally using the development server described above.

📁 Project Structure

The project is broadly organised around the following parts:

Trinity/
│
├── frontend/
│   ├── components/
│   ├── pages/
│   ├── styles/
│   └── ...
│
├── backend/
│   ├── JavaScript/
│   ├── Python/
│   └── ...
│
├── data/
│   └── *.json
│
├── public/
│
├── src/
│
├── package.json
└── README.md

The exact folder structure may vary depending on the final project setup. The important separation is between the frontend, backend, and JSON-based data.

🤖 AI / Vibe Coding

AI tools were a regular part of our development process during the hackathon.

We used AI mainly for:

exploring UI ideas
generating and refining React components
debugging React and CSS issues
improving animations
working on responsive layouts
refining the splash screen
structuring interview and analysis screens
debugging development issues
improving documentation
working through backend and knowledge-engine logic

Development was still an iterative process. We'd try something, run it locally, see what looked or behaved wrong, and then make changes.

For example, the splash screen and its animations went through several iterations before we got the look and behaviour we wanted.

AI helped us move faster, but the final feature decisions, code changes, testing and integration were handled by the team.

For more details about our AI-assisted development process and the prompts used during the hackathon, see PROMPTS.md.

🧪 Testing

We tested the application locally throughout development.

Most of our testing involved:

Running the application through the Vite development server
Checking the splash screen and transition into the main application
Testing the interview flow
Checking the background timing behaviour
Testing the pre-interview warning
Checking fullscreen/lockdown behaviour
Reviewing the analysis output
Checking question-wise scores and timing
Testing the UI across different screen sizes
Debugging frontend and backend issues during integration

Automated testing has not been added yet.

🔮 Future Improvements

There are a few things we'd like to work on next:

Improve the interview analysis further
Add more detailed performance insights
Improve the results/report interface
Make the interview experience more configurable
Improve responsiveness across more devices
Add automated testing
Expand the interview question and evaluation system
Make the adaptive interview flow more detailed

These are areas we'd like to explore as the project continues.

👥 Team

Built by:

Prisha Saxena — Frontend

Pushpendra Kumar Verma — Backend

Pratham Agarwal — Database & Knowledge Engine
