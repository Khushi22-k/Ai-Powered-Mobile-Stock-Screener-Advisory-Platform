import { Link } from 'react-router-dom';
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-cyan-400/40 bg-cyan-500/10">
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-5 w-5 text-cyan-300"
        >
          <path
            d="M4 16.5 9.5 9l4 4L20 5.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4 19.5h16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <span className="text-lg font-semibold tracking-tight text-slate-50">StockAI</span>
    </div>
  );
}

function Feature({ title, description }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-slate-900/70 p-4">
      <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300">
        <span className="text-sm">★</span>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-50">{title}</h3>
        <p className="mt-1 text-xs text-slate-400">{description}</p>
      </div>
    </div>
  );
}


export default function Auth({ mode = "signin" }) {
  const isSignIn = mode === "signin";
  const navigate = useNavigate();

  // ✅ ALL state goes here (ONCE)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ✅ Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      if (isSignIn) {
        // Sign In logic
        const res = await fetch("http://localhost:5000/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        console.log("Response:", data);

        if (!res.ok) {
          setError(data.message || "Login failed");
          return;
        }

        console.log("Login success");
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("username", data.username);

        // Fetch favorite stocks
        const res1 = await fetch("http://localhost:5000/auth/favorite-stocks", {
          method: 'GET',
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${data.access_token}`,
          },
        });

        const data1 = await res1.json();
        console.log("Favorite stocks:", data1);

        if (!res1.ok) {
          setError(data.message || "Failed to fetch favorite stocks");
          return;
        }

        // Store favorite stocks in localStorage
        localStorage.setItem("favorite_stocks", JSON.stringify(data1));

        // Redirect
        navigate("/dashboard");
      } else {
        // Sign Up logic
        const res = await fetch("http://localhost:5000/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: fullName, email:email, contact_no: contactNo, password:password }),
        });

        const data = await res.json();
        console.log("Response:", data);

        console.log("Registration success");
        // Show success message and redirect
        setSuccess(`Account created successfully! Verification email sent to ${email}. Redirecting to login...`);
        
        // Clear form
        setFullName("");
        setEmail("");
        setContactNo("");
        setPassword("");

        // Redirect to signin after 3 seconds
        setTimeout(() => {
          navigate("/signin");
        }, 3000);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    }
  };

  // Feature cards data
  const featureCards = [
    {
      title: "AI-Powered Insights",
      description: "Get intelligent stock analysis and predictions using advanced AI models."
    },
    {
      title: "Real-Time Data",
      description: "Access live market data and charts to make informed investment decisions."
    },
    {
      title: "Personalized Watchlist",
      description: "Create and manage your custom watchlist of favorite stocks."
    },
    {
      title: "Secure Authentication",
      description: "Your data is protected with JWT-based secure login and registration."
    }
  ];
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-10">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center justify-center gap-8">
       
        {/* Right Side - Auth Form */}
        <section className="flex items-center">
          <div className="w-full max-w-md lg: h-auto lg:w-auto rounded-[1.75rem] border border-slate-800 bg-slate-950/85 p-6 shadow-2xl shadow-black/50 sm:p-8 overflow-auto flex flex-col items-center justify-center">
            <div className="mb-8 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-50">
                  {isSignIn ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {isSignIn
                    ? 'Enter your credentials to access your dashboard.'
                    : 'Start your journey to smarter, AI-assisted investing.'}
                </p>
              </div>
            </div>

            <div className="mb-6 inline-flex rounded-full bg-slate-900/80 p-1 text-sm">
              <Link
                to="/signin"
                className={`${
                  isSignIn ? 'bg-cyan-500 text-slate-950 shadow-glow-cyan' : 'text-slate-300'
                } inline-flex flex-1 items-center justify-center rounded-full px-4 py-1.5 transition`}
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className={`${
                  !isSignIn ? 'bg-cyan-500 text-slate-950 shadow-glow-cyan' : 'text-slate-300'
                } inline-flex flex-1 items-center justify-center rounded-full px-4 py-1.5 transition`}
              >
                Sign Up
              </Link>
            </div>

            <form
              className="space-y-4"
              onSubmit={handleSubmit}
            >
              {error && (
                <div className="text-red-400 text-sm text-center bg-red-400/10 border border-red-400/30 rounded-lg p-3">
                  {error}
                </div>
              )}
              {success && (
                <div className="text-green-400 text-sm text-center bg-green-400/10 border border-green-400/30 rounded-lg p-3">
                  {success}
                </div>
              )}
              {!isSignIn && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300" htmlFor="fullName">
                    User name
                  </label>
                  <div className="flex items-center rounded-xl border border-slate-700/80 bg-slate-900/80 px-3">
                    <span className="mr-2 text-slate-500">👤</span>
                    <input  id="username"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="h-10 w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              
 
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300" htmlFor="email">
                  Email Address
                </label>
                <div className="flex items-center rounded-xl border border-slate-700/80 bg-slate-900/80 px-3">
                  <span className="mr-2 text-slate-500">📧</span>
                                  <input  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                />
                </div>
              </div>

              {!isSignIn && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300" htmlFor="ContactNo">
                    Contact Number
                  </label>
                  <div className="flex items-center rounded-xl border border-slate-700/80 bg-slate-900/80 px-3">
                    <span className="mr-2 text-slate-500">📞</span>
                    <input  id="contact_no"
                      type="text"
                      placeholder="1234567890"
                      value={contactNo}
                      onChange={(e) => setContactNo(e.target.value)}
                      className="h-10 w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-medium text-slate-300">
                  <label htmlFor="password">Password</label>
                  {isSignIn && (
                    <button
                      type="button"
                      className="text-xs font-medium text-cyan-300 hover:text-cyan-200"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>

                <div className="flex items-center rounded-xl border border-slate-700/80 bg-slate-900/80 px-3">
                  <span className="mr-2 text-slate-500">🔒</span>
                  <input  id="password"
  type="password"
  placeholder="••••••••"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  className="h-10 w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
/>
                  <span className="ml-2 cursor-default text-slate-500">👁️</span>
                </div>
              </div>

              <button
                type="submit"
                className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-medium text-slate-950 shadow-glow-cyan transition hover:bg-cyan-400"
              >
                {isSignIn ? 'Sign In' : 'Create Account'} <span className="ml-2 text-base">→</span>
              </button>
            </form>

            <div className="mt-6 flex items-center gap-3 text-xs text-slate-500">
              <span className="h-px flex-1 bg-slate-800" />
              <span className="tracking-[0.2em]">OR CONTINUE WITH</span>
              <span className="h-px flex-1 bg-slate-800" />
            </div>

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/80 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-600 hover:bg-slate-900"
              >
                <span className="text-lg">G</span>
                <span>Google</span>
              </button>
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/80 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-600 hover:bg-slate-900"
              >
                <span className="text-lg">GH</span>
                <span>GitHub</span>
              </button>
            </div>

            <p className="mt-6 text-[11px] leading-relaxed text-slate-500">
              By continuing, you agree to our{' '}
              <button type="button" className="text-cyan-300 hover:text-cyan-200">
                Terms of Service
              </button>{' '}
              and{' '}
              <button type="button" className="text-cyan-300 hover:text-cyan-200">
                Privacy Policy
              </button>
              .
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
