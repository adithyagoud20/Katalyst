"use client";

import React, { Component, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export interface SimulatorErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
  className?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class SimulatorErrorBoundary extends Component<SimulatorErrorBoundaryProps, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("[SimulatorErrorBoundary] Caught simulator error:", error, errorInfo);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          aria-live="polite"
          className={`simulator-error-fallback rounded-xl border border-red-500/30 bg-red-950/20 p-5 text-[var(--text-primary)] shadow-sm ${this.props.className ?? ""}`}
        >
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-red-500/10 p-2 text-red-400">
              <AlertTriangle size={20} />
            </div>
            <div className="flex-1 space-y-1.5">
              <h4 className="text-sm font-semibold text-red-300">
                {this.props.fallbackTitle ?? "Simulator encountered an unexpected error"}
              </h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                The simulator ran into an issue while rendering or updating internal state.
                The surrounding lesson content remains intact.
              </p>
              {this.state.error?.message && (
                <div className="mt-2 rounded bg-black/40 px-3 py-1.5 font-mono text-[11px] text-red-200/80">
                  {this.state.error.message}
                </div>
              )}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="inline-flex items-center gap-1.5 rounded-md bg-[var(--surface-secondary)] border border-[var(--border-subtle)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-primary)] hover:border-blue-500/50 transition-colors"
                >
                  <RotateCcw size={13} />
                  <span>Reset Simulator</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
