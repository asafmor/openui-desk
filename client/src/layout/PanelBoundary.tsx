// Isolates a panel: if one surface/panel crashes, the rest of the workspace
// (and its autosave) keeps working. OpenUI already keeps the last good render
// per element; this catches anything outside a Renderer.
import { Component, type ReactNode } from "react";

export class PanelBoundary extends Component<{ name: string; children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="surface__query-error" role="alert">
        {this.props.name} crashed: {this.state.error.message}
        <button className="ou-btn ou-btn--secondary" onClick={() => this.setState({ error: null })}>
          Retry
        </button>
      </div>
    );
  }
}
