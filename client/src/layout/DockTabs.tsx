// The bottom area hosts three things side by side as tabs: the agent-owned
// dock surface, the isolated A2UI incident panel and the observability log.
import { useState } from "react";
import { IncidentPanel } from "../a2ui/IncidentPanel";
import { EventLog } from "../debug/EventLog";
import { SurfaceView } from "../surfaces/SurfaceView";
import { PanelBoundary } from "./PanelBoundary";

const TABS = ["Dock surface", "A2UI live incident", "Event log"] as const;

export function DockTabs({ workspaceId }: { workspaceId: string }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>(TABS[0]);
  return (
    <div className="dock-tabs">
      <div className="ou-tabs__bar" role="tablist">
        {TABS.map((t) => (
          <button key={t} role="tab" className="ou-tabs__tab" aria-selected={t === tab} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>
      {/* Hidden instead of unmounted: the dock keeps its state and queries. */}
      <div hidden={tab !== TABS[0]}>
        <SurfaceView key={workspaceId} id="dock" />
      </div>
      {tab === TABS[1] ? (
        <PanelBoundary name="A2UI panel">
          <IncidentPanel />
        </PanelBoundary>
      ) : null}
      <div hidden={tab !== TABS[2]}>
        <EventLog />
      </div>
    </div>
  );
}
