
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// Check required environment variables
if (!process.env.MONGODB_URI) {
  console.error("Missing MONGODB_URI in server/.env");
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error("Missing JWT_SECRET in server/.env");
  process.exit(1);
}

if (!process.env.GEMINI_API_KEY) {
  console.error("Missing GEMINI_API_KEY in server/.env");
  process.exit(1);
}

// MongoDB User Model
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

// Create a JWT for an authenticated user
function createToken(user) {
  return jwt.sign(
    { userId: user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// SIGN UP
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        error: "Name, email and password are required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        error: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    return res.status(201).json({
      message: "Account created successfully.",
      token: createToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        error: "An account with this email already exists.",
      });
    }

    console.error("Signup error:", error.message);

    return res.status(500).json({
      error: "Could not create account. Please try again.",
    });
  }
});

// SIGN IN
app.post("/api/auth/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        error: "Email and password are required.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        error: "Invalid email or password.",
      });
    }

    return res.json({
      message: "Login successful.",
      token: createToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Signin error:", error.message);

    return res.status(500).json({
      error: "Could not sign in. Please try again.",
    });
  }
});

// Basic server health check
app.get("/", (req, res) => {
  res.json({
    message: "StudySprint AI server is running!",
  });
});

// Gemini AI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// AI STUDY PLANNER
app.post("/api/ai/plan", async (req, res) => {
  const { syllabus, examDate, dailyHours } = req.body;

  if (typeof syllabus !== "string" || !syllabus.trim()) {
    return res.status(400).json({
      error: "Please enter your syllabus or subjects.",
    });
  }

  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

  const prompt = `Create a practical study plan.
Syllabus: ${syllabus}
Exam date: ${examDate || "Not specified"}
Daily study hours: ${dailyHours || 4}

Give a day-wise study plan, important topics, revision strategy,
and practice questions. Make the plan realistic and easy to follow.`;

  let lastError;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(
        `Generating study plan (attempt ${attempt}/3)...`
      );

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });

      const plan = response.text;

      if (!plan) {
        throw new Error("Gemini returned an empty response.");
      }

      return res.json({ plan });
    } catch (error) {
      lastError = error;

      const status = Number(
        error.status || error.code || error.error?.code || 0
      );

      console.error(`Study plan attempt ${attempt} failed:`, {
        status,
        message: error.message,
      });

      const retryable = [429, 500, 502, 503, 504].includes(status);

      if (!retryable || attempt === 3) {
        break;
      }

      await new Promise((resolve) =>
        setTimeout(resolve, attempt * 2000)
      );
    }
  }

  const status = Number(
    lastError?.status ||
    lastError?.code ||
    lastError?.error?.code ||
    0
  );

  if (status === 429) {
    return res.status(429).json({
      error: "Gemini API quota reached. Please try again later.",
    });
  }

  if (status === 503) {
    return res.status(503).json({
      error: "Gemini is temporarily busy. Please try again shortly.",
    });
  }

  if (status === 401 || status === 403) {
    return res.status(status).json({
      error: "Check your Gemini API key and permissions.",
    });
  }

  if (status === 404) {
    return res.status(404).json({
      error: `Gemini model "${process.env.GEMINI_MODEL || "gemini-3.5-flash-lite"}" is unavailable. Check the model name.`,
    });
  }

  return res.status(500).json({
    error: `Gemini API error: ${lastError?.message || "Unknown error"}`,
  });
});

// AI QUIZ GENERATOR
app.post("/api/ai/quiz", async (req, res) => {
  const { topic, count } = req.body;

  if (typeof topic !== "string" || !topic.trim()) {
    return res.status(400).json({
      error: "Please enter a subject or topic.",
    });
  }

  const questionCount = Number(count);

  if (![5, 10, 15].includes(questionCount)) {
    return res.status(400).json({
      error: "Choose 5, 10, or 15 questions.",
    });
  }

  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

  const prompt = `
Create exactly ${questionCount} multiple-choice quiz questions
about this topic: ${topic.trim()}.

Requirements:
- Each question must have exactly 4 options.
- There must be exactly one correct answer.
- answerIndex must be a zero-based integer from 0 to 3.
- Include a clear explanation of the correct answer.
- Use accurate facts and appropriate difficulty.
- Return ONLY valid JSON. Do not use Markdown fences.

Required JSON structure:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answerIndex": 0,
      "explanation": "Explanation of the correct answer"
    }
  ]
}
`;

  try {
    console.log(`Generating quiz about: ${topic.trim()}`);

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    let responseText = response.text;

    if (!responseText) {
      throw new Error("Gemini returned an empty quiz.");
    }

    responseText = responseText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    const result = JSON.parse(responseText);

    if (!Array.isArray(result.questions)) {
      throw new Error("Gemini returned an invalid quiz format.");
    }

    const questions = result.questions.filter(
      (question) =>
        typeof question.question === "string" &&
        Array.isArray(question.options) &&
        question.options.length === 4 &&
        Number.isInteger(question.answerIndex) &&
        question.answerIndex >= 0 &&
        question.answerIndex < 4 &&
        typeof question.explanation === "string"
    );

    if (questions.length !== questionCount) {
      throw new Error(
        "Gemini did not return the requested number of valid questions. Please try again."
      );
    }

    return res.json({ questions });
  } catch (error) {
    console.error("Gemini Quiz Error:", error.message);

    const status = Number(
      error.status || error.code || error.error?.code || 0
    );

    if (status === 429) {
      return res.status(429).json({
        error: "Gemini quota reached. Please try again later.",
      });
    }

    if (status === 503) {
      return res.status(503).json({
        error: "Gemini is busy right now. Please try again shortly.",
      });
    }

    if (status === 401 || status === 403) {
      return res.status(status).json({
        error: "Check your Gemini API key and permissions.",
      });
    }

    return res.status(500).json({
      error: "Could not generate quiz. " + error.message,
    });
  }
});

// Connect to MongoDB, then start the server ONCE
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("[Database] MongoDB connected");

    app.listen(PORT, () => {
      console.log(
        `StudySprint AI server running at http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error("[Database] Connection failed:", error.message);
    process.exit(1);
  }
}

startServer();
