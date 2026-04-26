# DivineCode Full Version Roadmap

DivineCode is planned as a competitive programming platform with practice problems, real judging, live MCQ duels, Codeforces Gym-style group contests, ratings, leaderboards, anti-cheat, and AI recommendations.

## Current Working Features

- Next.js frontend
- Express TypeScript backend
- Live MCQ duel using Socket.IO
- Problem API
- Judge0-ready submission endpoint
- Gym-style contest backend
- Gym contest pages
- Contest timer page
- External problem links
- Basic standings placeholder

## Full Working MVP Target

The full MVP should include the following systems.

### 1. Authentication

Required features:

- Signup
- Login
- JWT session
- Password hashing
- User profile
- Logout

Suggested stack:

- bcrypt
- jsonwebtoken
- PostgreSQL
- Prisma

### 2. Database Persistence

Required tables:

- User
- Problem
- Submission
- Contest
- ContestProblem
- ContestMember
- ContestSubmission
- DuelMatch
- DuelQuestion
- RatingHistory

Current contests are stored in memory. They must be moved to PostgreSQL.

### 3. Real Judge System

Required features:

- Judge0 integration
- Language selector
- Run code
- Submit code
- Store submissions
- Verdicts: Accepted, Wrong Answer, Compilation Error, Runtime Error, Time Limit Exceeded

### 4. Practice Platform

Required pages:

- Problem list
- Problem detail
- Code editor
- Submission result
- Submission history
- Tags and difficulty filter

### 5. Gym Contest System

Required features:

- Create contest
- Add external problems by URL
- Add unlimited members
- Generate invite link
- Participants join by invite
- Timer starts at configured time
- Contest ends automatically
- Standings update from submissions
- Freeze standings later

### 6. Live MCQ Duel

Required features:

- Matchmaking
- Live socket room
- MCQ questions
- Timer per question
- Scoring
- Winner
- Duel history
- Duel rating

### 7. Rating System

Required features:

- Contest rating
- Duel rating
- Rating history graph
- Rank title
- Leaderboard

Start with Elo, later upgrade to Glicko-2.

### 8. Anti-cheat

Required features:

- Submission timing logs
- Copy-paste monitoring later
- Plagiarism report
- Similarity checker
- Cloudflare Turnstile later

### 9. AI Recommendation Engine

Required features:

- Track user accuracy
- Track weak topics
- Recommend problems
- Recommend duels
- Suggest contest readiness
- Opportunity unlock system

Initial version can be rule-based. ML can come later.

## Recommended Implementation Order

1. PostgreSQL + Prisma models
2. Auth system
3. Persistent contest system
4. Persistent submissions
5. Real Judge0 frontend integration
6. Live standings
7. Ratings
8. Duel history and rating
9. Admin dashboard
10. AI recommendations

## Important Engineering Note

A complete production platform like Codeforces is a large multi-month project. DivineCode should be built in reliable phases. Each phase should run locally before adding the next one.
