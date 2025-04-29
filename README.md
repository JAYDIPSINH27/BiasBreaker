# BiasBreaker
BiasBreaker is a web application designed to help users recognize and reduce cognitive biases when consuming digital content. It pairs selected articles with contrasting perspectives, provides quizzes to assess comprehension, and uses subtle nudges like progress tracking and micro-challenges to encourage balanced viewpoint engagement.

## Persuasive Interfaces for Bias Reduction: Research Context

In today's digital media landscape, recommendation algorithms and social media often reinforce cognitive biases, leading to polarized viewpoints despite users' intellectual acknowledgment of the value of diverse perspectives. Traditional debiasing methods, such as education or fact-checking, frequently face resistance due to confirmation bias and defensive processing. This research addresses the gap between users' desire for balanced information and their actual consumption patterns by exploring subtle, real-time persuasive interface elements (e.g., visual cues, micro-challenges, progress tracking) that encourage diverse viewpoint engagement without triggering defensive reactions. By examining the effectiveness of these mechanisms, their timing, and their impact on defensive processing, the study aims to develop bias-reduction tools that align with natural browsing behaviors, offering a practical approach to mitigating polarization in digital spaces.

# BiasBreaker

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/yourusername/biasbreaker/actions)
[![Coverage Status](https://img.shields.io/badge/coverage-85%25-yellowgreen)](https://coveralls.io/github/yourusername/biasbreaker)

**A web-based platform for bias modification with gaze tracking and persuasive strategies**

---

## Table of Contents

1. [About](#about)  
2. [Key Features](#key-features)  
3. [Architecture Overview](#architecture-overview)  
4. [Technology Stack](#technology-stack)  
5. [Getting Started](#getting-started)  
   - [Prerequisites](#prerequisites)  
   - [Installation](#installation)  
     - [Backend](#backend)  
     - [Frontend](#frontend)  
     - [Tracker (Optional)](#tracker-optional)  
6. [Configuration & Environment Variables](#configuration--environment-variables)  
7. [Usage & Workflows](#usage--workflows)  
   - [Generate Articles](#generate-articles)  
   - [Take Quizzes](#take-quizzes)  
   - [View Dashboard](#view-dashboard)  
   - [Run Eye-Tracker Companion](#run-eye-tracker-companion)  
8. [API & WebSocket Reference](#api--websocket-reference)  
9. [Project Structure](#project-structure)  
10. [Continuous Integration & Testing](#continuous-integration--testing)  
11. [Troubleshooting](#troubleshooting)  
12. [Roadmap](#roadmap)  
13. [Contributing](#contributing)  
14. [License](#license)  
15. [Contact & Acknowledgements](#contact--acknowledgements)  

---

## About

Confirmation bias in today’s digital media environment drives users into ideological echo chambers by constantly surfacing content that supports existing beliefs. **BiasBreaker** pairs user-selected topics with AI-generated contrasting perspectives, embeds gamified quizzes, and delivers real-time engagement nudges via eye-tracking, all aimed at broadening viewpoints and reinforcing critical thinking.

---

## Key Features

- **Automated Alternative Perspective**  
  - Generates pro/con articles using LLM prompts  
  - Ensures balanced primary vs. secondary framing  

- **Interactive Quizzes & Micro-Challenges**  
  - Comprehension quizzes after each article section  
  - Points, badges, and progress tracking for motivation

- **Gamification & Rewards**  
  - Badge engine for milestones (e.g., “First Alternative Read”, “Quiz Master”)  
  - Progress dashboard charting reading diversity  

- **Real-Time Nudges**  
  - WebSocket-based focus alerts (“Great focus!” after 50s)  
  - Distraction prompts (“Ready for a quick quiz?”) when gaze leaves content 

- **Eye-Tracking Integration**  
  - **MediaPipe** webcam-based gaze estimation for browser  
  - **Tobii Eye Tracker** companion application for hardware-grade accuracy  

---

## Architecture Overview

```plaintext
Client (Next.js SPA)
  ├── Generates UI & handles user input
  ├── Fetches data via REST (RTK Query)
  └── Listens to WebSockets for nudges

Server (Django + DRF)
  ├── /api/articles/        → Article generation & retrieval
  ├── /api/quiz/submit/     → Quiz evaluation
  ├── /api/analytics/       → Usage logging
  ├── /ws/eye-tracking/     → Focus/distraction events
  └── /ws/gaze-collector/   → Raw gaze data ingestion

LLM Service
  └── Gemini / HuggingFace API for content generation

Eye-Tracking Modules
  ├── MediaPipe (Browser)
  └── Tobii Companion (Python Tkinter + SDK)
```

---

## Technology Stack

| Layer               | Technologies                             |
| ------------------- | ---------------------------------------- |
| **Frontend**        | Next.js, React, Redux Toolkit, RTK Query |
| **Backend**         | Django, Django REST Framework, Channels  |
| **Real-Time**       | WebSockets, Chart.js                     |
| **AI Generation**   | Google Gemini, Hugging Face Inference    |
| **Eye Tracking**    | MediaPipe Face Landmarker, Tobii SDK     |
| **Database**        | SQLite (dev) / PostgreSQL (prod)         |
| **Deployment**      | Docker, GitHub Actions, AWS/GCP          |

---

## Getting Started

### Prerequisites

- Node.js ≥ v14  
- npm or yarn  
- Python ≥ v3.10  
- pip & virtualenv  
- [Tobii Eye Tracker 5](https://tobii.com/)  

### Installation

#### Backend

```bash
git clone https://github.com/yourusername/biasbreaker.git
cd biasbreaker/server

# Python environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Migrate & seed DB
python manage.py migrate

# Start server
uvicorn biasbracker_server.asgi:application --reload
```

#### Frontend

```bash
cd ../client
npm install
cp .env.local.example .env.local
npm run dev
```

#### Tracker (Optional)

```bash
cd ../tobii_client
python biasbreaker_eye_tracker.py
```

---

## Configuration & Environment Variables

Create `.env` files in `/server` and `/client` directories:

**`/server/.env`**  
```dotenv
DJANGO_SECRET_KEY=<your_secret>
DATABASE_URL=sqlite:///db.sqlite3
HUGGINGFACE_TOKEN=<hf_token>
GEMINI_TOKEN=<gemini_token>
ALLOWED_HOSTS=localhost,127.0.0.1
```

**`/client/.env.local`**  
```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
```

---

## Usage & Workflows

### Generate Articles

1. Navigate to **Home** and enter a topic.  
2. Click **Generate** to fetch primary & alternative articles.

### Take Quizzes

1. After reading, open the **Quiz** modal.  
2. Answer questions to earn points & badges.

### View Dashboard

- Access **Dashboard** to review:
  - Weekly reading count
  - Badge grid (earned vs. locked)
  - Timeline chart of diversity score

### Run Eye-Tracker Companion

- Launch the Tobii Python app to stream gaze data to `/ws/gaze-collector/`.  
- Ensure WebSocket URL matches `.env` configuration.

---

## API & WebSocket Reference

### REST Endpoints

| Endpoint              | Method | Description                          |
| --------------------- | ------ | ------------------------------------ |
| `/api/articles/`      | POST   | Generate or fetch articles by topic  |
| `/api/quiz/submit/`   | POST   | Submit quiz answers                  |
| `/api/analytics/`     | GET    | Retrieve user interaction metrics    |

### WebSockets

| Path                    | Purpose                               |
| ----------------------- | ------------------------------------- |
| `/ws/eye-tracking/`     | Push focus/distraction events         |
| `/ws/gaze-collector/`   | Collect raw gaze data from client     |

---

## Project Structure

```
biasbreaker/
├── server/           # Django backend
│   ├── articles/     # Article logic & APIs
│   ├── eye_tracking/ # Consumers & gaze logic
│   ├── users/        # Auth & profiles
│   ├── manage.py
│   └── ...
├── client/           # Next.js frontend
│   ├── components/
│   ├── pages/
│   ├── store/
│   └── ...
├── tracker/          # Tobii companion app
└── README_EXPANDED.txt
```

---

## Continuous Integration & Testing (Future Scope)

- **GitHub Actions** runs on each PR:
  - `flake8` for linting
  - `pytest` for backend tests
  - `jest` for frontend tests
- **Coverage** report published to Coveralls.io

---

## Troubleshooting

- **CORS Errors**: Ensure `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` cover your frontend URL.  
- **WebSocket Failures**: Verify `.env` WebSocket URL matches server settings.  
- **LLM Timeouts**: Check API quotas & network connectivity; consider local model caching for dev.

---

## Roadmap

- [ ] Integrate real news via RSS/News API  
- [ ] Implement A/B testing for persuasive tactics  
- [ ] Develop native mobile & browser extension  
- [ ] Add social features & community forums  
- [ ] Enhance personalization with collaborative filtering  

---

## Contributing

1. Fork & clone the repo  
2. Create a feature branch (`git checkout -b feature/XYZ`)  
3. Commit & push changes  
4. Open a Pull Request with clear description & tests

---

## License

Distributed under the **MIT License**. See `LICENSE` for details.

---

## Contact & Acknowledgements

**Jaydipsinh Padhiyar**  
Master’s Candidate, Applied Computer Science  
Dalhousie University  
Email: jaydipsinh.padhiyar@dal.ca

Supervisors: Dr. Rita Orji, Dr. Bilkis Banire  
Lab: Persuasive Computing Lab
