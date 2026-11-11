# Road intersection Z-fighting

## Cause

`districtGround` generated all eight road rectangles independently at Y=.015. Crossing rectangles therefore overlapped at exactly the same depth with different texture coordinates and, before the blast, sometimes different materials. The baseline screenshot reproduced triangular/striped intersection artifacts. This was shared by pre/post geometry.

The base ground is at Y=-.015; river surfaces at .025; pre-blast shadows at .045 with depthWrite=false; burn marks at .1. They are not coplanar with the road. Only one road-generation loop exists; this is intersecting source rectangles, not two world systems duplicating every road. The camera remains near=.1/far=130. Road materials remain opaque with depthTest/depthWrite enabled.

## Fix

Subtract previously covered rectangles from each subsequent road's render geometry. Earlier roads (the authored tram surfaces first) own intersection pixels. Entirely covered duplicate roads produce no mesh. Partial roads retain one mesh with the same material, position, Y, normals, and original UV origin/scale. No road data, map/collider data, actor height, camera setting, material depth setting, or polygonOffset is changed.

Original summed road area: 4806 local square units. Union area before and after: 4246. The 560 redundant units are no longer drawn. Mesh count remains eight; geometry uses 21 nonoverlapping rectangles instead of eight overlapping rectangles (42 versus 16 triangles, a negligible fixed increase). There are no additional draw calls or per-frame operations.

## Verification

- `node tests/road-surfaces.cjs`: exact footprint coverage at every coordinate-partition cell, exactly one road surface per covered point, original UVs/upward normals, no extra meshes, and synthetic full-duplicate/nested/partial overlap cases all pass.
- `node tests/road-rendering.cjs`: loads the published pre-fix source from commit cb6f9ca as a baseline, then current output. Pre/post at three intersections, three distances and three camera bearings (27 renders per phase/build). Baseline and fixed navigation grid, wall records, fire/smoke records, selected mission layout, HP/HEAT/STAMINA, player Y and camera near/far match exactly.
- Maximum rendered calls remain 361 pre-blast / 365 post-blast in the test scene, equal to baseline. Page error lists are empty.
- Baseline/fixed screenshots inspected: triangular/striped intersection artifacts visible in baseline and absent in the fixed scene.
- Build, changed JavaScript syntax and whitespace checks pass.

Browser verification uses Chromium/SwiftShader with a mobile viewport. Physical iPhone Safari appearance and FPS are unverified. Removing coincident road polygons addresses the precision conflict without relying on browser-specific depth bias.
