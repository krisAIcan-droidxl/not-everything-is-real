import * as T from 'three';
import {MarchingCubes} from 'three/addons/objects/MarchingCubes.js';
import {humanDistance} from './anatomy.js';

// One photographic atlas, projected onto a real closed garment surface.
// Front, back and profiles are selected by the surface normal, never the camera.
const common=`
uniform sampler2D humanAtlas;
uniform float gateProgress;
varying vec3 vHumanPosition;
varying vec3 vHumanNormal;
varying vec3 vAssembly;
float easeGate(float a,float b,float x){float t=clamp((x-a)/(b-a),0.,1.);return t*t*t*(t*(t*6.-15.)+10.);}
float assemblyAt(vec3 a){return a.z>.5?easeGate(.55+a.x*.015,.745+a.x*.015,gateProgress):easeGate(.245+a.y,.395+a.y,gateProgress);}
float breakdownAt(vec3 pos,float r){float boundary=.89+.09*sin(pos.y*8.)+.05*sin(pos.y*19.);return easeGate(.78,.97,gateProgress)*easeGate(boundary,1.28,pos.x)*(r>.20?1.:0.);}
vec4 atlasSample(vec2 uv,vec4 bounds){return texture2D(humanAtlas,mix(bounds.xy,bounds.zw,clamp(uv,vec2(.002),vec2(.998))));}
vec3 photoAt(vec3 pos,vec3 normal){
 float portraitWidth=mix(1.30,1.02,easeGate(2.80,3.24,pos.y));
 vec2 frontUV=vec2((pos.x-1.)/portraitWidth+.5,pos.y/3.42);
 vec2 sideUV=vec2((pos.z+.30)/.68,pos.y/3.42);
 vec4 front=atlasSample(frontUV,vec4(122./1672.,39./941.,430./1672.,927./941.));
 vec4 back=atlasSample(vec2(1.-frontUV.x,frontUV.y),vec4(507./1672.,41./941.,819./1672.,926./941.));
 vec4 left=atlasSample(vec2(1.-sideUV.x,sideUV.y),vec4(995./1672.,36./941.,1172./1672.,926./941.));
 vec4 right=atlasSample(sideUV,vec4(1337./1672.,36./941.,1516./1672.,923./941.));
 vec4 face=normal.z>0.?front:back,side=normal.x<0.?left:right;
 float w=pow(abs(normal.z),3.)/(pow(abs(normal.z),3.)+pow(abs(normal.x),3.)+.001);
 // Profile photographs contain the hanging arm: don't project that arm onto the trousers.
 if(pos.y<2.80&&abs(pos.x-1.)<.42)w=max(w,.88);
 vec3 fallback=pos.y>2.80&&pos.y<3.27?vec3(.22,.17,.14):vec3(.032,.039,.050);
 vec3 fc=mix(fallback,face.rgb,face.a),sc=mix(fallback,side.rgb,side.a);
 return mix(sc,fc,w);
}
`;
export function formationParameters(target,r){
 const delay=target.y/3.36*.085+r*.015+T.MathUtils.smootherstep(target.y,2.8,3.36)*.05;
 return [r,delay,target.x>1.15&&r>.60?1:0];
}
export function clothedSurface(){
 const n=64,march=new MarchingCubes(n,new T.MeshBasicMaterial(),false,false,30000);march.isolation=0;
 for(let z=0;z<n;z++)for(let y=0;y<n;y++)for(let x=0;x<n;x++)march.field[x+y*n+z*n*n]=-humanDistance((x/n*2-1)*.80,(y/n*2-1)*1.85+1.70,(z/n*2-1)*.42);
 march.update();
 const geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.BufferAttribute(march.positionArray.slice(0,march.count*3),3));
 geometry.setAttribute('normal',new T.BufferAttribute(march.normalArray.slice(0,march.count*3),3));
 geometry.scale(.80,1.85,.42);geometry.translate(1,1.70,0);geometry.computeBoundingSphere();
 march.geometry.dispose();march.material.dispose();return geometry;
}
export function photographicMaterial(uniforms,{surface=false,reflection=false}={}){
 const material=new T.MeshStandardMaterial({color:'#c7ced5',roughness:.91,metalness:.04,transparent:reflection,opacity:reflection?.16:1,depthWrite:!reflection});
 material.onBeforeCompile=shader=>{
  shader.uniforms.humanAtlas=uniforms.atlas;shader.uniforms.gateProgress=uniforms.progress;
  shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>\nattribute vec3 assembly;\n${surface?'':'attribute vec3 target;'}\nvarying vec3 vHumanPosition;varying vec3 vHumanNormal;varying vec3 vAssembly;`)
   .replace('#include <begin_vertex>',`#include <begin_vertex>\nvHumanPosition=${surface?'position':'target'};vHumanNormal=normal;vAssembly=assembly;`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>\n${common}`)
   .replace('#include <color_fragment>',`#include <color_fragment>\n${surface?'if(assemblyAt(vAssembly)<.965||breakdownAt(vHumanPosition,vAssembly.x)>.16)discard;':''}\nvec3 photographed=photoAt(vHumanPosition,normalize(vHumanNormal));${surface?'diffuseColor.rgb*=photographed;':'vec3 signal=vAssembly.x>.985?vec3(.43,.12,.12):vAssembly.x>.96?vec3(.17,.41,.48):vec3(.35,.40,.45);float organized=easeGate(.4,.97,assemblyAt(vAssembly));float dissolved=breakdownAt(vHumanPosition,vAssembly.x);diffuseColor.rgb*=mix(signal,photographed,organized*(1.-dissolved*.65));'}${reflection?'diffuseColor.a*=exp(-vHumanPosition.y*1.5);':''}`);
 };
 material.customProgramCacheKey=()=>`gate02-photographic-${surface}-${reflection}`;
 return material;
}
