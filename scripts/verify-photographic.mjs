import assert from 'node:assert/strict';
import * as T from 'three';
import {createPhotographicFilm} from '../src/photographic-film.js';
const s=createPhotographicFilm(),camera=new T.PerspectiveCamera(40,1.6,.1,100);
assert.equal(s.mode,'photographic');assert.equal(s.scene.children.length,2);assert.equal(s.stream.count,320);
const state=p=>{s.update(p,camera);return {p:s.progress.value,time:s.clock.value,aspect:s.aspect.value,matrix:Array.from(s.stream.instanceMatrix.array),camera:camera.position.toArray()}};
const stops=[0,.20,.45,.55,.70,.85,1];const forward=stops.map(state);
for(let i=stops.length-1;i>=0;i--)assert.deepEqual(state(stops[i]),forward[i]);
s.update(.45,camera);const before=Array.from(s.stream.instanceMatrix.array);s.animate(100);assert.deepEqual(Array.from(s.stream.instanceMatrix.array),before);assert.equal(s.clock.value,100);assert.deepEqual(state(.45),forward[2]);
for(const aspect of [1.6,1.333,.462]){camera.aspect=aspect;for(let i=0;i<=100;i++){const v=state(i/100);assert(v.matrix.every(Number.isFinite));assert.equal(v.aspect,aspect)}}
for(const p of [0,1]){s.update(p,camera);const a=s.stream.instanceMatrix.array;for(let i=0;i<320;i++)assert.equal(a[i*16],0,'endpoint stream hidden');}
console.log('PASS: original photographic scene, 320 shared filaments, exact reverse, live appearance isolation, responsive finite state, quiet endpoints');
