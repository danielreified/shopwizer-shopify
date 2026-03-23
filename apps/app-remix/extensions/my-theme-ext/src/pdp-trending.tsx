/** @jsxImportSource preact */
import { createRailLoader, createRailComponent } from "./components/rail";

/* ---- create loader from generic engine ---- */
const loadTrending = createRailLoader("/apps/sw/recs", "trending");

/* ---- mount the rail ---- */
export const TrendingWidget = createRailComponent("trending", loadTrending);
