"""Developer-only packager. Players need only dist/index.html; no server or npm required."""
from pathlib import Path
root = Path(__file__).resolve().parent
order = ['core', 'geography', 'world-data', 'dialogue-data', 'mission-data', 'story-data', 'population-v13', 'music-score', 'world-state', 'survival-data', 'post-dialogue-data', 'post-mission-data', 'audio', 'ambient-audio', 'visual-quality', 'building-samples-v14', 'tree-placement-v14', 'post-visuals-v14', 'environment-finish-v14', 'landmarks-finish-v14', 'world', 'clock', 'navigation', 'npc', 'missions', 'story', 'event0815', 'hazards', 'post-placement', 'survival', 'post-missions', 'ending', 'post-npc', 'aftermath', 'dialogue', 'camera', 'kazuo-model', 'important-people', 'crowd-model', 'character-injury', 'player', 'game', 'bootstrap', 'navigation-hud', 'input', 'title-screen']
scripts = '<script>\n' + (root / 'src/vendor/three.min.js').read_text() + '\n</script>\n'
import json
data={name:json.loads((root/'data'/(name+'.json')).read_text()) for name in ['world_1945','roads_1945','buildings_1945','landmarks_1945','postblast_damage','fire_zones','smoke_zones','expansion_v11','post_locations_v12','masami_pre_locations','couple_dialogue','npc_expansion_v13','building_samples_v14','environment_finish_v14','landmark_finish_v14']}
scripts += '<script>\nconst HISTORICAL_DATA='+json.dumps(data,ensure_ascii=False).replace('</','<\\/')+';\n' + '\n\n'.join('// ---- ' + name + '.js ----\n' + (root / ('src/' + name + '.js')).read_text() for name in order) + '\n</script>\n'
result = (root / 'src/index.template.html').read_text().replace('<!-- GAME_SCRIPTS -->', scripts)
# Content fingerprints prevent an old Safari asset entry from mixing with this release.
import hashlib
for relative in ['assets/title/dome.webp', 'assets/ending/memorial.webp', 'assets/docs/hiroshima_history_map_design.pdf']:
    fingerprint = hashlib.sha256((root/relative).read_bytes()).hexdigest()[:16]
    result = result.replace(relative, relative+'?v='+fingerprint)
(root / 'dist/index.html').write_text(result)
print('Built standalone HTML:', len(result.encode()), 'bytes')

from shutil import copytree
copytree(root/'assets', root/'dist/assets', dirs_exist_ok=True)
