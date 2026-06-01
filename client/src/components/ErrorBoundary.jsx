import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="app-bg flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <h1 className="text-2xl font-bold text-app">Something went wrong</h1>
          <p className="mt-2 text-sm text-muted">An unexpected error occurred. Try reloading the page.</p>
          <button onClick={() => window.location.reload()} className="btn btn-primary mt-6">Reload</button>
          <a href="/" className="mt-3 text-sm text-muted hover:text-app">← Back to home</a>
        </div>
      );
    }
    return this.props.children;
  }
}
