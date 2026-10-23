// All custom actions, registered in ../library.ts (`actions: [...]`).
import { broadcast } from "./broadcast";
import { copyToClipboard } from "./copy-to-clipboard";
import { notify } from "./notify";

export const customActions = [copyToClipboard, broadcast, notify];
