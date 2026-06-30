import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod'; // We need this resolver or a quick manual check.
import * as z from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, ShieldAlert } from 'lucide-react';

// Form validation schema with Zod
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().default(false),
});

export function Login() {
  const { login, idleMessage } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [requestId, setRequestId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if there was an idle timeout redirect
  const isIdleRedirect = searchParams.get('reason') === 'idle' || !!idleMessage;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setServerError('');
    setRequestId('');
    
    try {
      await login(data.email, data.password, data.rememberMe);
      navigate('/admin');
    } catch (err) {
      console.error('Login submission error:', err);
      // Grab detailed message from custom error mapping
      setServerError(err.message || 'An error occurred during login. Please try again.');
      if (err.requestId) {
        setRequestId(err.requestId);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 font-sans px-4 overflow-hidden">
      {/* Dynamic glow design */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-3xl" />

      <motion.div
        className="relative w-full max-w-md bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 via-indigo-200 to-slate-400 bg-clip-text text-transparent">
            Edge Route Vision
          </h2>
          <p className="mt-2 text-sm text-slate-400 font-light">
            Administrator Portal Access
          </p>
        </div>

        {/* Notices */}
        {isIdleRedirect && (
          <motion.div 
            className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-3"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
          >
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Session Expired</p>
              <p className="opacity-90">{idleMessage || 'You have been logged out due to inactivity.'}</p>
            </div>
          </motion.div>
        )}

        {serverError && (
          <motion.div 
            className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex flex-col gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Authentication Failed</p>
                <p className="opacity-90">{serverError}</p>
              </div>
            </div>
            {requestId && (
              <span className="mt-2 text-[10px] font-mono text-slate-500 border-t border-slate-800 pt-1.5 self-end">
                Ref: {requestId}
              </span>
            )}
          </motion.div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-5 h-5" />
              </span>
              <input
                type="email"
                placeholder="admin@ervision.com"
                className={`w-full pl-10 pr-4 py-3 bg-slate-950/80 border rounded-xl text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all ${
                  errors.email ? 'border-red-500' : 'border-slate-800'
                }`}
                {...register('email')}
                disabled={isSubmitting}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-400">{errors.email.message}</p>
            )}
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className={`w-full pl-10 pr-10 py-3 bg-slate-950/80 border rounded-xl text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all ${
                  errors.password ? 'border-red-500' : 'border-slate-800'
                }`}
                {...register('password')}
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-400">{errors.password.message}</p>
            )}
          </div>

          {/* Remember Me Toggle */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-slate-850 bg-slate-950 text-indigo-600 focus:ring-0 focus:ring-offset-0 focus:outline-none cursor-pointer"
                {...register('rememberMe')}
                disabled={isSubmitting}
              />
              <span className="text-xs text-slate-400 hover:text-slate-300 transition-colors">
                Remember my session on this device
              </span>
            </label>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-[0.99] disabled:pointer-events-none cursor-pointer"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Authenticating...
              </>
            ) : (
              'Log In'
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-8 text-center text-xs text-slate-600">
          <p>© {new Date().getFullYear()} Edge Route Vision. All rights reserved.</p>
          <p className="mt-1 font-light">Secure Administrator Terminal</p>
        </div>
      </motion.div>
    </div>
  );
}
export default Login;
