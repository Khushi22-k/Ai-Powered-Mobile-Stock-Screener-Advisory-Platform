import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register, saveTokens } from '../utils/auth';

export default function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await register(username, email, contactNo, password);
      if (response.access_token) {
        navigate('/login');
      } else {
        setError(response.msg || 'Signup failed');
      }
     } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-10">
      <div className="w-full max-w-md rounded-[1.75rem] border border-slate-800 bg-slate-950/85 p-6 shadow-2xl shadow-black/50 sm:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-50">Signup</h1>
          <p className="mt-1 text-sm text-slate-400">Create your account to get started.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300" htmlFor="username">
                Username
              </label>
              <div className="flex items-center rounded-xl border border-slate-700/80 bg-slate-900/80 px-3">
                <span className="mr-2 text-slate-500">👤</span>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="h-10 w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300" htmlFor="email">
                Email
              </label>
              <div className="flex items-center rounded-xl border border-slate-700/80 bg-slate-900/80 px-3">
                <span className="mr-2 text-slate-500">📧</span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="h-10 w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300" htmlFor="contact_no">
                Contact No
              </label>
              <div className="flex items-center rounded-xl border border-slate-700/80 bg-slate-900/80 px-3">
                <span className="mr-2 text-slate-500">📞</span>
                <input
                  id="contact_no"
                  type="tel"
                  value={contactNo}
                  onChange={(e) => setContactNo(e.target.value)}
                  placeholder="Contact Number"
                  className="h-10 w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300" htmlFor="password">
                Password
              </label>
              <div className="flex items-center rounded-xl border border-slate-700/80 bg-slate-900/80 px-3">
                <span className="mr-2 text-slate-500">🔒</span>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="h-10 w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-400">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-medium text-slate-950 shadow-glow-cyan transition hover:bg-cyan-400 disabled:opacity-50"
          >
            {loading ? 'Signing up...' : 'Signup'} <span className="ml-2 text-base">→</span>
          </button>
        </form>
      </div>
    </div>
  );
}
