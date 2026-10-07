import assert from 'node:assert/strict';
import * as T from 'three';
const context=new Proxy({}, {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
globalThis.document={createElement:()=>({getContext:()=>context})};
const {createPhotographicOrbit}=await import('../src/photographic-orbit.js');
const s=createPhotographicOrbit(),camera=new T.PerspectiveCamera(40,1.6,.1,100);
assert(!s.tv.visible,'procedural CRT never appears');assert(!s.environment.floor.visible,'procedural floor never appears');assert(s.referenceWorld.background.material.depthTest===false,'full-viewport photographic set');assert(s.referenceWorld.television.visible);assert(!s.physicalHuman.visible);assert.equal(s.human.geometry.attributes.position.count,4);
const state=p=>{s.update(p,camera);return [s.referenceWorld.clock.value,s.referenceWorld.progress.value,...s.referenceWorld.television.rotation.toArray(),s.portraitUniforms.angle.value,s.portraitUniforms.progress.value,...camera.position.toArray(),...camera.quaternion.toArray(),...s.human.rotation.toArray(),...s.body.instanceMatrix.array];};
const checkpoints=[0,.2,.45,.55,.63,.68,.7,.77,.85,1];
const forward=new Map(checkpoints.map(p=>[p,state(p)]));
for(const p of [...checkpoints].reverse())assert.deepEqual(state(p),forward.get(p),`exact reverse ${p}`);
// The camera must physically reach the back, not rotate a frontal photograph.
s.update(.68,camera);assert(camera.position.z<0);assert(Math.abs(s.portraitUniforms.angle.value-4)<.2);
let previous,maxStep=0,viewRange=[];
for(let i=0;i<=1000;i++){s.update(i/1000,camera);assert(Number.isFinite(s.portraitUniforms.angle.value));if(previous)maxStep=Math.max(maxStep,camera.position.distanceTo(previous));previous=camera.position.clone();if(i>=280&&i<=880)viewRange.push(s.portraitUniforms.angle.value);}
assert(Math.max(...viewRange)-Math.min(...viewRange)>4,'camera visits more than 180 degrees of photographic views');assert(maxStep<.20);
for(const aspect of [1.6,1,.462]){camera.aspect=aspect;s.update(.55,camera);assert(camera.position.toArray().every(Number.isFinite));}
const still=state(.55);s.animate(100);assert.deepEqual(state(.55),still,'time changes signal only');
console.log(JSON.stringify({mode:s.mode,views:8,backView:s.portraitUniforms.angle.value,maximumCameraStep:maxStep,reverse:'PASS',portraitTriangles:2,instances:s.body.count}));

const identity=s.human;for(const p of [.85,.9,.95,.99,1]){s.update(p,camera);assert.equal(s.human,identity);assert(s.human.visible,'same photographic subject remains visible in hero');}
console.log('PASS: original CRT/room/floor persist; no replacement endpoint; full hero surface');
