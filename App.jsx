
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  BrainCircuit,
  Timer,
  Plus,
  Check,
  Trash2,
  Sparkles,
  Clock,
  Target,
  Flame,
  ChevronRight,
  Bell,
  X,
  Play,
  Pause,
  RotateCcw,
  ShieldCheck,
  Zap,
  ListChecks,
  Award,
} from "lucide-react";
import "./App.css";

const initialSubjects = [
  { name: "Data Structures", progress: 65, color: "#7865ed" },
  { name: "Mathematics", progress: 45, color: "#22b8cf" },
  { name: "Operating Systems", progress: 75, color: "#efa34c" },
  { name: "Computer Networks", progress: 30, color: "#e77bb6" },
];

const initialTasks = [
  {
    id: 1,
    title: "Revise important concepts",
    subject: "Data Structures",
    time: "9:00 AM",
    done: false,
  },
  {
    id: 2,
    title: "Practice previous year questions",
    subject: "Mathematics",
    time: "11:00 AM",
    done: false,
  },
  {
    id: 3,
    title: "Review process scheduling",
    subject: "Operating Systems",
    time: "2:00 PM",
    done: true,
  },
  {
    id: 4,
    title: "Study network layers",
    subject: "Computer Networks",
    time: "4:00 PM",
    done: false,
  },
];

const navigation = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Study Planner", icon: CalendarDays },
  { name: "My Subjects", icon: BookOpen },
  { name: "AI Study Buddy", icon: BrainCircuit, badge: "NEW" },
  { name: "Focus Timer", icon: Timer },
  { name: "Quiz Generator", icon: ListChecks, badge: "AI" },
];

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);

  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem("studysprint-tasks");
      return saved ? JSON.parse(saved) : initialTasks;
    } catch {
      return initialTasks;
    }
  });

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [selectedSubject, setSelectedSubject] = useState(
    "Data Structures"
  );

  const [aiInput, setAiInput] = useState("");
  const [examDate, setExamDate] = useState("");
  const [dailyHours, setDailyHours] = useState("4");
  const [aiResult, setAiResult] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
const [quizTopic, setQuizTopic] = useState("");
const [quizCount, setQuizCount] = useState("5");
const [quizQuestions, setQuizQuestions] = useState([]);
const [quizAnswers, setQuizAnswers] = useState({});
const [quizSubmitted, setQuizSubmitted] = useState(false);
const [loadingQuiz, setLoadingQuiz] = useState(false);
const [quizError, setQuizError] = useState("");
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);

  const [savedExamDate, setSavedExamDate] = useState(
    () => localStorage.getItem("studysprint-exam-date") || ""
  );

  useEffect(() => {
    localStorage.setItem("studysprint-tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    if (savedExamDate) {
      localStorage.setItem("studysprint-exam-date", savedExamDate);
    }
  }, [savedExamDate]);

  useEffect(() => {
    if (!timerRunning) return;

    const interval = setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          clearInterval(interval);
          setTimerRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerRunning]);

  const completedTasks = tasks.filter((task) => task.done).length;
  const completion = tasks.length
    ? Math.round((completedTasks / tasks.length) * 100)
    : 0;

  const remainingTasks = tasks.length - completedTasks;

  const daysUntilExam = savedExamDate
    ? Math.max(
        0,
        Math.ceil(
          (new Date(savedExamDate + "T00:00:00").getTime() -
            new Date().setHours(0, 0, 0, 0)) /
            86400000
        )
      )
    : null;

  function navigate(page) {
    setActivePage(page);
    setMobileMenu(false);
  }

  function addTask(event) {
    event.preventDefault();

    if (!newTask.trim()) return;

    setTasks((previous) => [
      ...previous,
      {
        id: Date.now(),
        title: newTask.trim(),
        subject: selectedSubject,
        time: "Added today",
        done: false,
      },
    ]);

    setNewTask("");
    setShowTaskModal(false);
  }

  function toggleTask(id) {
    setTasks((previous) =>
      previous.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task
      )
    );
  }

  function deleteTask(id) {
    setTasks((previous) => previous.filter((task) => task.id !== id));
  }

  async function generatePlan(event) {
    if (event) event.preventDefault();

    if (!aiInput.trim()) {
      setAiResult(
        "Please enter your subjects, syllabus or exam details first."
      );
      return;
    }

    setLoadingAI(true);
    setAiResult("");

    try {
      const response = await fetch("http://localhost:5000/api/ai/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          syllabus: aiInput,
          examDate: examDate || savedExamDate || "Not specified",
          dailyHours: Number(dailyHours) || 4,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || `Request failed: ${response.status}`
        );
      }

      setAiResult(
        data.plan ||
          data.result ||
          "The AI service returned an empty study plan."
      );
    } catch (error) {
      console.error("AI Study Plan Error:", error);
      setAiResult(
        `Could not generate your plan: ${error.message}. Check that the backend is running at localhost:5000 and your Gemini API key is valid.`
      );
    } finally {
      setLoadingAI(false);
    }
  }
async function generateQuiz(event) {
  event.preventDefault();

  if (!quizTopic.trim()) {
    setQuizError("Please enter a subject or topic.");
    return;
  }

  setLoadingQuiz(true);
  setQuizError("");
  setQuizQuestions([]);
  setQuizAnswers({});
  setQuizSubmitted(false);

  try {
    const response = await fetch(
      "http://localhost:5000/api/ai/quiz",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: quizTopic.trim(),
          count: Number(quizCount),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Quiz generation failed.");
    }

    if (!Array.isArray(data.questions) || data.questions.length === 0) {
      throw new Error("AI returned no questions. Please try again.");
    }

    const validQuestions = data.questions.filter(
      (question) =>
        typeof question.question === "string" &&
        Array.isArray(question.options) &&
        question.options.length === 4 &&
        Number.isInteger(question.answerIndex) &&
        question.answerIndex >= 0 &&
        question.answerIndex < 4 &&
        typeof question.explanation === "string"
    );

    if (validQuestions.length === 0) {
      throw new Error("Quiz format was invalid. Please generate again.");
    }

    setQuizQuestions(validQuestions);
  } catch (error) {
    console.error("AI Quiz Error:", error);
    setQuizError(error.message);
  } finally {
    setLoadingQuiz(false);
  }
}

function submitQuiz(event) {
  event.preventDefault();
  setQuizSubmitted(true);
}

function resetQuiz() {
  setQuizQuestions([]);
  setQuizAnswers({});
  setQuizSubmitted(false);
  setQuizError("");
}
  function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;
  }

  function resetTimer() {
    setTimerRunning(false);
    setSecondsLeft(timerMinutes * 60);
  }

  function renderTasks(list = tasks) {
    if (!list.length) {
      return (
        <div className="empty-state">
          <Target size={28} />
          <p>No tasks yet. Add your first study task!</p>
        </div>
      );
    }

    return (
      <div className="task-list">
        {list.map((task) => (
          <div
            className={`task-row ${task.done ? "task-complete" : ""}`}
            key={task.id}
          >
            <button
              className={`task-check ${task.done ? "checked" : ""}`}
              onClick={() => toggleTask(task.id)}
              aria-label={task.done ? "Mark incomplete" : "Mark complete"}
            >
              {task.done && <Check size={13} />}
            </button>

            <div className="task-detail">
              <strong>{task.title}</strong>
              <span>
                <BookOpen size={12} /> {task.subject}
              </span>
            </div>

            <span className="task-time">
              <Clock size={12} /> {task.time}
            </span>

            <button
              className="delete-task"
              onClick={() => deleteTask(task.id)}
              aria-label="Delete task"
              title="Delete task"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    );
  }

  function renderSubjects() {
    return (
      <div className="subject-list">
        {initialSubjects.map((item) => (
          <div key={item.name}>
            <div className="subject-info">
              <span
                className="subject-dot"
                style={{ background: item.color }}
              />
              <strong>{item.name}</strong>
              <small>{item.progress}% completed</small>
            </div>

            <div className="subject-progress">
              <div>
                <span
                  style={{
                    width: `${item.progress}%`,
                    background: item.color,
                  }}
                />
              </div>
              <strong>{item.progress}%</strong>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="app-shell">
      {mobileMenu && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileMenu(false)}
        />
      )}

      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-icon">
            <GraduationCapIcon />
          </div>

          <div>
            <h2>
              Study<span>Sprint</span>
            </h2>
            <p>AI STUDY PLANNER</p>
          </div>

          <button
            className="mobile-close"
            onClick={() => setMobileMenu(false)}
            aria-label="Close menu"
          >
            <X size={19} />
          </button>
        </div>

        <div className="nav-label">MENU</div>

        <nav>
          {navigation.map(({ name, icon: Icon, badge }) => (
            <button
              key={name}
              className={`nav-item ${
                activePage === name ? "active" : ""
              }`}
              onClick={() => navigate(name)}
            >
              <Icon size={18} />
              <span>{name}</span>
              {badge && <span className="new-tag">{badge}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <div className="upgrade-icon">
              <Sparkles size={17} />
            </div>
            <h3>Keep your momentum!</h3>
            <p>Little progress each day adds up to big results.</p>
            <div className="upgrade-line">
              <span />
            </div>
            <small>YOUR LEARNING JOURNEY</small>
          </div>

          <div className="profile">
            <div className="avatar">S</div>
            <div className="profile-info">
              <strong>Student</strong>
              <span>Learning every day</span>
            </div>
            <Zap className="profile-zap" size={17} />
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="top-left">
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenu(true)}
              aria-label="Open menu"
            >
              <span><LayoutDashboard size={21} /></span>
            </button>

            <div>
              <div className="breadcrumb">
                Workspace <ChevronRight size={12} />
                <strong>{activePage}</strong>
              </div>
              <h1>{activePage}</h1>
            </div>
          </div>

          <div className="top-actions">
            <div className="date-chip">
              <CalendarDays size={15} />
              {new Date().toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </div>
            <button
              className="primary-btn"
              onClick={() => setShowTaskModal(true)}
            >
              <Plus size={16} /> Add task
            </button>
          </div>
        </header>

        <div className="page-body">
          {activePage === "Dashboard" && (
            <>
              <section className="welcome-banner">
                <div className="welcome-copy">
                  <div className="eyebrow">
                    <Sparkles size={14} /> YOUR PERSONAL STUDY SPACE
                  </div>

                  <h2>
                    Make today <span>count.</span>
                  </h2>

                  <p>
                    Every focused minute brings you closer to your goals.
                    Let's make your study session productive!
                  </p>

                  <button
                    className="banner-btn"
                    onClick={() => navigate("AI Study Buddy")}
                  >
                    <BrainCircuit size={16} /> Create study plan
                    <ChevronRight size={15} />
                  </button>
                </div>

                <div className="banner-art">
                  <div className="orbit" />
                  <div className="orbit orbit-two" />

                  <div className="art-circle">
                    <GraduationCapIcon />
                  </div>

                  <div className="float-card float-card-one">
                    <Flame size={15} />
                    <strong>Stay focused!</strong>
                  </div>

                  <div className="float-card float-card-two">
                    <Check size={15} color="#22b89a" />
                    Daily progress
                  </div>

                  <Sparkles className="art-sparkle" size={19} />
                </div>
              </section>

              <section className="stats-grid">
                <div className="stat-card">
                  <div className="stat-top">
                    <span>Tasks completed</span>
                    <div className="stat-icon purple">
                      <Check />
                    </div>
                  </div>

                  <div className="stat-value">
                    {completedTasks}
                    <small> / {tasks.length} tasks</small>
                  </div>

                  <div className="stat-foot">
                    <span className="positive">{completion}%</span>
                    overall completion
                  </div>

                  <div className="mini-track">
                    <span style={{ width: `${completion}%` }} />
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span>Tasks remaining</span>
                    <div className="stat-icon orange">
                      <Target />
                    </div>
                  </div>

                  <div className="stat-value">{remainingTasks}</div>

                  <div className="stat-foot">
                    Keep going, you're making progress!
                  </div>

                  <div className="mini-track">
                    <span
                      style={{
                        width: `${
                          tasks.length
                            ? (remainingTasks / tasks.length) * 100
                            : 0
                        }%`,
                        background: "#efa34c",
                      }}
                    />
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span>Exam countdown</span>
                    <div className="stat-icon green">
                      <CalendarDays />
                    </div>
                  </div>

                  <div className="stat-value">
                    {daysUntilExam === null ? "—" : daysUntilExam}
                    {daysUntilExam !== null && (
                      <small> days left</small>
                    )}
                  </div>

                  <div className="stat-foot">Set your upcoming exam date</div>

                  <input
                    className="exam-date"
                    aria-label="Set exam date"
                    type="date"
                    value={savedExamDate}
                    onChange={(event) =>
                      setSavedExamDate(event.target.value)
                    }
                  />
                </div>
              </section>

              <section className="content-grid">
                <div className="panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Today's study tasks</h3>
                      <p>Stay on track with your daily goals.</p>
                    </div>

                    <button
                      className="text-btn"
                      onClick={() => navigate("Study Planner")}
                    >
                      View all <ChevronRight size={14} />
                    </button>
                  </div>

                  {renderTasks(tasks.slice(0, 4))}

                  <button
                    className="add-task-link"
                    onClick={() => setShowTaskModal(true)}
                  >
                    <Plus size={15} /> Add a new task
                  </button>
                </div>

                <div className="panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Subject progress</h3>
                      <p>Track your learning journey.</p>
                    </div>
                    <BookOpen size={20} className="muted-icon" />
                  </div>

                  {renderSubjects()}

                  <button
                    className="text-btn"
                    style={{ marginTop: 20 }}
                    onClick={() => navigate("My Subjects")}
                  >
                    View subjects <ChevronRight size={14} />
                  </button>
                </div>
              </section>

              <section className="bottom-grid">
                <div className="panel focus-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Focus session</h3>
                      <p>One session at a time.</p>
                    </div>
                    <Timer size={19} className="muted-icon" />
                  </div>

                  <div className="timer-area">
                    <div className="timer-ring">
                      <div>
                        <strong>{formatTime(secondsLeft)}</strong>
                        <span>FOCUS TIME</span>
                      </div>
                    </div>

                    <div className="timer-controls">
                      <button
                        className="primary-btn"
                        onClick={() => {
                          if (secondsLeft === 0) {
                            setSecondsLeft(timerMinutes * 60);
                          }
                          setTimerRunning((running) => !running);
                        }}
                      >
                        {timerRunning ? (
                          <><Pause size={15} /> Pause</>
                        ) : (
                          <><Play size={15} /> Start</>
                        )}
                      </button>

                      <button className="reset-btn" onClick={resetTimer}>
                        <RotateCcw size={14} /> Reset
                      </button>
                    </div>
                  </div>
                </div>

                <div className="ai-promo">
                  <div className="ai-promo-icon">
                    <BrainCircuit size={23} />
                  </div>

                  <div className="ai-label">YOUR AI STUDY ASSISTANT</div>
                  <h3>Study smarter,<br />not harder.</h3>
                  <p>
                    Get a personalized study plan made around your syllabus
                    and exam date.
                  </p>

                  <button
                    className="ai-button"
                    onClick={() => navigate("AI Study Buddy")}
                  >
                    <Sparkles size={15} /> Generate my plan
                    <ChevronRight size={14} />
                  </button>

                  <div className="ai-decoration">
                    <BrainCircuit />
                  </div>
                </div>
              </section>
            </>
          )}

          {activePage === "Study Planner" && (
            <section className="panel full-panel">
              <div className="panel-heading">
                <div>
                  <h3>My study planner</h3>
                  <p>Manage your tasks and keep your preparation organized.</p>
                </div>
                <button
                  className="primary-btn"
                  onClick={() => setShowTaskModal(true)}
                >
                  <Plus size={16} /> Add task
                </button>
              </div>

              <div className="mini-track">
                <span style={{ width: `${completion}%` }} />
              </div>

              <p className="settings-text">
                {completedTasks} completed out of {tasks.length} tasks ({completion}%).
              </p>

              {renderTasks()}
            </section>
          )}

          {activePage === "My Subjects" && (
            <section className="panel full-panel">
              <div className="panel-heading">
                <div>
                  <h3>My subjects</h3>
                  <p>Monitor your progress across your study subjects.</p>
                </div>
                <BookOpen size={22} className="muted-icon" />
              </div>

              {renderSubjects()}
            </section>
          )}

          {activePage === "AI Study Buddy" && (
            <section className="ai-workspace">
              <div className="ai-workspace-head">
                <div className="ai-big-icon">
                  <BrainCircuit size={30} />
                </div>

                <div className="eyebrow" style={{ justifyContent: "center" }}>
                  <Sparkles size={13} /> POWERED BY GEMINI AI
                </div>

                <h2>Your personal AI Study Buddy</h2>

                <p>
                  Tell us about your syllabus and upcoming exams. Your AI
                  assistant will create a practical study plan for you.
                </p>
              </div>

              <form className="ai-form" onSubmit={generatePlan}>
                <label htmlFor="ai-syllabus">
                  What do you need to study?
                </label>

                <textarea
                  id="ai-syllabus"
                  value={aiInput}
                  onChange={(event) => setAiInput(event.target.value)}
                  placeholder="Example: I have Data Structures, DBMS and Operating Systems exams. I need to revise trees, graphs, SQL joins and process scheduling..."
                  required
                />

                <div className="ai-form-row">
                  <div>
                    <label htmlFor="ai-exam-date">Upcoming exam date</label>
                    <input
                      id="ai-exam-date"
                      type="date"
                      value={examDate}
                      onChange={(event) => setExamDate(event.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="ai-hours">Daily study time</label>
                    <select
                      id="ai-hours"
                      value={dailyHours}
                      onChange={(event) => setDailyHours(event.target.value)}
                    >
                      <option value="2">2 hours per day</option>
                      <option value="3">3 hours per day</option>
                      <option value="4">4 hours per day</option>
                      <option value="5">5 hours per day</option>
                      <option value="6">6 hours per day</option>
                      <option value="8">8 hours per day</option>
                    </select>
                  </div>
                </div>

                <div className="hours-chip">
                  <Clock size={16} />
                  Your plan will be tailored to your available study time.
                </div>

                <button
                  className="primary-btn generate-btn"
                  type="submit"
                  disabled={loadingAI}
                >
                  {loadingAI ? (
                    <><Timer size={17} /> Generating your plan...</>
                  ) : (
                    <><Sparkles size={17} /> Generate my study plan</>
                  )}
                </button>

                <div className="privacy-note">
                  <ShieldCheck size={14} />
                  Your Gemini API key stays on your backend server.
                </div>

                {aiResult && (
                  <div className="ai-result">
                    <h3><Sparkles size={18} /> Your personalized study plan</h3>
                    <pre>{aiResult}</pre>
                  </div>
                )}
              </form>
            </section>
          )}
          {activePage === "Quiz Generator" && (
  <section className="quiz-workspace">
    <div className="quiz-intro">
      <div className="quiz-icon">
        <BrainCircuit size={28} />
      </div>

      <div className="eyebrow">
        <Sparkles size={13} /> AI POWERED LEARNING
      </div>

      <h2>Test your knowledge.</h2>
      <p>
        Generate a personalized quiz, practice MCQs, and
        understand your mistakes with AI explanations.
      </p>
    </div>

    <form className="quiz-generator-form" onSubmit={generateQuiz}>
      <label htmlFor="quiz-topic">Subject or topic</label>
      <textarea
        id="quiz-topic"
        value={quizTopic}
        onChange={(event) => setQuizTopic(event.target.value)}
        placeholder="e.g. Data Structures, DBMS, Operating Systems, Java..."
        required
      />

      <label htmlFor="quiz-count">Number of questions</label>
      <select
        id="quiz-count"
        value={quizCount}
        onChange={(event) => setQuizCount(event.target.value)}
      >
        <option value="5">5 questions</option>
        <option value="10">10 questions</option>
        <option value="15">15 questions</option>
      </select>

      <button
        type="submit"
        className="primary-btn generate-btn"
        disabled={loadingQuiz}
      >
        <Sparkles size={17} />
        {loadingQuiz ? "Generating quiz..." : "Generate AI Quiz"}
      </button>

      {quizError && (
        <p className="quiz-error">{quizError}</p>
      )}
    </form>

    {quizQuestions.length > 0 && (
      <form className="quiz-question-list" onSubmit={submitQuiz}>
        <div className="panel-heading">
          <div>
            <h3>{quizTopic} Quiz</h3>
            <p>
              {quizQuestions.length} questions · Select one answer
              per question.
            </p>
          </div>
        </div>

        {quizQuestions.map((question, questionIndex) => (
          <div className="quiz-question-card" key={questionIndex}>
            <h3>
              <span>{questionIndex + 1}.</span> {question.question}
            </h3>

            <div className="quiz-options">
              {question.options.map((option, optionIndex) => {
                const isSelected =
                  quizAnswers[questionIndex] === optionIndex;

                const isCorrect =
                  question.answerIndex === optionIndex;

                let optionClass = "";

                if (quizSubmitted && isCorrect) {
                  optionClass = "quiz-correct";
                } else if (
                  quizSubmitted &&
                  isSelected &&
                  !isCorrect
                ) {
                  optionClass = "quiz-incorrect";
                } else if (isSelected) {
                  optionClass = "quiz-selected";
                }

                return (
                  <button
                    key={optionIndex}
                    type="button"
                    className={`quiz-option ${optionClass}`}
                    disabled={quizSubmitted}
                    onClick={() =>
                      setQuizAnswers((previous) => ({
                        ...previous,
                        [questionIndex]: optionIndex,
                      }))
                    }
                  >
                    <span className="quiz-option-letter">
                      {String.fromCharCode(65 + optionIndex)}
                    </span>
                    <span>{option}</span>
                    {quizSubmitted && isCorrect && (
                      <Check size={17} />
                    )}
                    {quizSubmitted &&
                      isSelected &&
                      !isCorrect && <X size={17} />}
                  </button>
                );
              })}
            </div>

            {quizSubmitted && (
              <div className="quiz-explanation">
                <strong>
                  {quizAnswers[questionIndex] === question.answerIndex
                    ? "Correct answer"
                    : "Explanation"}
                </strong>
                <p>{question.explanation}</p>
              </div>
            )}
          </div>
        ))}

        {!quizSubmitted ? (
          <button
            type="submit"
            className="primary-btn generate-btn"
            disabled={
              Object.keys(quizAnswers).length !== quizQuestions.length
            }
          >
            <Award size={17} /> Submit Quiz
          </button>
        ) : (
          <div className="quiz-result">
            <Award size={30} />
            <h2>
              {quizQuestions.filter(
                (question, index) =>
                  quizAnswers[index] === question.answerIndex
              ).length}{" "}
              / {quizQuestions.length}
            </h2>
            <p>
              Score:{" "}
              {Math.round(
                (quizQuestions.filter(
                  (question, index) =>
                    quizAnswers[index] === question.answerIndex
                ).length /
                  quizQuestions.length) *
                  100
              )}
              %. Keep practising!
            </p>
            <button
              type="button"
              className="primary-btn"
              onClick={resetQuiz}
            >
              <RotateCcw size={16} /> Create another quiz
            </button>
          </div>
        )}
      </form>
    )}
  </section>
)}

          {activePage === "Focus Timer" && (
            <section className="panel timer-page">
              <div className="eyebrow">
                <Target size={14} /> DEEP WORK MODE
              </div>

              <h2>Time to focus.</h2>
              <p>Set aside distractions and give your studies your full attention.</p>

              <div className="timer-ring large-ring">
                <div>
                  <strong>{formatTime(secondsLeft)}</strong>
                  <span>{timerRunning ? "FOCUSING" : "FOCUS TIME"}</span>
                </div>
              </div>

              <div className="timer-controls" style={{ justifyContent: "center" }}>
                {[15, 25, 45, 60].map((minutes) => (
                  <button
                    key={minutes}
                    className="reset-btn"
                    style={{
                      background: timerMinutes === minutes ? "#f0edff" : "#fff",
                      color: timerMinutes === minutes ? "#6956df" : "#85819d",
                    }}
                    onClick={() => {
                      setTimerRunning(false);
                      setTimerMinutes(minutes);
                      setSecondsLeft(minutes * 60);
                    }}
                  >
                    {minutes} min
                  </button>
                ))}
              </div>

              <div
                className="timer-controls"
                style={{ justifyContent: "center", marginTop: 18 }}
              >
                <button
                  className="primary-btn"
                  onClick={() => {
                    if (secondsLeft === 0) {
                      setSecondsLeft(timerMinutes * 60);
                    }
                    setTimerRunning((running) => !running);
                  }}
                >
                  {timerRunning ? <Pause size={16} /> : <Play size={16} />}
                  {timerRunning ? "Pause session" : "Start focusing"}
                </button>

                <button className="reset-btn" onClick={resetTimer}>
                  <RotateCcw size={15} /> Reset
                </button>
              </div>

              <p className="settings-text" style={{ marginTop: 25 }}>
                Tip: Take a short break after each focused session.
              </p>
            </section>
          )}
        </div>
      </main>

      {showTaskModal && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowTaskModal(false);
            }
          }}
        >
          <form className="task-modal" onSubmit={addTask}>
            <button
              type="button"
              className="modal-close"
              onClick={() => setShowTaskModal(false)}
              aria-label="Close"
            >
              <X size={19} />
            </button>

            <div className="ai-big-icon">
              <Plus size={25} />
            </div>

            <h2>Add a study task</h2>
            <p>Break your goals into small, achievable tasks.</p>

            <label htmlFor="task-title">Task name</label>
            <input
              id="task-title"
              value={newTask}
              onChange={(event) => setNewTask(event.target.value)}
              placeholder="e.g. Revise binary trees"
              required
              autoFocus
            />

            <label htmlFor="task-subject">Subject</label>
            <select
              id="task-subject"
              value={selectedSubject}
              onChange={(event) => setSelectedSubject(event.target.value)}
            >
              {initialSubjects.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>

            <button className="primary-btn modal-submit" type="submit">
              <Plus size={16} /> Save task
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function GraduationCapIcon() {
  return <BookOpen size={27} />;
}

export default App;
