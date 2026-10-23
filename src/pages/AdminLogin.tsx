import React, { useState } from 'react';
import { db } from '../services/db';

interface AdminLoginProps {
  navigateTo: (page: string, param?: string) => void;
  onLoginSuccess: (user: any) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ navigateTo, onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await db.login(username, password);
      if (response.success) {
        onLoginSuccess(response.user);
        navigateTo('admin-dashboard');
      } else {
        setError('Invalid credentials');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-md mx-auto px-margin-mobile py-20 text-left flex-grow">
      <div className="bg-white rounded-2xl p-8 border border-outline-variant shadow-md">
        <div className="text-center mb-8">
          <span className="material-symbols-outlined text-5xl text-primary mb-2">admin_panel_settings</span>
          <h2 className="font-display text-headline-lg text-primary font-bold">Admin Portal</h2>
          <p className="font-body-md text-on-surface-variant">Sign in to manage the herpetology registry</p>
        </div>

        {error && (
          <div className="bg-error-container text-on-error-container p-4 rounded-xl mb-6 border border-error/20 flex gap-2 items-center">
            <span className="material-symbols-outlined text-error">error</span>
            <span className="font-body-md font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-on-surface font-label-sm uppercase tracking-wider mb-2 font-bold">Username</label>
            <input
              type="text"
              required
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-body-md outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="e.g. admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-on-surface font-label-sm uppercase tracking-wider mb-2 font-bold">Password</label>
            <input
              type="password"
              required
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-body-md outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary font-label-sm py-4 rounded-xl hover:bg-primary/95 transition-colors font-bold flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-xl">sync</span>
                Authenticating...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-outline-variant text-center">
          <p className="text-on-surface-variant text-sm italic">
            *Default credential if users is empty: <strong>admin</strong> / <strong>adminpassword</strong>
          </p>
        </div>
      </div>
    </main>
  );
};
