# Bundle Recommendations: Current vs Proposed

Status: Draft for iteration

This document compares the **current bundle system** with a **proposed first‑principles approach**. It is intended to be edited line‑by‑line until we are happy with the logic, then used as the approval baseline before any code changes.

## How to use this doc

1. Review the **Current Approach** to confirm accuracy.
1. Fill in or revise the **Proposed Approach** until it feels coherent end‑to‑end.
1. Use the **Decision Table** to approve each change explicitly.

## Definitions

1. **Control bundle**: A bundle generated from ProductGraph co‑purchase edges.
1. **Explore bundle**: A bundle generated from category embeddings and discovery scoring.
1. **ProductGraph**: Product‑to‑product co‑purchase or performance edges used for bundles.
1. **CategoryGraph**: Category‑to‑category co‑purchase affinity used as a scoring boost.
1. **Bundle**: A `ComputedBundle` row with 3 candidate product IDs and a selection weight.

---

## Current Approach (as implemented)

Source files:

1. `apps/service-jobs-worker/src/handlers/bundles.generator.ts`
1. `apps/service-jobs-worker/src/handlers/graph.weights.ts`
1. `apps/service-analytics/src/handlers/graph.weights.daily.ts`
1. `apps/service-analytics/src/handlers/bundle.metrics.hourly.sqs.ts`

### A. Graph Construction

1. `GRAPH_WEIGHTS_DAILY` exists in two services.
1. Jobs‑worker version builds ProductGraph and CategoryGraph from order co‑purchase data.
1. Analytics version decays ProductGraph weights, updates ProductGraph from bundle CTR, and updates CategoryGraph from order co‑purchases.

### B. Candidate Generation

1. **Control candidates** come from ProductGraph edges for the source product.
1. **Explore candidates** come from category embeddings `POST /similar` using the product’s category.
1. **Fallback candidates** come from vendor best‑sellers when discovery is thin.

### C. Filtering and Guardrails

1. Same root category only.
1. In‑stock only.
1. Price guardrails (min/max multipliers).
1. Title de‑duplication removes cosmetic variants.
1. Usage penalty reduces over‑used items.

### D. Scoring and Selection

1. Control bundles use top ProductGraph edges by weight.
1. Explore bundles use a composite score.
1. Composite includes price similarity, category graph boost, embeddings similarity, density bonus, usage penalty, and jitter.
1. Diversification tries to avoid all items from the same leaf category.

### E. Output and Lifecycle

1. Creates up to two variants: `control` and `explore`.
1. Weights are normalized to sum to 1.0.
1. Old ACTIVE bundles are archived per batch before new inserts.
1. Archived bundles are deleted after a retention window.

---

## Proposed Approach (first‑principles)

This section is intentionally **incomplete** until we align on the logic.

### A. Objective

1. Primary metric: `TBD` (attach rate, CTR, revenue per session).
1. Secondary metric: `TBD`.

### B. Hard Constraints

1. `TBD` (same root, in‑stock, price guardrails, etc.).

### C. Signals and Evidence

1. `TBD` (ProductGraph, CategoryGraph, embeddings, best‑seller, etc.).

### D. Candidate Generation

1. `TBD` (single pool vs segmented sources).

### E. Scoring and Selection

1. `TBD` (single unified score vs multi‑variant).

### F. Exploration and Learning

1. `TBD` (implicit exploration, re‑generation cadence, performance‑based promotion).

### G. Output and Lifecycle

1. `TBD` (one bundle vs multiple versions, archiving policy).

---

## Decision Table (current vs proposed)

| Area                 | Current                          | Proposed | Decision | Notes |
| -------------------- | -------------------------------- | -------- | -------- | ----- |
| Objective            | Implicit CTR + revenue           | `TBD`    | `TBD`    |       |
| Bundle variants      | `control` + `explore`            | `TBD`    | `TBD`    |       |
| Candidate pool       | Split by source                  | `TBD`    | `TBD`    |       |
| Scoring              | Different for control vs explore | `TBD`    | `TBD`    |       |
| CategoryGraph role   | Boost in explore scoring         | `TBD`    | `TBD`    |       |
| ProductGraph role    | Control bundle only              | `TBD`    | `TBD`    |       |
| Exploration          | Explicit via variant             | `TBD`    | `TBD`    |       |
| Feedback loop        | CTR updates ProductGraph         | `TBD`    | `TBD`    |       |
| Regeneration cadence | Daily                            | `TBD`    | `TBD`    |       |
| Safety constraints   | Root, stock, price               | `TBD`    | `TBD`    |       |

---

## Open Questions

1. What single metric defines success at launch?
1. Should we output one bundle or multiple bundles per product?
1. How much exploration is acceptable on day one?
1. Should CategoryGraph be a hard filter or a soft boost?
1. How strong should the price guardrails be?
