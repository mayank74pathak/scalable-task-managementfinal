import { useState, useEffect, useCallback, useRef } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
type TaskStatus = "pending" | "in_progress" | "done";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  created_at: string;
}

interface TaskListResponse {
  total: number;
  page: number;
  limit: number;
  data: Task[];
}

interface AuthState {
  token: string | null;
  user: string | null;
}

// ─── API ──────────────────────────────────────────────────────────────────────
const BASE ="https://scalable-task-managementfinal.onrender.com/api/v1";

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Request failed");
  return data as T;
}

// ─── Colours & Design System ─────────────────────────────────────────────────
const STATUS_META: Record<
  TaskStatus,
  { label: string; bg: string; dot: string; text: string }
> = {
  pending: {
    label: "Pending",
    bg: "rgba(250,238,218,0.6)",
    dot: "#BA7517",
    text: "#633806",
  },
  in_progress: {
    label: "In Progress",
    bg: "rgba(181,212,244,0.45)",
    dot: "#185FA5",
    text: "#0C447C",
  },
  done: {
    label: "Done",
    bg: "rgba(192,221,151,0.45)",
    dot: "#3B6D11",
    text: "#27500A",
  },
};

// ─── Inline Global Styles ────────────────────────────────────────────────────
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'DM Sans', sans-serif;
      background: #F7F5F0;
      color: #1a1a18;
      min-height: 100vh;
    }

    :root {
      --sand: #F7F5F0;
      --sand-dark: #EDE9E1;
      --ink: #1a1a18;
      --ink-muted: #5F5E5A;
      --ink-faint: #B4B2A9;
      --accent: #3C3489;
      --accent-light: #EEEDFE;
      --accent-mid: #7F77DD;
      --border: rgba(0,0,0,0.1);
      --radius: 12px;
      --radius-sm: 8px;
    }

    input, textarea, select {
      font-family: inherit;
      font-size: 14px;
      outline: none;
      border: 1px solid var(--border);
      background: white;
      border-radius: var(--radius-sm);
      padding: 10px 14px;
      width: 100%;
      transition: border-color 0.15s;
      color: var(--ink);
    }
    input:focus, textarea:focus, select:focus {
      border-color: var(--accent-mid);
      box-shadow: 0 0 0 3px rgba(127,119,221,0.15);
    }

    button {
      font-family: inherit;
      cursor: pointer;
      border: none;
      transition: all 0.15s;
    }
    button:active { transform: scale(0.98); }

    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--ink-faint); border-radius: 99px; }

    .fade-in {
      animation: fadeIn 0.25s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `}</style>
);

// ─── Spinner ─────────────────────────────────────────────────────────────────
const Spinner = ({ size = 18 }: { size?: number }) => (
  <span
    style={{
      display: "inline-block",
      width: size,
      height: size,
      border: `2px solid rgba(255,255,255,0.35)`,
      borderTopColor: "white",
      borderRadius: "50%",
      animation: "spin 0.7s linear infinite",
    }}
  />
);

// ─── Auth Page ────────────────────────────────────────────────────────────────
function AuthPage({
  onAuth,
}: {
  onAuth: (token: string, email: string) => void;
}) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        await apiFetch("/auth/signup", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        setSuccess("Account created! Please sign in.");
        setMode("login");
      } else {
        const res = await apiFetch<{ access_token: string }>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        onAuth(res.access_token, email);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* decorative blobs */}
      <div
        style={{
          position: "fixed",
          top: "-120px",
          right: "-120px",
          width: 480,
          height: 480,
          background:
            "radial-gradient(circle, rgba(127,119,221,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: "-80px",
          left: "-80px",
          width: 340,
          height: 340,
          background:
            "radial-gradient(circle, rgba(29,158,117,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        className="fade-in"
        style={{
          background: "white",
          borderRadius: 20,
          padding: "3rem 2.5rem",
          width: "100%",
          maxWidth: 420,
          boxShadow: "0 4px 40px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.06)",
          position: "relative",
        }}
      >
        {/* Logo / Brand */}
        <div style={{ marginBottom: "2.5rem", textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 48,
              height: 48,
              background: "var(--accent)",
              borderRadius: 14,
              marginBottom: 16,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect
                x="3"
                y="5"
                width="14"
                height="2.5"
                rx="1.25"
                fill="rgba(255,255,255,0.9)"
              />
              <rect
                x="3"
                y="10.75"
                width="10"
                height="2.5"
                rx="1.25"
                fill="rgba(255,255,255,0.65)"
              />
              <rect
                x="3"
                y="16.5"
                width="7"
                height="2.5"
                rx="1.25"
                fill="rgba(255,255,255,0.4)"
              />
              <circle
                cx="19.5"
                cy="16.5"
                r="3.5"
                fill="rgba(255,255,255,0.3)"
                stroke="white"
                strokeWidth="1.5"
              />
              <path
                d="M18 16.5l1 1 2-2"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 28,
              fontWeight: 400,
              color: "var(--ink)",
              letterSpacing: "-0.5px",
            }}
          >
            TaskFlow
          </h1>
          <p style={{ fontSize: 13, color: "var(--ink-muted)", marginTop: 4 }}>
            {mode === "login" ? "Welcome back" : "Create your account"}
          </p>
        </div>

        {/* Toggle */}
        <div
          style={{
            display: "flex",
            background: "var(--sand)",
            borderRadius: 10,
            padding: 4,
            marginBottom: "1.75rem",
          }}
        >
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setError("");
                setSuccess("");
              }}
              style={{
                flex: 1,
                padding: "8px 0",
                fontSize: 13,
                fontWeight: 500,
                borderRadius: 7,
                background: mode === m ? "white" : "transparent",
                color: mode === m ? "var(--accent)" : "var(--ink-muted)",
                boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                transition: "all 0.2s",
              }}
            >
              {m === "login" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginBottom: "1.25rem",
          }}
        >
          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--ink-muted)",
                display: "block",
                marginBottom: 6,
              }}
            >
              EMAIL
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKey}
            />
          </div>
          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--ink-muted)",
                display: "block",
                marginBottom: 6,
              }}
            >
              PASSWORD
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKey}
            />
          </div>
        </div>

        {error && (
          <div
            style={{
              background: "#FCEBEB",
              color: "#A32D2D",
              fontSize: 13,
              padding: "10px 14px",
              borderRadius: 8,
              marginBottom: 12,
            }}
          >
            {error}
          </div>
        )}
        {success && (
          <div
            style={{
              background: "#EAF3DE",
              color: "#3B6D11",
              fontSize: 13,
              padding: "10px 14px",
              borderRadius: 8,
              marginBottom: 12,
            }}
          >
            {success}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px 0",
            background: loading ? "var(--accent-mid)" : "var(--accent)",
            color: "white",
            fontSize: 14,
            fontWeight: 500,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {loading ? (
            <Spinner />
          ) : mode === "login" ? (
            "Sign In"
          ) : (
            "Create Account"
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────
function TaskCard({
  task,
  onStatusChange,
  onDelete,
  onEdit,
}: {
  task: Task;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}) {
  const meta = STATUS_META[task.status];
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const nextStatus: Record<TaskStatus, TaskStatus> = {
    pending: "in_progress",
    in_progress: "done",
    done: "pending",
  };

  return (
    <div
      className="fade-in"
      style={{
        background: "white",
        borderRadius: var_radius,
        border: "1px solid var(--border)",
        padding: "1.25rem",
        position: "relative",
        transition: "box-shadow 0.15s",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.07)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
    >
      {/* Status badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <button
          onClick={() => onStatusChange(task.id, nextStatus[task.status])}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: meta.bg,
            color: meta.text,
            fontSize: 11,
            fontWeight: 500,
            padding: "4px 10px",
            borderRadius: 99,
            letterSpacing: "0.02em",
          }}
          title="Click to advance status"
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: meta.dot,
              flexShrink: 0,
            }}
          />
          {meta.label}
        </button>

        {/* Kebab menu */}
        <div ref={ref} style={{ position: "relative" }}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: menuOpen ? "var(--sand)" : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--ink-muted)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <circle cx="7" cy="2.5" r="1.2" />
              <circle cx="7" cy="7" r="1.2" />
              <circle cx="7" cy="11.5" r="1.2" />
            </svg>
          </button>
          {menuOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 32,
                background: "white",
                borderRadius: 10,
                border: "1px solid var(--border)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                zIndex: 10,
                overflow: "hidden",
                minWidth: 120,
              }}
            >
              <button
                onClick={() => {
                  onEdit(task);
                  setMenuOpen(false);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "9px 14px",
                  textAlign: "left",
                  fontSize: 13,
                  background: "transparent",
                  color: "var(--ink)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--sand)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                Edit
              </button>
              <button
                onClick={() => {
                  onDelete(task.id);
                  setMenuOpen(false);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "9px 14px",
                  textAlign: "left",
                  fontSize: 13,
                  background: "transparent",
                  color: "#A32D2D",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#FCEBEB")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <h3
        style={{
          fontSize: 15,
          fontWeight: 500,
          color: "var(--ink)",
          marginBottom: 6,
          lineHeight: 1.4,
        }}
      >
        {task.title}
      </h3>
      {task.description && (
        <p
          style={
            {
              fontSize: 13,
              color: "var(--ink-muted)",
              lineHeight: 1.6,
              marginBottom: 8,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            } as React.CSSProperties
          }
        >
          {task.description}
        </p>
      )}

      <p style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: 10 }}>
        {new Date(task.created_at).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </p>
    </div>
  );
}

const var_radius = "var(--radius)";

// ─── Task Modal ───────────────────────────────────────────────────────────────
function TaskModal({
  task,
  onClose,
  onSave,
}: {
  task?: Task | null;
  onClose: () => void;
  onSave: (data: {
    title: string;
    description: string;
    status: TaskStatus;
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onSave({ title: title.trim(), description, status });
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(26,26,24,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        backdropFilter: "blur(3px)",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 20,
          padding: "2rem",
          width: "100%",
          maxWidth: 480,
          animation: "slideUp 0.2s ease",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1.5rem",
          }}
        >
          <h2
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 22,
              fontWeight: 400,
              color: "var(--ink)",
            }}
          >
            {task ? "Edit Task" : "New Task"}
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "var(--sand)",
              color: "var(--ink-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--ink-muted)",
                display: "block",
                marginBottom: 6,
              }}
            >
              TITLE *
            </label>
            <input
              autoFocus
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--ink-muted)",
                display: "block",
                marginBottom: 6,
              }}
            >
              DESCRIPTION
            </label>
            <textarea
              placeholder="Add details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{ resize: "vertical" }}
            />
          </div>
          {task && (
            <div>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--ink-muted)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                STATUS
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          )}
        </div>

        {error && (
          <div
            style={{
              background: "#FCEBEB",
              color: "#A32D2D",
              fontSize: 13,
              padding: "10px 14px",
              borderRadius: 8,
              marginTop: 14,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "11px 0",
              borderRadius: 10,
              background: "var(--sand)",
              color: "var(--ink)",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              flex: 2,
              padding: "11px 0",
              borderRadius: 10,
              background: loading ? "var(--accent-mid)" : "var(--accent)",
              color: "white",
              fontSize: 14,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {loading ? <Spinner /> : task ? "Save Changes" : "Create Task"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CSV Import Banner ────────────────────────────────────────────────────────
function CSVImport({
  token,
  onImport,
}: {
  token: string;
  onImport: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    created: number;
    errors: string[];
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${BASE}/files/import-tasks`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setResult(data);
      onImport();
    } catch (e: unknown) {
      setResult({
        created: 0,
        errors: [e instanceof Error ? e.message : "Import failed"],
      });
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        onChange={handleFile}
        style={{ display: "none" }}
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={loading}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          padding: "9px 16px",
          borderRadius: 9,
          background: "var(--sand)",
          color: "var(--ink-muted)",
          fontSize: 13,
          fontWeight: 500,
          border: "1px solid var(--border)",
        }}
      >
        {loading ? (
          <Spinner size={13} />
        ) : (
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path
              d="M6.5 1v7M3.5 5l3 3 3-3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M1 10h11"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        )}
        Import CSV
      </button>
      {result && (
        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            color: result.errors.length ? "#A32D2D" : "#3B6D11",
          }}
        >
          {result.created} tasks created
          {result.errors.length > 0 && ` · ${result.errors.length} errors`}
        </div>
      )}
    </div>
  );
}

// ─── Dashboard / Task Page ────────────────────────────────────────────────────
function Dashboard({
  auth,
  onLogout,
}: {
  auth: AuthState;
  onLogout: () => void;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<"create" | Task | null>(null);
  const limit = 9;

  const fetchTasks = useCallback(async () => {
    if (!auth.token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      });
      const res = await apiFetch<TaskListResponse>(
        `/tasks/?${params}`,
        {},
        auth.token,
      );
      setTasks(res.data);
      setTotal(res.total);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [auth.token, page, statusFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const handleCreate = async (data: {
    title: string;
    description: string;
    status: TaskStatus;
  }) => {
    await apiFetch(
      "/tasks/",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      auth.token,
    );
    fetchTasks();
  };

  const handleUpdate = async (
    task: Task,
    data: { title: string; description: string; status: TaskStatus },
  ) => {
    await apiFetch(
      `/tasks/${task.id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
      auth.token,
    );
    fetchTasks();
  };

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    await apiFetch(
      `/tasks/${id}`,
      {
        method: "PUT",
        body: JSON.stringify({ status }),
      },
      auth.token,
    );
    fetchTasks();
  };

  const handleDelete = async (id: string) => {
    await apiFetch(`/tasks/${id}`, { method: "DELETE" }, auth.token);
    fetchTasks();
  };

  const totalPages = Math.ceil(total / limit);
  const counts: Record<string, number> = { all: total };

  // Count by status (rough from loaded data)
  tasks.forEach((t) => {
    counts[t.status] = (counts[t.status] ?? 0) + 1;
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--sand)" }}>
      {/* Header */}
      <header
        style={{
          background: "white",
          borderBottom: "1px solid var(--border)",
          padding: "0 2rem",
          height: 58,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect
                x="3"
                y="5"
                width="14"
                height="2.5"
                rx="1.25"
                fill="white"
                opacity="0.9"
              />
              <rect
                x="3"
                y="10.75"
                width="10"
                height="2.5"
                rx="1.25"
                fill="white"
                opacity="0.65"
              />
              <rect
                x="3"
                y="16.5"
                width="7"
                height="2.5"
                rx="1.25"
                fill="white"
                opacity="0.4"
              />
              <circle
                cx="19.5"
                cy="16.5"
                r="3.5"
                fill="rgba(255,255,255,0.2)"
                stroke="white"
                strokeWidth="1.5"
              />
              <path
                d="M18 16.5l1 1 2-2"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 18,
              color: "var(--ink)",
              letterSpacing: "-0.3px",
            }}
          >
            TaskFlow
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>
            {auth.user}
          </span>
          <button
            onClick={onLogout}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              background: "var(--sand)",
              color: "var(--ink-muted)",
              fontSize: 13,
              fontWeight: 500,
              border: "1px solid var(--border)",
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main */}
      <main
        style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1.5rem" }}
      >
        {/* Page title + actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: "1.75rem",
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 28,
                fontWeight: 400,
                color: "var(--ink)",
                letterSpacing: "-0.5px",
                lineHeight: 1.2,
              }}
            >
              My Tasks
            </h1>
            <p
              style={{ fontSize: 13, color: "var(--ink-muted)", marginTop: 2 }}
            >
              {total} task{total !== 1 ? "s" : ""} total
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <CSVImport token={auth.token!} onImport={fetchTasks} />
            <button
              onClick={() => setModal("create")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "9px 18px",
                borderRadius: 9,
                background: "var(--accent)",
                color: "white",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path
                  d="M6.5 1v11M1 6.5h11"
                  stroke="white"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              New Task
            </button>
          </div>
        </div>

        {/* Status filter pills */}
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: "1.5rem",
          }}
        >
          {(["all", "pending", "in_progress", "done"] as const).map((s) => {
            const active = statusFilter === s;
            const meta = s !== "all" ? STATUS_META[s] : null;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 14px",
                  borderRadius: 99,
                  background: active ? "var(--accent)" : "white",
                  color: active ? "white" : "var(--ink-muted)",
                  fontSize: 12,
                  fontWeight: 500,
                  border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                  transition: "all 0.15s",
                }}
              >
                {meta && (
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: active ? "rgba(255,255,255,0.7)" : meta.dot,
                    }}
                  />
                )}
                {s === "all" ? "All" : STATUS_META[s].label}
              </button>
            );
          })}
        </div>

        {/* Task Grid */}
        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: 240,
              color: "var(--ink-faint)",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                border: "2px solid var(--accent-light)",
                borderTopColor: "var(--accent)",
                borderRadius: "50%",
                animation: "spin 0.7s linear infinite",
              }}
            />
          </div>
        ) : tasks.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "5rem 2rem",
              color: "var(--ink-faint)",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.4 }}>
              <svg
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
                style={{ margin: "0 auto", display: "block" }}
              >
                <rect
                  x="8"
                  y="10"
                  width="28"
                  height="5"
                  rx="2.5"
                  fill="currentColor"
                  opacity="0.4"
                />
                <rect
                  x="8"
                  y="21"
                  width="20"
                  height="5"
                  rx="2.5"
                  fill="currentColor"
                  opacity="0.25"
                />
                <rect
                  x="8"
                  y="32"
                  width="14"
                  height="5"
                  rx="2.5"
                  fill="currentColor"
                  opacity="0.15"
                />
              </svg>
            </div>
            <p
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: "var(--ink-muted)",
              }}
            >
              No tasks yet
            </p>
            <p style={{ fontSize: 13, marginTop: 4 }}>
              Create your first task or import a CSV
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 14,
            }}
          >
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                onEdit={(t) => setModal(t)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginTop: "2rem",
            }}
          >
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                background: page === 1 ? "transparent" : "white",
                border: "1px solid var(--border)",
                color: page === 1 ? "var(--ink-faint)" : "var(--ink)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  background: page === p ? "var(--accent)" : "white",
                  border: `1px solid ${page === p ? "var(--accent)" : "var(--border)"}`,
                  color: page === p ? "white" : "var(--ink)",
                  fontSize: 13,
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                background: page === totalPages ? "transparent" : "white",
                border: "1px solid var(--border)",
                color: page === totalPages ? "var(--ink-faint)" : "var(--ink)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ›
            </button>
          </div>
        )}
      </main>

      {/* Modals */}
      {modal === "create" && (
        <TaskModal onClose={() => setModal(null)} onSave={handleCreate} />
      )}
      {modal && modal !== "create" && (
        <TaskModal
          task={modal as Task}
          onClose={() => setModal(null)}
          onSave={(data) => handleUpdate(modal as Task, data)}
        />
      )}
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [auth, setAuth] = useState<AuthState>(() => {
    try {
      return {
        token: sessionStorage.getItem("tf_token"),
        user: sessionStorage.getItem("tf_user"),
      };
    } catch {
      return { token: null, user: null };
    }
  });

  const handleAuth = (token: string, email: string) => {
    sessionStorage.setItem("tf_token", token);
    sessionStorage.setItem("tf_user", email);
    setAuth({ token, user: email });
  };

  const handleLogout = () => {
    sessionStorage.removeItem("tf_token");
    sessionStorage.removeItem("tf_user");
    setAuth({ token: null, user: null });
  };

  return (
    <>
      <GlobalStyle />
      {auth.token ? (
        <Dashboard auth={auth} onLogout={handleLogout} />
      ) : (
        <AuthPage onAuth={handleAuth} />
      )}
    </>
  );
}
