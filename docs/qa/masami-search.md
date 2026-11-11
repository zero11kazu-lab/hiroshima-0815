# Randomized Masami search — verification

- Twelve authored locations in `MASAMI_SEARCH_CANDIDATES`; no coordinate sampling.
- World-generation filter: walkability, local heat <=22 / smoke <=.08, actor clearance, reachable path, blocked direct approach, distance >=49 from mission-2 actor, route length 95–145.
- Random selection among candidates at least 80% as far as the farthest valid candidate. Exclude the previous stored site where alternatives exist; storage denial is tolerated.
- Place the existing hidden Masami once at generation. Mission completion reveals her and reuses the existing final-area fires and ruin cover, retaining a safe approach. No relocation on discovery or retry.
- Search activation independently checks current player distance >=45. Normal mission completion is within conversation range of the male NPC, so the four-unit margin preserves this requirement.
- Eight-way bearing uses `WORLD_NORTH`; seeded phrasing stays stable at the same NPC position/range. Near hints mention a standing building only when a surviving building is nearby, or the existing generated ruin cover. No coordinates, distances, names or marker are displayed for Masami.

## Automated checks

`node tests/masami-search.cjs`: 12 independent browser restarts selected eight sites without consecutive repetition. Every run audited all twelve candidate paths, checked hidden placement / no teleport, testimony consistency, stable checkpoint data, cover and final fire presence, and reunion through THE_END. No page errors.

`MASAMI_TEST_ALL_CANDIDATES=1 node tests/masami-search.cjs`: forced each of the twelve seeds/candidate slots once; all passed the same checks. Standard completion-position distances: 75.7–91.2 local units; pre-final-area route lengths: 100.2–132.2. Existing cover yielded 1–3 ruin groups per selected site.

`node tests/post-story10r.cjs`: existing mission-1/mission-2 dialogue and mission progression passed, with no search marker or direction arrow.

`node tests/damage-appearance.cjs`: previous NPC appearance ratios, protected characters, material restoration and instanced batch count unchanged.

Build, changed JavaScript syntax checks, and `git diff --check` passed. Browser coverage uses Chromium with a mobile viewport, not iPhone hardware or Safari. Perceived difficulty, visual concealment, and iPhone Safari FPS still require human/device playtesting; path/cover checks are not a substitute for those observations. New path evaluation occurs only during generation and existing search activation, never per frame.
