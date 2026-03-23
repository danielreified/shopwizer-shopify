/** @jsxImportSource preact */
import { createRailLoader, createRailComponent } from "./components/rail";

/* ---- create loader from generic engine ---- */
const loadSimilar = createRailLoader("/apps/sw/recs", "similar");

/* ---- mount the rail ---- */
export const SimilarWidget = createRailComponent("similar", loadSimilar);
