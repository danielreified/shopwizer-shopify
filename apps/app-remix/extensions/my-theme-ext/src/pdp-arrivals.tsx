/** @jsxImportSource preact */
import { createRailLoader, createRailComponent } from "./components/rail";

/* ---- create loader from generic engine ---- */
const loadArrivals = createRailLoader("/apps/sw/recs", "arrivals");

/* ---- mount the rail ---- */
export const ArrivalsWidget = createRailComponent("arrivals", loadArrivals);
