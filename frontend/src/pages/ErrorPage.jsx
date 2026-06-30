import React from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertOctagon, ShieldAlert, FileQuestion, ServerCrash, ArrowLeft, RefreshCw } from 'lucide-react';

export function ErrorPage({ code: propCode, message: propMessage, requestId: propRequestId }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Determine error info from props, route state, or query params
  const code = parseInt(propCode || location.state?.code || searchParams.get('code') || '404', 10);
  const message = propMessage || location.state?.message || searchParams.get('message');
  const requestId = propRequestId || location.state?.requestId || searchParams.get('requestId');

  const errorDetails = {
    401: {
      title: 'Session Expired',
      desc: message || 'Your session has ended or is invalid. Please log in again to access this area.',
      icon: ShieldAlert,
      color: 'from-amber-500 to-orange-600',
      action: () => navigate('/login'),
      btnText: 'Go to Login',
    },
    403: {
      title: 'Access Forbidden',
      desc: message || 'You do not have permission to view or modify this resource. If you believe this is an error, contact your system administrator.',
      icon: ShieldAlert,
      color: 'from-red-500 to-rose-600',
      action: () => navigate('/admin'),
      btnText: 'Return to Safety',
    },
    404: {
      title: 'Resource Not Found',
      desc: message || "The page or resource you are looking for does not exist or has been relocated.",
      icon: FileQuestion,
      color: 'from-blue-500 to-indigo-600',
      action: () => navigate(-1),
      btnText: 'Go Back',
    },
    500: {
      title: 'Internal Server Error',
      desc: message || 'Something went wrong on our server. We have logged the error and are investigating. Please try again shortly.',
      icon: ServerCrash,
      color: 'from-purple-500 to-violet-600',
      action: () => window.location.reload(),
      btnText: 'Refresh Page',
    },
  };

  const currentErr = errorDetails[code] || errorDetails[404];
  const IconComponent = currentErr.icon;

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 font-sans px-4 overflow-hidden">
      {/* Visual background enhancements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl animate-pulse" />

      <div className="relative w-full max-w-lg bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl text-center">
        {/* Animated Icon Ring */}
        <div className="mx-auto w-24 h-24 relative flex items-center justify-center">
          <motion.div
            className={`absolute inset-0 rounded-full bg-gradient-to-tr ${currentErr.color} opacity-20 blur-lg`}
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          />
          <div className="relative w-20 h-20 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center">
            <IconComponent className="w-10 h-10 text-indigo-400" />
          </div>
        </div>

        <motion.h1 
          className="mt-6 text-4xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {code}
        </motion.h1>
        
        <motion.h2 
          className="mt-2 text-xl font-semibold text-slate-200"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {currentErr.title}
        </motion.h2>

        <motion.p 
          className="mt-4 text-sm text-slate-400 leading-relaxed font-light px-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {currentErr.desc}
        </motion.p>

        {/* Diagnostic details section */}
        {requestId && (
          <motion.div 
            className="mt-6 p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-left text-xs font-mono text-slate-500 space-y-1.5"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <div className="flex justify-between border-b border-slate-900 pb-1.5 mb-1.5">
              <span className="text-slate-400 font-semibold tracking-wide">DIAGNOSTIC SYSTEM</span>
              <span className="text-slate-600">STATE: FAULT</span>
            </div>
            <div className="flex">
              <span className="w-24 text-slate-400">Request ID:</span>
              <span className="text-slate-300 select-all break-all">{requestId}</span>
            </div>
            <div className="flex">
              <span className="w-24 text-slate-400">Timestamp:</span>
              <span className="text-slate-300">{new Date().toISOString()}</span>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-850 bg-slate-950/40 text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-all font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Home Page
          </button>
          
          <button
            onClick={currentErr.action}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all font-medium text-sm"
          >
            {code === 500 ? <RefreshCw className="w-4 h-4" /> : null}
            {currentErr.btnText}
          </button>
        </div>
      </div>
    </div>
  );
}
