// Which artifact (if any) is open in the side panel.
import { createContext, useContext } from "react";

export const ArtifactViewerContext = createContext<{ openId: string | null; setOpenId: (id: string | null) => void }>({
  openId: null,
  setOpenId: () => {},
});
export const useArtifactViewer = () => useContext(ArtifactViewerContext);
