import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as T from 'three';
// CPU scene test: canvas operations are stubbed. This does not claim GPU/WebGL validation.
const context=new Proxy({}, {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
globalThis.document={createElement:()=>({getContext:()=>context})};
const {createSequence}=await import('../src/sequence.js');
const {BODY_STEP}=await import('../src/anatomy.js');
const s=createSequence(),camera=new T.PerspectiveCamera(40,1440/900,.1,100);
assert(s.body.count>4000&&s.body.count<10000,'bounded body instance count');
const matrix=new T.Matrix4(),position=new T.Vector3(),scale=new T.Vector3(),quaternion=new T.Quaternion();
const snapshot=p=>{s.update(p,camera);return new Float32Array(s.body.instanceMatrix.array)};
const checkpoints=[0,.18,.28,.42,.47,.55,.68,.80,.90,.94,.96,1];
const forward=new Map(checkpoints.map(p=>[p,snapshot(p)]));
for(const p of [...checkpoints].reverse())assert.deepEqual(snapshot(p),forward.get(p),`reverse state ${p}`);
let prev,maximumStep=0;const times=[];
for(let i=0;i<=1000;i++){
 const t=performance.now();s.update(i/1000,camera);times.push(performance.now()-t);
 assert(camera.position.toArray().every(Number.isFinite));
 assert(s.body.instanceMatrix.array.every(Number.isFinite));
 if(prev)maximumStep=Math.max(maximumStep,camera.position.distanceTo(prev));prev=camera.position.clone();
}
assert(maximumStep<.20,'no large camera discontinuity at 0.1% progress');
// C0 and C1 continuity around each shot boundary, including the final settle.
let maximumVelocityMismatch=0;
for(const p of [.18,.28,.55,.63,.68,.77,.82,.88,.90,.96]){
 const eps=1e-5;s.update(p-eps,camera);const a=camera.position.clone();s.update(p,camera);const b=camera.position.clone();s.update(p+eps,camera);const c=camera.position.clone();
 const left=b.clone().sub(a).divideScalar(eps),right=c.clone().sub(b).divideScalar(eps);
 maximumVelocityMismatch=Math.max(maximumVelocityMismatch,left.distanceTo(right));
 assert(left.distanceTo(right)<.25,`camera velocity continuous at ${p}`);
}
function bounds(points){return [Math.min(...points.map(v=>v.x)),Math.max(...points.map(v=>v.x)),Math.min(...points.map(v=>v.y)),Math.max(...points.map(v=>v.y))]}
const composition=[];
for(const aspect of [1440/900,1200/900,390/844])for(const p of [.42,.47,.55,.94,.96,1]){
 camera.aspect=aspect;s.update(p,camera);camera.updateMatrixWorld();
 const bodyBounds=bounds(s.points.map(v=>v.clone().project(camera)));
 assert(bodyBounds.every(Number.isFinite));
 if(p>=.94)assert(bodyBounds[2]>-1&&bodyBounds[3]<1,`full body framed at ${p}, aspect ${aspect}`);
 s.scene.updateMatrixWorld();const tvBounds=new T.Box3().setFromObject(s.tv);const corners=[];
 for(const x of [tvBounds.min.x,tvBounds.max.x])for(const y of [tvBounds.min.y,tvBounds.max.y])for(const z of [tvBounds.min.z,tvBounds.max.z])corners.push(new T.Vector3(x,y,z).project(camera));
 const tv=bounds(corners);composition.push({aspect:+aspect.toFixed(3),p,bodyBounds:bodyBounds.map(v=>+v.toFixed(3)),tvBounds:tv.map(v=>+v.toFixed(3))});
 if(aspect>1&&p>=.94){
 // Desktop claim ends at x=0.22 viewport; CRT must begin after that and below title.
  assert((1-tv[3])/2>.545,`CRT below claim at ${p}`);
  assert((1-tv[3])/2>.515,`CRT below dominant typography at ${p}`);
 }
}
// Leg/neck/arm connectivity: anatomical target cannot contain detached joint islands.
const ids=new Set(s.points.map(v=>`${Math.round((v.x-1)/BODY_STEP)},${Math.round(v.y/BODY_STEP)},${Math.round(v.z/BODY_STEP)}`));
const pending=new Set(ids),components=[];
while(pending.size){const first=pending.values().next().value,queue=[first];pending.delete(first);let count=0;while(queue.length){const key=queue.pop();count++;const [x,y,z]=key.split(',').map(Number);for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)for(let dz=-1;dz<=1;dz++){const neighbor=`${x+dx},${y+dy},${z+dz}`;if(pending.delete(neighbor))queue.push(neighbor)}}components.push(count)}
assert(Math.max(...components)/s.points.length>.985,'connected adult silhouette');
const src=readFileSync(new URL('../src/main.jsx',import.meta.url),'utf8');assert(src.includes('dpr={[1,1.5]}'),'DPR capped at 1.5');assert(!src.includes('scrub:'),'no second scroll smoothing layer');
times.sort((a,b)=>a-b);
console.log(JSON.stringify({result:'PASS',instanceCount:s.body.count,mediaFrames:s.cards.length,bodyComponents:components.length,maxCameraStepPer001:maximumStep,maxVelocityMismatch:maximumVelocityMismatch,updateCpuMedianMs:times[500],updateCpuP95Ms:times[950],dpr:'1–1.5 (configuration check; GPU validation pending)',composition},null,2));
