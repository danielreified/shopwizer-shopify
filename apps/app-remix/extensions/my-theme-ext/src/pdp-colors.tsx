/** @jsxImportSource preact */
import { createRailLoader, createRailComponent } from "./components/rail";

/* ---- create loader from generic engine ---- */
const loadColors = createRailLoader("/apps/sw/recs", "color");

/* ---- mount the rail ---- */
export const ColorsWidget = createRailComponent("colors", loadColors);
