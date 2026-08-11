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

## Implemented (2026-06 session, continued)
Rule-engine + structure additions (App.js, verified via node logic tests):
- `requires.unitId` now accepts an array (combined total of listed ids) for both fixed and ratio modes.
- Army-level `pointsPercentageValidation` (combined unit points vs % of maxPoints, any expression).
- `unitCountValidation` now supports a fixed `count` comparison (falls back to compareWith/ratio when absent).
- Allied `disables` fixed to work across categories via per-category selection state (`checkedAllies` now stores "categoryId::armyKey" composites); handles the pecheneg/magyar cross-category self-disable pattern in real data.
- Unit `excludes` field — mutual exclusion: blocks excluded ids in catalog (and reverse), per-unit warning when both present.
- `armyValidation` left side now accepts `ids` array (combined bases) in addition to single `id`/`unitId`.
- Save/Load Army: JSON download (prompt for name) + import restoring supplement (async loadData restore path), army, roster, allies, maxPoints. Save/Load/Export PDF buttons in left header box.
- Unit `subProfiles` array: each has name + A/C/D/Coh stats (flexible key spellings) + baseEquipment + specialRules; renders as distinct rows in the unit box + PDF (replaces the main stat row). `optionalEquipment.targetProfile` routes an option's stat/rule/equipment changes to the matching sub-profile row while its points still count to the unit total; untargeted options apply to all profiles.
- Header layout overhaul: left stack (Save/Load/Export box + dropdowns) and right Roster Summary box are equal-height (items-stretch); MAX POINTS LIMIT and TOTAL/LIMIT centered over their content; fixed header height; solid column heading boxes flush to top.

## Implemented (2026-06 session, sub-profile layout)
- Sub-profile rows now share an identical fixed-width column grid with the main unit header: `[PTS/BASE] [PTS/OPTIONS] [TOTAL] [D or A] [C] [PTS/UNIT]` (68px columns, right-anchored so columns vertically align). `Stat` gained a `w` prop for the fixed width.
- Per-sub-profile points: each row shows its own PTS/BASE (`sp.pointsPerBase`, else falls back to the unit's pts/base), PTS/OPTIONS (sum of options applying to that profile), TOTAL (base+options per base), and PTS/UNIT (total × bases) — per user's confirmed choices.
- Main header keeps D/C blank for sub-profile units and shows cumulative points. When sub-profiles carry their OWN `pointsPerBase` (stacked components, e.g. elephant+mahout+crew) the unit's cumulative pts/base = SUM of profile pts/base; otherwise (alternative stat-lines falling back to unit pts) it stays the unit-level figure. `computeUnit` now returns `ppbBase/ppbOptions/ppbTotal` and `total` derives from `ppbTotal`.
- Schema tolerance: `readSubProfile` reads stats from a nested `stats: {}` object (remote schema) as well as flat keys; new `readOption` normalizes optional-equipment so both flat (`pointsModifier`, `defenceModifier`) and nested (`pointsPerBase`, `statChanges: {defence}`) schemas work. Applied via `makeInstance`.
- PrintSummary/PDF updated to use cumulative points and list per-profile PTS/BASE/OPTIONS/TOTAL/Points.
- Verified end-to-end on live remote data: Genghis Khan → Early Thematic Byzantine → "War ElephantX" (Elephant 20 / Mahout 5 / Crew 2 → header 27; toggling Howdah → Crew updates Pts/Options 4, D 5→3, header total 31). Column alignment exact.

## Implemented (2026-06 session, applyToAllUnits)
- New `optionalEquipment.applyToAllUnits` flag. When an option with this flag is toggled on/off on any unit, `toggleEquipment` forces the same equipped state across every roster instance of the same `unitId` that offers the option — points and stat changes update roster-wide simultaneously (bidirectional: select syncs on, deselect syncs off). Per-unit disables / hidden-pruning / skirmisher clamps still applied to each affected instance. Preserved through `readOption` (spread). Demo flag added to Welsh "Teulu Foot → Throwing Spears" in MOCK_DATA.
- Verified via UI automation: two Teulu Foot units → enabling on one checks both (90→102 pts), disabling on the other unchecks both (→90 pts).

## Backlog / Future
- P1: If remote JSON gets fixed, verify live-data path renders correctly.
- P2: Save/load rosters to localStorage.
- P2: Search/filter within catalog.
- Note: advanced rules verified via node logic tests; demo entries seeded in MOCK_DATA (Welsh, incl. Teulu Foot subProfiles) since remote data is the primary source. Sub-profile UI/PDF rendering not yet visually verified (demo only reachable via fallback data).
