import * as T from 'three';
import {humanTargets,BODY_STEP} from './anatomy.js';
import {clothedSurface,formationParameters,photographicMaterial} from './human-material.js';
import {broadcastMaterial} from './media-material.js';
import {createEnvironment} from './environment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
const clamp=T.MathUtils.clamp, mix=T.MathUtils.lerp;
export const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*t*(t*(t*6-15)+10)};
const rng=(i)=>{const n=Math.sin(i*127.1+311.7)*43758.5453;return n-Math.floor(n)};
export function createSequence(){
 const manager=new T.LoadingManager();let readyResolve;const ready=new Promise(resolve=>readyResolve=resolve);manager.onLoad=()=>{scene.visible=true;readyResolve()};
 const loadTexture=path=>{if(typeof window==='undefined')return new T.DataTexture(new Uint8Array([80,88,98,255]),1,1);const tex=new T.TextureLoader(manager).load(path);tex.colorSpace=T.SRGBColorSpace;return tex;};
 const scene=new T.Scene();scene.visible=typeof window==='undefined';scene.background=new T.Color('#030405');scene.fog=new T.FogExp2('#030405',.035);
 // Shared micro-grain and restrained wear for aged injection-moulded casing.
 const casingCanvas=document.createElement('canvas');casingCanvas.width=casingCanvas.height=256;const casingContext=casingCanvas.getContext('2d');
 casingContext.fillStyle='#cacaca';casingContext.fillRect(0,0,256,256);
 for(let i=0;i<2400;i++){casingContext.fillStyle=rng(i+401)>.5?'#b4b4b4':'#dedede';casingContext.fillRect(rng(i+402)*256,rng(i+403)*256,1,1);}
 for(let i=0;i<35;i++){casingContext.fillStyle='#949494';casingContext.fillRect(rng(i+404)*256,rng(i+405)*256,1,2+rng(i+406)*11);}
 const casingTexture=new T.CanvasTexture(casingCanvas);
 const grey=new T.MeshStandardMaterial({color:'#343b43',roughness:.78,metalness:.08,bumpMap:casingTexture,bumpScale:.007});
 const trim=new T.MeshStandardMaterial({color:'#14171a',roughness:.51,metalness:.12,bumpMap:casingTexture,bumpScale:.005});
 let currentParent=scene;
 const mesh=(geo,mat,pos,scale,parent=currentParent)=>{const m=new T.Mesh(geo,mat);m.position.set(...pos);if(scale)m.scale.set(...scale);parent.add(m);return m};
 const box=(s,r=.05)=>new RoundedBoxGeometry(...s,3,r);
 const tv=new T.Group();tv.position.set(-2.35,.87,0);scene.add(tv);currentParent=tv;
 mesh(box([1.8,1.42,1.48],.12),grey,[0,0,-.32]);
 mesh(box([1.76,1.36,.18],.08),trim,[0,0,.43]);
 mesh(box([1.31,1.08,.13],.15),grey,[-.16,.03,.54]);
 const screenGeo=new T.PlaneGeometry(1.13,.87,32,24);const pa=screenGeo.attributes.position;
 for(let i=0;i<pa.count;i++){const x=pa.getX(i),y=pa.getY(i);pa.setZ(i,.09*(1-(x/.61)**2)*(1-(y/.49)**2))}screenGeo.computeVertexNormals();
 const signalClock={value:0};
 const mediaAtlas={value:loadTexture('/assets/broadcast-atlas.webp')};mediaAtlas.value.anisotropy=8;
 const screenMat=new T.ShaderMaterial({uniforms:{progress:{value:0},signalClock,mediaAtlas},vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec2 vUv;uniform float progress,signalClock;uniform sampler2D mediaAtlas;
 float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
 void main(){vec2 u=vUv;float tick=floor(signalClock*30.);float instability=smoothstep(.08,.28,progress);
 float tear=step(.965,hash(vec2(floor(u.y*36.),tick)));u.x+=tear*instability*.045;
 float scan=.80+.20*sin(u.y*680.+signalClock*2.);float n=hash(floor(u*vec2(520.,390.))+vec2(tick,tick*1.37));
 float roll=exp(-pow((u.y-fract(signalClock*.17))*30.,2.));float edge=smoothstep(0.,.09,u.x)*smoothstep(0.,.09,1.-u.x)*smoothstep(0.,.09,u.y)*smoothstep(0.,.09,1.-u.y);
 vec3 c=vec3(.47,.52,.53)*(.15+n*.73+roll*.16)*scan;
 float broadcast=smoothstep(.14,.24,progress)*(1.-smoothstep(.32,.48,progress));
 float upper=1.-mod(floor(signalClock*.225),2.);vec2 origin=vec2(mod(floor(signalClock*.45),2.)*.5,upper*.52734375);
 vec3 news=texture2D(mediaAtlas,origin+clamp(u,vec2(.004),vec2(.996))*vec2(.5,mix(.52734375,.47265625,upper))).rgb;
 c=mix(c,news*scan,broadcast*(.48+tear*.30));c*=edge*(.94+.06*sin(signalClock*23.));gl_FragColor=vec4(c,1.);
 #include <colorspace_fragment>
 }`});
 mesh(screenGeo,screenMat,[-.16,.03,.625]);
 // Reflected strip on convex glass, physical switches and speaker grille.
 const glass=new T.MeshPhysicalMaterial({color:'#7b9994',transparent:true,opacity:.095,roughness:.12,metalness:.4});
 mesh(screenGeo,glass,[-.16,.03,.635]);
 for(let i=0;i<15;i++)mesh(new T.BoxGeometry(.22,.015,.022),trim,[.67,-.48+i*.035,.54]);
 for(let i=0;i<2;i++) {const knob=mesh(new T.CylinderGeometry(.075,.075,.065,24),grey,[.67,.35-i*.23,.57]);knob.rotation.x=Math.PI/2;mesh(new T.BoxGeometry(.012,.07,.013),trim,[.67,.35-i*.23,.61]);}
 const led=mesh(new T.SphereGeometry(.018,8,8),new T.MeshBasicMaterial({color:'#c64735'}),[.64,-.58,.56]);
 for(const x of [-.6,.6])mesh(box([.17,.16,.85]),trim,[x,-.77,-.3]);
 for(let i=0;i<12;i++)mesh(new T.BoxGeometry(.015,.35,.02),trim,[-.65+i*.115,.16,-1.071]);
 currentParent=scene;
 const environment=createEnvironment(scene,loadTexture);
 scene.add(new T.HemisphereLight('#859dbb','#090b0f',.58));
 const key=new T.SpotLight('#b5c6da',90,25,.55,.7,1.5);key.position.set(-3,7,4);key.target.position.set(-2.35,.9,0);scene.add(key,key.target);
 const rim=new T.PointLight('#88a8d0',42,12,2);rim.position.set(2.5,4,-3);scene.add(rim);
 const fill=new T.SpotLight('#d1d2ce',0,12,.48,.9,2);fill.position.set(-.8,3.3,4.8);fill.target.position.set(1,1.65,0);scene.add(fill,fill.target);
 const glow=new T.PointLight('#b7d2ca',3,5,2);glow.position.set(-2.5,1,1.2);scene.add(glow);
 // A dense, continuous anatomical surface is assembled from the source; no body fade.
 const points=humanTargets(),step=BODY_STEP;
 const photoUniforms={mediaAtlas,clock:signalClock,atlas:{value:loadTexture('/assets/person-atlas.webp')},progress:{value:0}};
 photoUniforms.atlas.value.anisotropy=8;
 const assembly=points.map((target,i)=>formationParameters(target,rng(i+3)));
 const bodyGeo=new T.BoxGeometry(step*1.04,step*1.04,step*1.04);
 bodyGeo.setAttribute('target',new T.InstancedBufferAttribute(new Float32Array(points.flatMap(v=>v.toArray())),3));
 bodyGeo.setAttribute('assembly',new T.InstancedBufferAttribute(new Float32Array(assembly.flat()),3));
 const body=new T.InstancedMesh(bodyGeo,photographicMaterial(photoUniforms),points.length);
 body.instanceMatrix.setUsage(T.DynamicDrawUsage);body.frustumCulled=false;scene.add(body);
 const dummy=new T.Object3D();
 const surfaceGeo=clothedSurface(),surfacePos=surfaceGeo.attributes.position;
 const lookup=new Map(points.map((v,i)=>[`${Math.round((v.x-1)/step)},${Math.round(v.y/step)},${Math.round(v.z/step)}`,i]));
 const surfaceAssembly=new Float32Array(surfacePos.count*3);
 for(let i=0;i<surfacePos.count;i++){
  const v=new T.Vector3().fromBufferAttribute(surfacePos,i),x=Math.round((v.x-1)/step),y=Math.round(v.y/step),z=Math.round(v.z/step);let nearest=lookup.get(`${x},${y},${z}`),distance=Infinity;
  if(nearest===undefined)for(let dx=-2;dx<=2;dx++)for(let dy=-2;dy<=2;dy++)for(let dz=-2;dz<=2;dz++){const j=lookup.get(`${x+dx},${y+dy},${z+dz}`);if(j!==undefined){const d=v.distanceToSquared(points[j]);if(d<distance){distance=d;nearest=j}}}
  surfaceAssembly.set(nearest===undefined?formationParameters(v,rng(i+3)):assembly[nearest],i*3);
 }
 surfaceGeo.setAttribute('assembly',new T.BufferAttribute(surfaceAssembly,3));
 const physicalHuman=new T.Mesh(surfaceGeo,photographicMaterial(photoUniforms,{surface:true}));physicalHuman.name='constructed-human';scene.add(physicalHuman);
 const reflection=new T.Mesh(surfaceGeo,photographicMaterial(photoUniforms,{surface:true,reflection:true}));reflection.scale.y=-1;reflection.position.y=-.006;reflection.name='floor-reflection';reflection.renderOrder=1;scene.add(reflection);
 // The CRT remains a physical object with a subdued reflection, not a screen-space layer.
 const tvReflection=tv.clone();tvReflection.position.y=-tv.position.y;tvReflection.scale.y=-1;tvReflection.name='floor-reflection';
 tvReflection.traverse(o=>{if(o.material){o.material=o.material.clone();o.material.transparent=true;o.material.opacity=.20;if(o.material.color)o.material.color.multiplyScalar(.45);if(o.material.uniforms?.progress)o.material.uniforms.progress=screenMat.uniforms.progress;}});scene.add(tvReflection);
 // Photographic broadcasts, shared texture/geometry; no placeholder feed rectangles.
 const cards=[],cardGeometry=new T.PlaneGeometry(.72,.48);
 for(let i=0;i<18;i++)cards.push(mesh(cardGeometry,broadcastMaterial(mediaAtlas,signalClock,i),[0,0,0]));
 const curve=new T.CatmullRomCurve3([new T.Vector3(-1.4,1.8,8.5),new T.Vector3(-2.05,1.45,5.2),new T.Vector3(.1,1.95,5),new T.Vector3(5.5,2.3,3.8),new T.Vector3(5.2,2.5,-3.8),new T.Vector3(.7,2.2,-5.5),new T.Vector3(-4.4,2.2,-2.7),new T.Vector3(1.5,1.95,7.2),new T.Vector3(2.8,1.85,6.9)],false,'catmullrom',.35);
 const knots=[0,.18,.28,.55,.63,.68,.77,.88,1];
 const speeds=knots.map((v,i)=>i===0||i===knots.length-1?0:2/((knots[i]-knots[i-1])*8+(knots[i+1]-knots[i])*8));
 const sources=points.map((_,i)=>new T.Vector3(-2.51+(rng(i+6)-.5)*.95,.9+(rng(i+7)-.5)*.75,.70));
 // A single arcing corridor: thick near the glass, narrow at the left hip/ribcage.
 const streamCurve=new T.CubicBezierCurve3(new T.Vector3(-2.51,.92,.71),new T.Vector3(-2.42,1.05,1.20),new T.Vector3(-.6,1.65,.75),new T.Vector3(.60,1.85,.08));
 const mids=points.map((_,i)=>{
  const t=Math.pow(rng(i+2),1.8),v=streamCurve.getPoint(t),a=rng(i+8)*Math.PI*2;
  const radius=(.19*(1-t)+.045)*Math.sqrt(rng(i+5));
  v.y+=Math.sin(a)*radius;v.z+=Math.cos(a)*radius;
  return v;
 });
 const foreground=points.map((v,i)=>v.x>1.35&&rng(i+31)>.985);
 // Static distribution traits are calculated once, not on every scroll frame.
 const shardTraits=points.map((v,i)=>[smooth(.98+.04*Math.sin(v.y*5.4)+.024*Math.sin(v.y*13.7),1.30,v.x),(rng(i+18)-.5)*.58,Math.sin(i)*.12,(rng(i+17)-.5)*.55,(rng(i+19)-.5)*.55,(rng(i+20)-.5)*.38]);
 function update(p,camera){
 let idx=0;while(idx<knots.length-2&&p>knots[idx+1])idx++;const h=knots[idx+1]-knots[idx], f=clamp((p-knots[idx])/h,0,1);const f2=f*f,f3=f2*f;
 const settle=(2*f3-3*f2+1)*idx/8+(f3-2*f2+f)*h*speeds[idx]+(-2*f3+3*f2)*(idx+1)/8+(f3-f2)*h*speeds[idx+1];
 camera.position.copy(curve.getPoint(settle));
 // Keep the closing orbit on a stable radius rather than cutting across the subject.
 const heroRadius=smooth(.82,.90,p),dx=camera.position.x-.35,dz=camera.position.z;
 const radius=Math.hypot(dx,dz),safeRadius=.5*(radius+8.0+Math.sqrt((radius-8.0)**2+.0064));
 const lift=mix(1,safeRadius/radius,heroRadius);camera.position.x=.35+dx*lift;camera.position.z=dz*lift;
 const focus=smooth(.16,.5,p);const hero=smooth(.86,.96,p);
 camera.lookAt(mix(-2.35,.35,focus)-hero*.35,mix(.9,1.65,focus)+hero*.28,0);camera.fov=mix(40,31,smooth(.77,.96,p));
 if(camera.aspect<1){camera.position.addScaledVector(camera.position.clone().sub(new T.Vector3(.35,1.65,0)).normalize(),(1-camera.aspect)*3.5);camera.fov=48};camera.updateProjectionMatrix();
 signalClock.value=p*12;screenMat.uniforms.progress.value=p;photoUniforms.progress.value=p;glow.intensity=3+smooth(.13,.3,p)*2;
 const bodyLight=smooth(.25,.43,p);
 key.intensity=26+bodyLight*64;key.target.position.set(mix(-2.35,1,bodyLight),mix(.9,1.7,bodyLight),0);
 rim.intensity=8+smooth(.3,.65,p)*34;fill.intensity=smooth(.28,.45,p)*54;
 points.forEach((target,i)=>{
 const [r,delay,sourceFlag]=assembly[i];
 // Lower body locks first; the chest/arms are legible during the shared 42–55% shot.
 const fly=smooth(.19+r*.025,.32+r*.03,p);
 const keepSource=sourceFlag===1;
 const form=keepSource?smooth(.55+r*.015,.745+r*.015,p):smooth(.245+delay,.395+delay,p);
 dummy.position.copy(sources[i]).lerp(mids[i],fly).lerp(target,form);
 // Sparse foreground pieces are assigned to the outside shoulder, not the face/chest.
 const pass=foreground[i]?smooth(.27,.34,p)*(1-smooth(.36,.46,p)):0;
 dummy.position.z+=pass*.75;dummy.position.x-=pass*.20;
 // Residual breakdown is localized on the figure's right edge, rather than random holes.
 const traits=shardTraits[i],residual=smooth(.78,.97,p)*traits[0]*(r>.20?1:0);
 dummy.position.x+=residual*(.10+r*.90);dummy.position.z+=residual*traits[1];
 dummy.position.y+=residual*traits[2];
 dummy.rotation.set((1-form)*r*1.6+residual*traits[3],(1-form)*r*2.1+residual*traits[4],(1-form)*r*.8+residual*traits[5]);
 const size=smooth(.19+r*.025,.23+r*.025,p)*mix(.52,1,form);
 const physical=smooth(.965,1,form)*(1-smooth(.10,.17,residual));
 // Every fragment participates in construction; only the late airborne side thins out.
 const airborne=1-smooth(.08,.32,residual)*(r>.78?0:1),fragmentSize=size*(1-physical*.98)*airborne;
 dummy.scale.set(fragmentSize*(1+residual*r*.65),fragmentSize*(1-residual*.45),fragmentSize*(1-residual*.72));dummy.updateMatrix();body.setMatrixAt(i,dummy.matrix);
 });body.instanceMatrix.needsUpdate=true;
 cards.forEach((m,i)=>{
  const r=rng(i+90),flight=smooth(.18+i*.003,.39+i*.004,p);
  // Recognizable frames stay within the source corridor and fragment before the torso.
  const t=flight*(.12+r*.64),v=streamCurve.getPoint(t);
  m.position.copy(v);m.position.y+=(rng(i+80)-.5)*.23*(1-t);m.position.z+=(rng(i+40)-.5)*.18;
  m.rotation.set(flight*(r-.5)*.30,flight*(r-.5)*.55,flight*(rng(i+33)-.5)*.32);
  const readable=i%3!==1;
  const birth=smooth(.18+i*.003,.23+i*.003,p),breakup=1-smooth(readable?.46:.32+i*.003,readable?.59:.405+i*.003,p);
  const final=smooth(.79+i*.002,.94+i*.002,p);
  const destination=new T.Vector3(1.58+r*1.04,.16+rng(i+101)*3.08,.14+(rng(i+104)-.5)*.50);
  m.position.lerp(destination,final);m.rotation.y=mix(m.rotation.y,.18+(r-.5)*.42,final);
  m.scale.setScalar(birth*breakup*mix(1.0,.66,t)+final*(.32+r*.40));m.material.opacity=clamp(birth*breakup+final*.74,0,1);m.material.uniforms.opacity.value=m.material.opacity;
 });
 }
 if(typeof window==='undefined')readyResolve();
 const animate=time=>{signalClock.value=time};
 return {scene,update,animate,body,points,screenMat,tv,cards,physicalHuman,photoUniforms,ready,environment};
}
