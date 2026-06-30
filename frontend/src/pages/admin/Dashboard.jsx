import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { motion } from 'framer-motion';
import { LogOut, Lock, User, Shield, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

export function Dashboard() {
  const { user, logout, changePassword } = useAuth();
  
  // Password change state
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
    <div className="relative min-h-screen bg-slate-950 text-slate-100 font-sans p-6 overflow-hidden">
      {/* Glow shapes */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl" />

      <div className="relative max-w-5xl mx-auto space-y-6">
        {/* Navigation / Header */}
        <header className="flex justify-between items-center bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-100">Edge Route Vision</h1>
              <p className="text-xs text-slate-400 font-light">Secure Admin Panel</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 active:scale-[0.98] transition-all rounded-xl text-sm font-semibold text-white shadow-md cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </header>

        {/* User Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <section className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl shadow-xl md:col-span-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <User className="w-6 h-6 text-slate-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-100">{user?.fullName}</h3>
                  <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
                    {user?.roleName}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 pt-4 border-t border-slate-800 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-light">Email Address:</span>
                  <span className="text-slate-200 font-mono">{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-light">Account status:</span>
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Active
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-[11px] text-slate-500 leading-normal">
              Session is actively monitored. Inactivity logs are transmitted back to system security.
            </div>
          </section>

          {/* Change Password Card */}
          <section className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl shadow-xl md:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-400" />
              Change Credentials & Password
            </h2>
            <p className="text-xs text-slate-400 font-light">
              Changing your password automatically revokes session logins on all other active devices.
            </p>

            <form onSubmit={handlePasswordChange} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Current Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm placeholder-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    New Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm placeholder-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {passwordStatus.error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {passwordStatus.error}
                </div>
              )}

              {passwordStatus.success && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {passwordStatus.success}
                </div>
              )}

              <button
                type="submit"
                disabled={passwordStatus.loading}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white rounded-xl text-xs font-semibold shadow-md transition-all active:scale-[0.98] cursor-pointer"
              >
                {passwordStatus.loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Updating credentials...
                  </>
                ) : (
                  'Change Password'
                )}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
export default Dashboard;
