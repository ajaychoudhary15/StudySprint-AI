# StudySprint AI 🎓

**Your AI-powered personal study companion.**

StudySprint AI helps students plan their preparation, practice multiple-choice questions, organize subjects, and build consistent study habits — all in one place.

## ✨ Features

- 🤖 **AI Study Planner** — Generate personalized study plans based on your syllabus, exam date, and daily study hours.
- 🧠 **AI Quiz Generator** — Create topic-based MCQ quizzes, select answers, view explanations, and calculate your score.
- 📚 **Subject Management** — Organize your subjects and study tasks.
- ⏱️ **Focus Timer** — Use focused study sessions to improve productivity.
- 📊 **Study Dashboard** — View your study information and track your tasks.
- 🔐 **Authentication** — Sign in to access your study workspace.
- 💾 **Data Persistence** — Retain supported application data across sessions.
- 📱 **Responsive UI** — A clean interface designed for a smooth study experience.

## 🛠️ Tech Stack

**Frontend**
- React
- Vite
- CSS
- Lucide React

**Backend**
- Node.js
- Express.js
- Google Gemini API

**Database**
- MongoDB

## 📁 Project Structure

```text
StudySprint-AI/
├── client/          # React + Vite frontend
├── server/          # Express backend and AI APIs
├── package.json     # Root project configuration
├── .gitignore
└── README.md
```

## ⚙️ Getting Started

### Prerequisites

- Node.js and npm
- MongoDB connection
- Google Gemini API key

### 1. Clone the repository

```bash
git clone https://github.com/ajaychoudhary15/StudySprint-AI.git
cd StudySprint-AI
```

### 2. Install dependencies

```bash
cd client
npm install
```

Then install backend dependencies:

```bash
cd ../server
npm install
```

### 3. Configure environment variables

Create a `.env` file in the `server` directory using the available `.env.example` as a reference.

Configure your own values for:

```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=your_supported_gemini_model
MONGODB_URI=your_mongodb_connection_string
```

**Never commit your actual API key, database credentials, or `.env` file to GitHub.**

### 4. Run the backend

From the `server` directory:

```bash
npm run dev
```

If no development script is configured, use the script available in `server/package.json`.

### 5. Run the frontend

Open a separate terminal:

```bash
cd client
npm run dev
```

Open the local URL printed by Vite, usually:

```text
http://localhost:5173
```

Ensure the frontend API URL and backend CORS settings match your local or deployed environment.

## 🔑 Environment Variables

The application requires valid Gemini API credentials and a configured MongoDB connection for the relevant backend features. Set production values in your hosting provider's environment-variable settings.

## 🚀 Deployment

The frontend can be deployed on Netlify, and the Express backend can be deployed on a Node.js hosting platform such as Render. Configure the production API URL, CORS origin, Gemini API key, and database connection before using the live application.

## 🎯 Project Goal

StudySprint AI was built to make study planning more organized and quiz practice more accessible through AI-assisted learning tools.

## 👨‍💻 Author

**Ajay Tomar**

- GitHub: [@ajaychoudhary15](https://github.com/ajaychoudhary15)
- LinkedIn: [Ajay Tomar](https://linkedin.com/in/ajay-tomar-509a29385)

---

*Built with React, Node.js, and AI-assisted learning features.*