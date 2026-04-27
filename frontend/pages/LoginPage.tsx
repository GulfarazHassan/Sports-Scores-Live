import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { saveAdminSession } from '../hooks/useAdminSession';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fieldLabel =
    'block text-xs font-bold uppercase tracking-wide text-gray-600 mb-1.5';
  const inputClass =
    'w-full rounded-xl border-2 border-black bg-white px-3 py-2.5 text-sm font-medium shadow-hard-sm focus:outline-none focus:ring-2 focus:ring-brand-dark/20';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError('Please enter both username and password.');
      return;
    }
    if (username === 'admin' && password === 'admin') {
      saveAdminSession(username);
      navigate('/');
      return;
    }
    setError('Invalid username or password.');
  };

  return (
    <div className="max-w-md mx-auto">
      <form
        onSubmit={handleSubmit}
        className="bg-white border-2 border-black rounded-2xl p-6 md:p-8 shadow-hard space-y-6"
        noValidate
      >
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-brand-dark">Welcome back</h2>
          <p className="text-sm text-gray-600">
            Sign in with your Spotrz account.
          </p>
        </div>

        <div>
          <label htmlFor="login-username" className={fieldLabel}>
            Username
          </label>
          <input
            id="login-username"
            name="username"
            type="text"
            autoComplete="username"
            className={inputClass}
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError(null);
            }}
            placeholder="your.name"
          />
        </div>

        <div>
          <label htmlFor="login-password" className={fieldLabel}>
            Password
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            className={inputClass}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border-2 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-900 font-medium"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full px-6 py-2.5 rounded-xl font-bold text-sm border-2 border-black bg-brand-yellow hover:brightness-95 active:translate-y-0.5 transition-all shadow-hard-sm"
        >
          Sign in
        </button>

        <p className="text-center text-sm text-gray-600">
          <Link
            to="/"
            className="font-bold text-black underline underline-offset-2 hover:opacity-80"
          >
            Back to matches
          </Link>
        </p>
      </form>
    </div>
  );
};
