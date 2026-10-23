// `pnpm prompt` — print the exact system prompt the agent receives, using the
// feature tour as the "current workspace". Read it once: it is the best
// documentation of what OpenUI teaches the model.
import { surfaceContext } from "../server/src/mastra/prompt/surface-context";
import { BASE_SYSTEM_PROMPT } from "../server/src/mastra/prompt/system-prompt";
import { FEATURE_TOUR } from "../client/src/workspace/templates/feature-tour";
import { SURFACE_IDS } from "../shared/src/surfaces";

const surfaces = SURFACE_IDS.map((id) => ({ id, program: FEATURE_TOUR[id], state: {}, errors: [] }));
console.log(BASE_SYSTEM_PROMPT + surfaceContext(surfaces));
