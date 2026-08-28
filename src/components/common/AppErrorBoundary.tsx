import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";

/**
 * The last line of defence against a white page.
 *
 * React 19 unmounts the whole tree when a render throws, and this app had no
 * boundary anywhere — so ANY render-time exception, in any page, produced a
 * blank white screen with no message, nothing the customer could act on, and
 * nothing anyone could diagnose afterwards. A paying customer hit exactly
 * that after setting his password.
 *
 * A class component by necessity: hooks cannot catch render errors.
 *
 * Deliberately NOT wired to any external reporting service — no new
 * dependency, nothing leaves the browser. The error goes to the console, so
 * the next customer report arrives with something readable in it.
 */
interface Props {
  children: ReactNode;
  /**
   * Changes when the route changes. Used to clear a caught error so the
   * customer is not trapped on this panel for the rest of the session.
   */
  resetKey: string;
}

interface State {
  error: Error | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidUpdate(prev: Props) {
    // Navigating away from the broken screen clears the error. Without this a
    // single bad render would leave the panel up until a full reload, even on
    // pages that work perfectly.
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Both halves matter: the message says what broke, the component stack
    // says where. A screenshot of this is enough to find the fault.
    console.error("[AppErrorBoundary] Render failed:", error);
    console.error("[AppErrorBoundary] Component stack:", info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-[70vh] w-full items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-8 text-center shadow-sm">
          <h1 className="font-display text-xl font-bold text-navy">This page didn&apos;t load</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Something went wrong while displaying this page. Your account, your program and any
            payment you have made are unaffected.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex cursor-pointer items-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-turquoise"
            >
              Reload the page
            </button>
            <Link
              to="/account"
              className="text-sm font-semibold text-primary hover:text-turquoise"
              onClick={() => this.setState({ error: null })}
            >
              My account
            </Link>
            <Link
              to="/contact"
              className="text-sm font-semibold text-primary hover:text-turquoise"
              onClick={() => this.setState({ error: null })}
            >
              Contact us
            </Link>
          </div>
        </div>
      </div>
    );
  }
}
