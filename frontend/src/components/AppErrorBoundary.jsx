import React from 'react';

export default class AppErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('Unhandled application render error:', error);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
        <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl">
          <h1 className="text-xl font-bold">Something went wrong</h1>
          <p className="mt-2 text-sm text-slate-400">This page could not be rendered. Reload to try again.</p>
          <button type="button" onClick={this.handleReload} className="mt-6 cursor-pointer rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950">
            Reload page
          </button>
        </section>
      </main>
    );
  }
}