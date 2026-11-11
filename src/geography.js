// Coarse historical staging, NOT a surveyed GIS conversion. Metric ground-zero distance is kept separately.
const FIELD_EXPANSION=HISTORICAL_DATA.expansion_v11;
const GEO1945={...HISTORICAL_DATA.world_1945,bounds:FIELD_EXPANSION.bounds,rivers:[...HISTORICAL_DATA.world_1945.rivers,...FIELD_EXPANSION.riverPatches]};
function historicalOffset(p){const o=GEO1945.hypocenter,s=GEO1945.coordinateSystem.geographicCompression;return {east:(p.x-o.x)*s,south:(p.z-o.z)*s};}
function historicalDistance(p){const q=historicalOffset(p);return Math.hypot(q.east,q.south);}
function polygonContains(x,z,points){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
function waterAt(x,z){return GEO1945.rivers.some(r=>polygonContains(x,z,r.polygon));}
function onBridge(x,z){return GEO1945.bridges.some(b=>Math.abs(x-b.x)<=b.w/2&&Math.abs(z-b.z)<b.d/2-.35);}
function geographicWalkable(x,z){return !waterAt(x,z)||onBridge(x,z);}
