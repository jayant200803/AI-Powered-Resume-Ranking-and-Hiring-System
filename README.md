# AI-Powered Resume Ranking and Hiring System

A full-stack recruitment platform that streamlines hiring for both job seekers and employers.
Job seekers can upload resumes, create profiles, and apply for job postings. Employers can
create job postings, view all job applicants, and run an AI-based ranking system that ranks
resumes using TF-IDF, Cosine Similarity, and Skill Matching through a FastAPI engine.

------------------------------------------------------------
🚀 FEATURES
------------------------------------------------------------

JOB SEEKER FEATURES:
- Google OAuth 2.0 login
- Create job seeker profile
- Upload resume (PDF only, max 5MB)
- Apply to jobs (resume auto-attached)
- View job listings and application status

EMPLOYER FEATURES:
- Google OAuth 2.0 login
- Create employer profile
- Post new job openings
- View list of applicants (ranked and unranked)
- Open resumes inside browser
- Trigger AI-based ranking for any job
- Download HTML report preview
- Download Excel-based ranking report
- Update applicant status (Applied / Selected / Rejected)

AI ENGINE FEATURES:
- Extracts text from PDF/DOCX resumes
- Preprocesses text: lowercase, tokenization, stopword removal, lemmatization
- Creates TF-IDF vectors (1–2 gram range, up to 5000 features)
- Calculates cosine similarity between job description and each resume
- Automatically extracts top skills from job description
- Computes skill-match ratio for each resume
- Combines both metrics into a weighted final score

FINAL SCORE FORMULA:
  final_score = (1 - w) * cosine_similarity + w * skill_match_ratio
  Default weight (w) = 0.20

- Persists ranking positions directly into MongoDB
- Generates downloadable reports (HTML and Excel)

------------------------------------------------------------
🏛️ SYSTEM ARCHITECTURE
------------------------------------------------------------

FRONTEND (React + Tailwind CSS):
- Provides UI for both job seekers and employers
- Handles login, dashboards, job search, job posting, and viewing applicant resumes
- Communicates with both Express.js (port 5000) and FastAPI (port 8000) servers

EXPRESS.JS MAIN BACKEND (Node.js — port 5000):
- Google OAuth 2.0 authentication via Passport.js
- Session management via connect-mongo (MongoDB session store)
- Manages job postings, resume uploads, and applicant tracking
- Stores resumes as binary Buffer in MongoDB
- Provides REST API for the React frontend

FASTAPI RANKING BACKEND (Python — port 8000):
- Performs resume text extraction (PDF/DOCX)
- NLP preprocessing (NLTK)
- TF-IDF vectorization (scikit-learn)
- Cosine similarity calculation
- Skill extraction and matching
- Final weighted ranking computation
- Writes updated rankings back into MongoDB
- Generates HTML and Excel reports

MONGODB DATABASE (Atlas Cloud / Local):
- Collections: users, jobseekers, employers, jobs, applications, sessions
- Stores resumes as BSON Binary (Buffer) directly in jobseekers collection
- No SQL schema required — collections are auto-created on first write

------------------------------------------------------------
⚙️ ENVIRONMENT SETUP
------------------------------------------------------------

server/.env:
```
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
SESSION_SECRET=your_random_32_char_secret
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/hiring_system
```

ranking_server/.env:
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/hiring_system
FRONTEND_ORIGIN=http://localhost:3000
TFIDF_MAX_FEATURES=5000
SKILL_BOOST_WEIGHT=0.20
TOP_K=10
```

client/.env:
```
BROWSER=none
```

------------------------------------------------------------
▶️ HOW TO RUN THE PROJECT
------------------------------------------------------------

1) START REACT FRONTEND:
```bash
cd client
npm install
npm start
```
Open http://localhost:3000 in your browser.

2) START MAIN EXPRESS SERVER:
```bash
cd server
npm install
node server.js
```
Expected output: "MongoDB connected" then "Server is running on port 5000"

3) START FASTAPI RANKING SERVER:
```bash
cd ranking_server
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
Note: Use `python -m uvicorn` (not bare `uvicorn`) to avoid PATH issues on Windows.

------------------------------------------------------------
☁️ RENDER DEPLOYMENT
------------------------------------------------------------

Deploy in this exact order: Node → Python → React

STEP 1 — Deploy the Node.js API

  render.com → New + → Web Service → Connect repository

  Field             | Value
  ------------------|--------------------------------------------
  Name              | hiring-api
  Root Directory    | server
  Runtime           | Node
  Build Command     | npm install
  Start Command     | node server.js
  Instance Type     | Free

  Environment Variables:

  Key                  | Value
  ---------------------|----------------------------------------------
  NODE_ENV             | production
  MONGODB_URI          | mongodb+srv://... (your Atlas connection string)
  SESSION_SECRET       | any long random string
  GOOGLE_CLIENT_ID     | from Google Cloud Console
  GOOGLE_CLIENT_SECRET | from Google Cloud Console
  CLIENT_URL           | (leave blank for now)
  SERVER_URL           | (leave blank for now)

  After deploy finishes, copy the URL (e.g. https://hiring-api.onrender.com).
  Come back to the Environment tab and set:
    SERVER_URL = https://hiring-api.onrender.com

STEP 2 — Update Google Cloud Console

  console.cloud.google.com → APIs & Services → Credentials
  → your OAuth 2.0 Client ID → Authorized redirect URIs → Add:
    https://hiring-api.onrender.com/auth/google/callback
  → Save

STEP 3 — Deploy the Python Ranking Server

  New + → Web Service → same repository

  Field             | Value
  ------------------|--------------------------------------------
  Name              | hiring-ranking
  Root Directory    | ranking_server
  Runtime           | Python 3
  Build Command     | bash build.sh
  Start Command     | python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
  Instance Type     | Free

  Environment Variables:

  Key              | Value
  -----------------|----------------------------------------------
  MONGODB_URI      | same Atlas connection string
  NODE_SERVER_URL  | https://hiring-api.onrender.com
  FRONTEND_ORIGIN  | (leave blank for now)

  After deploy finishes, copy the URL (e.g. https://hiring-ranking.onrender.com).

STEP 4 — Deploy the React Frontend

  New + → Static Site → same repository

  Field             | Value
  ------------------|--------------------------------------------
  Name              | hiring-app
  Root Directory    | client
  Build Command     | npm install && npm run build
  Publish Directory | build

  Environment Variables:

  Key                    | Value
  -----------------------|----------------------------------------------
  REACT_APP_API_URL      | https://hiring-api.onrender.com
  REACT_APP_RANKING_URL  | https://hiring-ranking.onrender.com

  After deploy finishes, copy the URL (e.g. https://hiring-app.onrender.com).

STEP 5 — Fill the Two Remaining Environment Variables

  Node service (hiring-api) → Environment:
    CLIENT_URL = https://hiring-app.onrender.com
  → Save (auto-redeploys)

  Python service (hiring-ranking) → Environment:
    FRONTEND_ORIGIN = https://hiring-app.onrender.com
  → Save (auto-redeploys)

STEP 6 — Verify

  Test                                           | Expected result
  -----------------------------------------------|----------------------------------
  Visit https://hiring-app.onrender.com          | Landing page loads
  Click "Sign in with Google"                    | Redirects to Google, then /choose-role
  Employer: post a job → view applicants → Rank  | Returns ranked list
  Click Report                                   | HTML report opens with resume links
  Job seeker: submit form → Download Resume      | PDF downloads

  Free tier note: Services spin down after 15 min of inactivity.
  The first request after idle takes ~30–60 seconds. This is normal on the free plan.

------------------------------------------------------------
🗄️ DATABASE — MONGODB COLLECTIONS
------------------------------------------------------------

| Collection   | Replaces (old SQL table) | Description                          |
|--------------|--------------------------|--------------------------------------|
| users        | login                    | Google OAuth user accounts + role    |
| jobseekers   | job_seeker               | Profile + resume binary data         |
| employers    | employer                 | Company and contact info             |
| jobs         | job_description          | Job postings                         |
| applications | job_applied              | Applications with rank + status      |
| sessions     | session (pg table)       | Express session store                |

------------------------------------------------------------
🖼️ SCREENSHOTS
------------------------------------------------------------

## Login Page
![Screenshot1 – Login Page](output/Screenshot1.png)

## Role Selection
![Screenshot2 – Role Selection](output/Screenshot2.png)

## Job Seeker Registration
![Screenshot3 – Job Seeker Registration](output/Screenshot3.png)

## Job Seeker Dashboard
![Screenshot4 – Job Seeker Dashboard](output/Screenshot4.png)

## Job Search Interface
![Screenshot5 – Job Search Interface](output/Screenshot5.png)

## Employer Registration
![Screenshot6 – Employer Registration](output/Screenshot6.png)

## Employer Dashboard
![Screenshot7 – Employer Dashboard](output/Screenshot7.png)

## Job Creation
![Screenshot8 – Job Creation](output/Screenshot8.png)

## Applicant Management
![Screenshot9 – Applicant Management](output/Screenshot9.png)

## Unranked Applications
![Screenshot10 – Unranked Applications](output/Screenshot10.png)

## Ranking Progress
![Screenshot11 – Ranking Progress](output/Screenshot11.png)

## Ranked Results
![Screenshot12 – Ranked Results](output/Screenshot12.png)

## Analytics Dashboard
![Screenshot13 – Analytics Dashboard](output/Screenshot13.png)

------------------------------------------------------------
🔮 FUTURE IMPROVEMENTS
------------------------------------------------------------

- Integration with semantic models like BERT / Sentence-BERT
- Lower false-negative skill detection using fuzzy matching
- Add OCR support for scanned PDF resumes
- Deploy as Dockerized microservices
- Add ATS-style candidate tracking
- Multi-language resume support
- Add recruiter analytics (graphs and visual insights)

------------------------------------------------------------
👨‍💻 AUTHOR
------------------------------------------------------------

JAYANT RAJ
Final Year Project — AI-Powered Resume Ranking and Hiring System
