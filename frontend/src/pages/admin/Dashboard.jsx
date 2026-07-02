import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LogOut, Lock, User, Shield, AlertCircle, CheckCircle, RefreshCw, FolderKanban } from 'lucide-react';
import PreviousProjectsAdmin from './PreviousProjectsAdmin';

export function Dashboard() {
  const { user, logout, changePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState({ success: '', error: '', loading: false });

  const handleLogout = async () => {
    await logout();
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setPasswordStatus({ success: '', error: 'All fields are required.', loading: false });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordStatus({ success: '', error: 'New password must be at least 8 characters long.', loading: false });
      return;
    }

    setPasswordStatus({ success: '', error: '', loading: true });
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordStatus({
        success: 'Password updated successfully. Other active sessions have been revoked.',
        error: '',
        loading: false
      });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPasswordStatus({
        success: '',
        error: err.message || 'Failed to update password.',
        loading: false
      });
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 p-6 font-sans text-slate-100">
      <div className="absolute left-10 top-10 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />
      <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-cyan-600/10 blur-3xl" />

      <div className="relative mx-auto max-w-6xl space-y-6">
        <header className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-100">Edge Route Vision</h1>
              <p className="text-xs font-light text-slate-400">Secure Admin Panel</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:bg-rose-500 active:scale-[0.98]"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          <section className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl backdrop-blur-xl md:col-span-1">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-700 bg-slate-800">
                  <User className="h-6 w-6 text-slate-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-100">{user?.fullName}</h3>
                  <span className="mt-0.5 inline-block rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                    {user?.roleName}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 border-t border-slate-800 pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="font-light text-slate-400">Email Address:</span>
                  <span className="font-mono text-slate-200">{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-light text-slate-400">Account status:</span>
                  <span className="flex items-center gap-1 font-medium text-emerald-400">
                    <span className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-400" />
                    Active
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 text-[11px] leading-normal text-slate-500">
              Session is actively monitored. Inactivity logs are transmitted back to system security.
            </div>
          </section>

          <div className="grid gap-6 xl:col-span-2 xl:grid-cols-[1.4fr_0.6fr]">
            <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl backdrop-blur-xl">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-100">
                <Lock className="h-5 w-5 text-indigo-400" />
                Change Credentials & Password
              </h2>
              <p className="mt-2 text-xs font-light text-slate-400">
                Changing your password automatically revokes session logins on all other active devices.
              </p>

              <form onSubmit={handlePasswordChange} className="space-y-4 pt-2">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Current Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm placeholder-slate-700 transition-colors focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      New Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm placeholder-slate-700 transition-colors focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                {passwordStatus.error && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
                    <AlertCircle className="h-4 w-4" />
                    {passwordStatus.error}
                  </div>
                )}

                {passwordStatus.success && (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                    <CheckCircle className="h-4 w-4" />
                    {passwordStatus.success}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={passwordStatus.loading}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md transition-all hover:bg-indigo-500 disabled:bg-indigo-800 active:scale-[0.98]"
                >
                  {passwordStatus.loading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Updating credentials...
                    </>
                  ) : (
                    'Change Password'
                  )}
                </button>
              </form>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl backdrop-blur-xl">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-100">
                <FolderKanban className="h-5 w-5 text-cyan-400" />
                Modules
              </h2>
              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-400">
                Previous Projects module is now available below the homepage content and inside the admin panel.
              </div>
            </section>
          </div>
        </div>

        <PreviousProjectsAdmin />
      </div>
    </div>
  );
}

export default Dashboard;
