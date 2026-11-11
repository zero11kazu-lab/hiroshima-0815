# Conditional random mission locations

## Data and invariants

- Six authored mother/child pairs and six authored man/broken-residential-pipe pairs. Existing twelve Masami candidates remain in use.
- One per-play `masamiSeed` selects the pair ordering, Masami site, and testimony wording. RESET starts a new seed. `locationPlan`, seed and selected Masami site are included in mission checkpoint state.
- Mother/child separation 24–42 local units; man/water 65–100; other main events at least 18 apart. Masami remains at least 45 from the player at search activation, with an additional four-unit margin against the mission-2 actor when selected.
- Pair eligibility requires walkability, heat <=30, smoke <=.08, no flame contact, NPC clearance and an interaction margin. Every leg must have a safe existing route. Mother/child route length <=75; man/water route 85–155. Candidate validation caches routes for this one generation pass.
- Pair ordering de-prioritizes the last saved mission-1 and mission-2 sets; Masami excludes the previous eligible site where alternatives exist. Storage errors are tolerated.
- No coordinate perturbation/safe-point relocation is used. No roads, buildings, rubble or existing fires are removed to make a candidate work. World setup uses `hazards.configure(true)` to disable its former minor-fire removal fallback. Existing street-fire generation still preserves validated mission routes; final-search fire/cover behavior is retained.
- Existing NPC records and prop meshes are reused. Child rubble, beam and smoke follow the child; residential broken-pipe meshes, water and sound follow the selected water site. No added NPCs, models, shaders or per-frame path searches.
- Scene cloning replaces only location-dependent guidance. Rescue, deaths, report, water collection, mission order and ending remain unchanged. Child directions describe actual rubble and tilted beams, rather than assuming a particular fixed house. Objective hints and mother/man dialogue use the compass's eight-way bearing helper.

## Validation

`node tests/random-mission-layout.cjs` completed 12 browser reloads from the established pre-blast encounter area. All six M1 sets and all six M2 sets appeared. Every run exercised the conversation UI, child rescue/death/report, two death/retry checkpoints, water collection/death confirmation, Masami questions, reunion, all ending states through THE_END, minimum event spacing and guide-direction agreement. No page errors. Observed IDs in order:

- M1: 0,3,1,5,1,4,2,4,2,0,5,2
- M2: 1,2,0,3,4,5,3,1,3,5,3,4

`node tests/default-mission-layout.cjs` completed a further 12 RESETs from the normal player start. All six sets of each mission appeared across these runs. It checked all five route legs, original fire-template retention, exact fire/wall-data preservation across layout selection, and seed/position persistence through the actual `survival.restart()` path.

`node tests/damage-appearance.cjs` passed: existing appearance ratios, main-character protection, clone/material restoration and five NPC render batches remain unchanged. Build, changed JavaScript syntax checks and whitespace checks passed.

The older Masami-only test has been updated to check the selected eligible site rather than require every unselected site to remain eligible under every mission layout. Its old forced-index environment mode is removed because the eligible pool now depends on both mission sets and the selected water location. The prior version's forced-all-candidates record in `masami-search.md` is historical, not a current test command.

Browser coverage uses Chromium with a mobile viewport. iPhone Safari hardware FPS and human perception of difficulty/concealment remain unverified. No claim of physical iPhone testing is made.
