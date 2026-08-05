# Swordpoint Army Builder — PRD

## Problem Statement
Single-page React web app for building Swordpoint: Dark Age wargaming army rosters. Fully client-side — NO backend DB, NO server logic, NO auth (explicit credit-saving constraint).

## Architecture
- 100% client-side React (App.js single core file + App.css).
- Data source: client-side fetch from GitHub raw JSON (dark_ages_armies.json). Graceful fallback to embedded MOCK_DATA if fetch fails or JSON is invalid (the live remote file is currently malformed JSON, so app runs on sample data).
- PDF export via native window.print() with a print-only clean summary stylesheet.

## Core Requirements (static)
- Army dropdown selector (populated by armyName). Switching army fully clears roster + allies + resets calcs.
- Two-column dark dashboard: Left = catalog by category; Right = active roster with sticky Total/Max header.
- Adjustable MaxPointsLimit (default 2000).
- Unit base +/- with strict min/max clamping via disabled buttons.
- Skirmisher rule override: hard-clamp maxBases to 6; auto-drop bases to 6 when triggered via equipment.
- Optional equipment toggles updating pts/base, Defence, Cohesion, and active Special Rules.
- Allied contingents: inline checkboxes per alliedArmyKeys; checking shows non-General allied units; unchecking purges those instances; disable extra checkboxes past maxAlliedArmiesAllowed.
- Roster utilities: Duplicate, Move Up/Down, Remove.
- Validation engine: over-points, >1 General, allied-max, skirmisher base guard, count + percentage category constraints (percentage relative to MaxPointsLimit). Emerald (valid) / Amber (warnings) status badge.
- Client-side PDF export.

## Implemented (2026-07-30)
- All core requirements above built and verified via browser screenshots.
- Verified: add units, live points, equipment toggle stats/rules, General>1 warning, allies checkbox + disabled second faction, allied non-General unit rendering, allied points counting toward allies category, status badge emerald/amber.
- 3 sample factions in fallback data: Early Medieval Welsh, Vikings, Anglo-Danish (cross-referenced as allies).

## Implemented (2026-06 session)
Advanced rule engine + UI polish (all in App.js, verified via logic unit tests):
- `maxEquipmentCount` for optionalEquipment (shared cap across units of a type).
- `enabledWhenUnitsPresent` (fixed threshold + ratio/perUnit modes) — locks equipment based on referenced unit counts.
- Category `constraintType: "pointsRatio"` — max units = round(maxPoints/pointsThreshold × countPerThreshold), min 1; also hard-blocks the +Add button when the category is full.
- `requires` rule `self` field — army-wide min-count warning for a unit's own id.
- Army-level `unitCountValidation` array (`ids` vs `compareWith`, optional `ratio`, default expr lessThanOrEqual) — count-based warnings.
- Allied `disables` field — selecting an ally disables listed armies across all categories (reversible).
- `armyValidation` bugfix: now reads `id` OR `unitId` (real JSON uses `id`) so bases-ratio rules fire.
- UI: dropdowns moved to header-left; emerald Roster Summary box moved into header-right (fixed w-[520px]); header z-50 + solid bg; column headings restyled (rounded border, transparent outer wrapper, solid inner box, page-bg); scrollbar-gutter + pr-3 on both columns; pronounced catalog hover (emerald border/glow, no shift, no bg change); unit-name font Barlow; category/Army-Composition headings 1.25rem; constraints table header 0.9rem Barlow; brighter unit description (slate-300).
- Both Supplement + Army dropdowns converted to Radix shadcn Select with max-h-[66vh] scrollable menu.

## Backlog / Future
- P1: If remote JSON gets fixed, verify live-data path renders correctly.
- P2: Save/load rosters to localStorage.
- P2: Search/filter within catalog.
- Note: advanced rules verified via node logic tests; demo entries seeded in MOCK_DATA (Welsh) since remote data is the primary source.
