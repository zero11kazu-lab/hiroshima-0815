# Version 1.0 final fixes

## Memorial text

Adopted verbatim:

「こがぁな、わしみたいな小さいもんが、どんなあやまちをしたいうて、こがぁに辛い思いをせにゃぁいけんのんかのぉ……」

The phrase `どんなあやまちをした` is preserved in hiragana. Display spans break at `こがぁに`, without adding/removing characters from textContent. Existing background, duration, fade timing, BGM and THE_END are unchanged.

## Tram

Root cause: `World.updateVisibility` hid the tram's preBlast-tagged group after the blast, while its wall collider remained. The tram now has an explicit tram tag exempting it from pre-only hiding; normal distance culling still applies. `setDistrictMaterials` switches cached original/charred materials on the same seven tram meshes. A shared 64px broken-glazing texture adds crack/missing-shard detail. No vehicle relocation, tilt, geometry replacement or collider change.

One SMALL fire at (2.1,-55.8), radius .9 / core radius .25, uses the existing instanced fire/smoke renderer and damage sampler. The street bypass at X=4 from Z=-50 to -60 remains open. Accessible contact at (2.7,-55.8) reports contact 1/3 and heat about 35.23; existing survival rules handle the exposure. Original fire/smoke damage constants are unchanged.

## Mission 2 man

Root cause: the appearance selector reclassified the same NPC into the generic fallen pool on DEAD, potentially selecting CHARRED. The exact mission NPC ID plus male role now caches `mission2ManAppearanceVariant` from the living palette once. Later state changes and retries reuse it. New-game reset clears the cache. Same NPC instance, same colors and clothing parts; only the death pose changes. No placement or story change.

## Verification

- `tests/version1-fixes.cjs`: pre/post/reset tram visibility, same geometry/material restoration, unchanged collider, open bypass, reachable mission legs, accessible local fire contact, identical male instance/variant/part colors across death and retry, changed death pose. Screenshot inspected with animated fire visible.
- `tests/ending-memorial.cjs` against the current build: exact text, fade samples, audio bus reuse, tap resistance, four viewport sizes, THE_END and reset cleanup pass.
- Existing ending11 test against current build: full reunion through twelve ending states, farewell lines, death timing, breathing/grief and THE_END pass.
- Existing mission story test against current build, with added male identity/variant assertions: rescue/death/report, water/death/confirmation, retries and Masami enquiry gates pass.
- Existing default-mission-layout checks against current build: 12 RESETs, randomized layouts, every required route, original fire/wall retention, retry persistence pass with the tram fire present.
- Appearance regression test, build, changed JavaScript syntax and whitespace checks pass.

Browser coverage is Chromium/mobile viewport, not physical iPhone Safari. Device FPS and perceived audio/visual quality remain unverified.
