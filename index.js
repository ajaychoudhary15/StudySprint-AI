
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "StudySprint AI server is running!" });
});

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

app.post("/api/ai/plan", async (req, res) => {
  const { syllabus, examDate, dailyHours } = req.body;

  if (!syllabus || !syllabus.trim()) {
    return res.status(400).json({
      error: "Please enter your syllabus or subjects.",
    });
  }

  const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";

  const prompt = `Create a practical study plan.
Syllabus: ${syllabus}
Exam date: ${examDate || "Not specified"}
Daily study hours: ${dailyHours || 4}

Give a day-wise study plan, important topics, revision strategy,
and practice questions. Make the plan realistic and easy to follow.`;

  let lastError;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`Generating study plan (attempt ${attempt}/3)...`);

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });

      const plan = response.text;

      if (!plan) {
        throw new Error("Gemini returned an empty response.");
      }

      console.log("Study plan generated successfully.");
      return res.json({ plan });
    } catch (error) {
      lastError = error;

      const status = Number(
        error.status || error.code || error.error?.code || 0
      );

      console.error(`Gemini attempt ${attempt} failed:`, {
        status,
        message: error.message,
      });

      const retryable = [429, 500, 502, 503, 504].includes(status);

      if (!retryable || attempt === 3) {
        break;
      }

      // Wait 2 seconds, then 4 seconds before retrying.
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

  const message = lastError?.message || "Unknown Gemini API error";

  if (status === 503) {
    return res.status(503).json({
      error: "Gemini is temporarily busy after 3 attempts. Please try again shortly.",
    });
  }

  if (status === 429) {
    return res.status(429).json({
      error: "Gemini API rate limit or quota reached. Check your API quota.",
    });
  }

  if (status === 401 || status === 403) {
    return res.status(status).json({
      error: "Gemini API key or permissions issue. Check your API key settings.",
    });
  }

  if (status === 404) {
    return res.status(404).json({
      error: `Gemini model "${process.env.GEMINI_MODEL || "gemini-3.8-flash"}" is unavailable. Check the model name and API access.`,
    });
  }

  return res.status(500).json({
    error: `Gemini API error: ${message}`,
  });
});
app.post("/api/ai/quiz", async (req, res) => {
  const { topic, count } = req.body;

  if (!topic || !topic.trim()) {
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
    console.log(`Generating ${questionCount} quiz questions about: ${topic}`);

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    let text = response.text;

    if (!text) {
      throw new Error("Gemini returned an empty quiz.");
    }

    text = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    const result = JSON.parse(text);

    if (
      !Array.isArray(result.questions) ||
      result.questions.length === 0
    ) {
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

    if (questions.length === 0) {
      throw new Error("No valid questions were generated.");
    }

    console.log(`Quiz generated: ${questions.length} questions.`);

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

app.listen(PORT, () => {
  console.log(`StudySprint AI server running at http://localhost:${PORT}`);
});
