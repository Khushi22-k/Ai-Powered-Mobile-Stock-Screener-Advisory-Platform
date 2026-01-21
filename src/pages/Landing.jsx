import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-10">
      <div className="w-full max-w-md rounded-[1.75rem] border border-slate-800 bg-slate-950/85 p-6 shadow-2xl shadow-black/50 sm:p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-slate-50">Welcome to FinStocks</h1>
          <p className="mt-2 text-sm text-slate-400">Get started by logging in or creating an account.</p>
        </div>

        <div className="space-y-4">
          <Link
            to="/signin"
            className="inline-flex w-full items-center justify-center rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-medium text-slate-950 shadow-glow-cyan transition hover:bg-cyan-400"
          >
            Login <span className="ml-2 text-base">→</span>
          </Link>

          <Link
            to="/signup"
            className="inline-flex w-full items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900/80 px-4 py-2.5 text-sm font-medium text-slate-100 transition hover:border-slate-600 hover:bg-slate-900"
          >
            Sign Up <span className="ml-2 text-base">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
