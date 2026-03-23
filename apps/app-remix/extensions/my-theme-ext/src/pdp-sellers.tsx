/** @jsxImportSource preact */
import { createRailLoader, createRailComponent } from "./components/rail";

/* ---- create loader from generic engine ---- */
const loadSellers = createRailLoader("/apps/sw/recs", "sellers");

/* ---- mount the rail ---- */
export const SellersWidget = createRailComponent("sellers", loadSellers);
