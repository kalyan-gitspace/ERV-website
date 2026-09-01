import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LogOut, Lock, User, AlertCircle, CheckCircle, RefreshCw, Images, Package, BriefcaseBusiness, Users, Share2, Settings } from 'lucide-react';
import { UserRoundCog } from 'lucide-react';
import EmployeesAdmin from './EmployeesAdmin';
import PreviousProjectsAdmin from './PreviousProjectsAdmin';
import GalleryAdmin from './GalleryAdmin';
import CareersAdmin from './CareersAdmin';
import ClientsAdmin from './ClientsAdmin';
import SocialMediaAdmin from './SocialMediaAdmin';
import ProductsAdmin from './ProductsAdmin';
import { LoadingScreen } from '../../components/LoadingScreen';

export function Dashboard() {
  const { user, logout, changePassword } = useAuth();
  const location = useLocation();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState({ success: '', error: '', loading: false });
  const [activeSection, setActiveSection] = useState(null);
  const [showInitialLoader, setShowInitialLoader] = useState(Boolean(location.state?.showAdminLoader));
  const [pendingSection, setPendingSection] = useState(null);

  const sections = [
    { id: 'gallery', label: 'Gallery', icon: Images, component: GalleryAdmin },
    { id: 'products', label: 'Products', icon: Package, component: ProductsAdmin },
    { id: 'projects', label: 'Previous Projects', icon: BriefcaseBusiness, component: PreviousProjectsAdmin },
    { id: 'careers', label: 'Careers', icon: BriefcaseBusiness, component: CareersAdmin },
    { id: 'clients', label: 'Clients', icon: Users, component: ClientsAdmin },
    { id: 'social', label: 'Social Media', icon: Share2, component: SocialMediaAdmin },
    { id: 'employees', label: 'Employees', icon: UserRoundCog, component: EmployeesAdmin },
    { id: 'settings', label: 'Settings', icon: Settings, component: null },
  ];

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

  const activeConfig = sections.find((section) => section.id === activeSection);
  const ActiveComponent = activeConfig?.component;

  const beginSectionTransition = (sectionId) => {
    if (pendingSection || sectionId === activeSection) return;
    setPendingSection(sectionId);
  };

  const completeSectionTransition = () => {
    setActiveSection(pendingSection);
    setPendingSection(null);
  };

  if (showInitialLoader) {
    return <LoadingScreen mode="admin-initial" onComplete={() => setShowInitialLoader(false)} />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black p-4 font-sans text-slate-100 sm:p-6">
      <div className="absolute left-10 top-10 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />
      <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-cyan-600/10 blur-3xl" />
      <div className="relative mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Edge Route Vision Pvt. Ltd."
              className="h-16 w-16 shrink-0 object-contain"
              draggable="false"
            />
            <div><h1 className="text-xl font-bold tracking-tight text-slate-100">Edge Route Vision</h1><p className="text-xs font-light text-slate-400">Secure Admin Panel</p></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block"><div className="text-sm font-semibold text-slate-100">{user?.fullName}</div><div className="text-xs text-slate-400">{user?.email}</div></div>
            <button type="button" onClick={handleLogout} className="flex cursor-pointer items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:bg-rose-500"><LogOut className="h-4 w-4" />Sign Out</button>
          </div>
        </header>

        {!activeSection ? (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-xl backdrop-blur-xl">
            <div className="mb-5 flex items-center gap-3"><User className="h-5 w-5 text-indigo-400" /><div><h2 className="text-lg font-bold text-slate-100">Admin Dashboard</h2><p className="text-xs text-slate-400">Select a section to manage website content.</p></div></div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {sections.map(({ id, label, icon: Icon }) => (
                <button key={id} type="button" onClick={() => beginSectionTransition(id)} disabled={Boolean(pendingSection)} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/70 p-4 text-left text-sm font-semibold text-slate-200 transition hover:border-indigo-500 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"><Icon className="h-5 w-5 text-cyan-400" />{label}</button>
              ))}
            </div>
          </section>
        ) : (
          <section>
            <button type="button" onClick={() => setActiveSection(null)} className="mb-3 cursor-pointer text-sm font-semibold text-cyan-300 hover:text-cyan-200">&larr; Back to Dashboard</button>
            {activeSection === 'settings' ? (
              <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl backdrop-blur-xl">
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-100"><Lock className="h-5 w-5 text-indigo-400" />Settings</h2>
                <p className="mt-2 text-xs font-light text-slate-400">Changing your password automatically revokes session logins on other active devices.</p>
                <form onSubmit={handlePasswordChange} className="mt-4 max-w-2xl space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Current Password<input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm normal-case outline-none focus:border-indigo-500" /></label>
                    <label className="space-y-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">New Password<input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm normal-case outline-none focus:border-indigo-500" /></label>
                  </div>
                  {passwordStatus.error && <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300"><AlertCircle className="h-4 w-4" />{passwordStatus.error}</div>}
                  {passwordStatus.success && <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300"><CheckCircle className="h-4 w-4" />{passwordStatus.success}</div>}
                  <button type="submit" disabled={passwordStatus.loading} className="flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60">{passwordStatus.loading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}{passwordStatus.loading ? 'Updating credentials...' : 'Change Password'}</button>
                </form>
              </section>
            ) : ActiveComponent ? <ActiveComponent /> : null}
          </section>
        )}
      </div>
      {pendingSection && <LoadingScreen mode="admin-route" onComplete={completeSectionTransition} />}
    </div>
  );
}

export default Dashboard;
