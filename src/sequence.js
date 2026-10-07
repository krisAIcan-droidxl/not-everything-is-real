import * as T from 'three';
import {humanTargets,BODY_STEP} from './anatomy.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
const clamp=T.MathUtils.clamp, mix=T.MathUtils.lerp;
export const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*t*(t*(t*6-15)+10)};
const rng=(i)=>{const n=Math.sin(i*127.1+311.7)*43758.5453;return n-Math.floor(n)};
export function createSequence(){
 const scene=new T.Scene();scene.background=new T.Color('#030405');scene.fog=new T.FogExp2('#030405',.035);
 const grey=new T.MeshStandardMaterial({color:'#343431',roughness:.72});
 const trim=new T.MeshStandardMaterial({color:'#101313',roughness:.3,metalness:.25});
 let currentParent=scene;
 const mesh=(geo,mat,pos,scale,parent=currentParent)=>{const m=new T.Mesh(geo,mat);m.position.set(...pos);if(scale)m.scale.set(...scale);parent.add(m);return m};
 const box=(s,r=.05)=>new RoundedBoxGeometry(...s,3,r);
 const tv=new T.Group();tv.position.set(-2.35,.87,0);scene.add(tv);currentParent=tv;
 mesh(box([1.8,1.42,1.48],.12),grey,[0,0,-.32]);
 mesh(box([1.76,1.36,.18],.08),trim,[0,0,.43]);
 mesh(box([1.31,1.08,.13],.15),grey,[-.16,.03,.54]);
 const screenGeo=new T.PlaneGeometry(1.13,.87,32,24);const pa=screenGeo.attributes.position;
 for(let i=0;i<pa.count;i++){const x=pa.getX(i),y=pa.getY(i);pa.setZ(i,.09*(1-(x/.61)**2)*(1-(y/.49)**2))}screenGeo.computeVertexNormals();
 const screenMat=new T.ShaderMaterial({uniforms:{progress:{value:0}},vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec2 vUv;uniform float progress;float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}void main(){vec2 u=vUv;float scan=.72+.28*sin(u.y*590.);float n=hash(floor(u*vec2(360.,240.))+floor(progress*260.));float roll=exp(-pow((u.y-fract(progress*7.))*25.,2.));float edge=smoothstep(.0,.13,u.x)*smoothstep(.0,.13,1.-u.x)*smoothstep(.0,.13,u.y)*smoothstep(.0,.13,1.-u.y);vec3 c=vec3(.39,.46,.44)*(.2+n*.55+roll*.25)*scan*edge;gl_FragColor=vec4(c,1.);}`});
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
 const floor=mesh(new T.PlaneGeometry(100,100),new T.MeshStandardMaterial({color:'#151717',roughness:.94}),[0,0,0]);floor.rotation.x=-Math.PI/2;floor.name="floor";
 scene.add(new T.HemisphereLight('#9dadae','#15110e',.7));
 const key=new T.SpotLight('#c8c9c4',65,25,.55,.7,1.5);key.position.set(-3,7,4);key.target.position.set(-1,1,0);scene.add(key,key.target);
 const rim=new T.PointLight('#8bacb5',19,12,2);rim.position.set(2.5,4,-3);scene.add(rim);
 const glow=new T.PointLight('#b7d2ca',3,5,2);glow.position.set(-2.5,1,1.2);scene.add(glow);
 // A dense, continuous anatomical surface is assembled from the source; no body fade.
 const points=humanTargets(),step=BODY_STEP;
 const body=new T.InstancedMesh(new T.BoxGeometry(step*1.04,step*1.04,step*1.04),new T.MeshStandardMaterial({roughness:.72,metalness:.07}),points.length);
 body.instanceMatrix.setUsage(T.DynamicDrawUsage);body.frustumCulled=false;scene.add(body);
 const dummy=new T.Object3D();
 points.forEach((v,i)=>body.setColorAt(i,new T.Color().setHSL(.10,.025,.42+rng(i+10)*.065)));
 // Generic editorial/media canvases: fictional feed, CCTV, face and advert.
 const cards=[];
 for(let k=0;k<6;k++){const c=document.createElement('canvas');c.width=384;c.height=256;const ctx=c.getContext('2d');ctx.fillStyle=['#d5d5cb','#192725','#a8b6af','#242927','#c2b9a7','#1b1d21'][k];ctx.fillRect(0,0,384,256);ctx.fillStyle=k%2?'#d4d8d3':'#202726';ctx.font='15px monospace';ctx.fillText(['WORLD / REPORT','CAM 04 • LIVE','YOU / YOUR FEED','IDENTITY / 017','A BETTER YOU','SIGNAL ARCHIVE'][k],18,28);
 if(k===3||k===2){ctx.beginPath();ctx.ellipse(196,117,40,54,0,0,7);ctx.fill();ctx.fillRect(139,180,115,80);ctx.fillStyle='#788581';ctx.fillRect(174,108,10,3);ctx.fillRect(206,108,10,3)}else {for(let j=0;j<4;j++){ctx.globalAlpha=.25+j*.12;ctx.fillRect(18,55+j*42, k===4?220:90+j*53,23)}ctx.globalAlpha=1;}
 for(let j=0;j<256;j+=4){ctx.fillStyle='#00000018';ctx.fillRect(0,j,384,1)}const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;
 for(let j=0;j<3;j++){const m=mesh(new T.PlaneGeometry(.64,.43,4,4),new T.MeshBasicMaterial({map:tex,side:T.DoubleSide,transparent:true}),[0,0,0]);cards.push(m)}}
 const curve=new T.CatmullRomCurve3([new T.Vector3(-1.4,1.8,8.5),new T.Vector3(-2.05,1.45,5.2),new T.Vector3(.1,1.95,5),new T.Vector3(5.5,2.3,3.8),new T.Vector3(5.2,2.5,-3.8),new T.Vector3(.7,2.2,-5.5),new T.Vector3(-4.4,2.2,-2.7),new T.Vector3(1.5,1.95,7.2),new T.Vector3(5.8,1.85,4.6)],false,'catmullrom',.35);
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
 screenMat.uniforms.progress.value=p;glow.intensity=3+smooth(.13,.3,p)*2;
 points.forEach((target,i)=>{
 const r=rng(i+3),height=target.y/3.36;
 // Lower body locks first; the chest/arms are legible during the shared 42–55% shot.
 const delay=height*.135+r*.017;
 const fly=smooth(.19+r*.025,.32+r*.03,p);
 const form=smooth(.265+delay,.425+delay,p);
 dummy.position.copy(sources[i]).lerp(mids[i],fly).lerp(target,form);
 // Sparse foreground pieces are assigned to the outside shoulder, not the face/chest.
 const pass=foreground[i]?smooth(.27,.34,p)*(1-smooth(.36,.46,p)):0;
 dummy.position.z+=pass*.75;dummy.position.x-=pass*.20;
 // Residual breakdown is localized on the figure's right edge, rather than random holes.
 const edge=smooth(1.20,1.59,target.x),residual=smooth(.81,.96,p)*edge*(r>.70?1:0);
 dummy.position.x+=residual*(.16+r*.62);dummy.position.z+=residual*.12;
 dummy.rotation.set((1-form)*r*1.6,(1-form)*r*2.1,(1-form)*r*.8);
 const size=smooth(.19+r*.025,.23+r*.025,p)*mix(.52,1,form);
 dummy.scale.setScalar(size*(1-residual*.25));dummy.updateMatrix();body.setMatrixAt(i,dummy.matrix);
 });body.instanceMatrix.needsUpdate=true;
 cards.forEach((m,i)=>{
  const r=rng(i+90),flight=smooth(.18+i*.003,.39+i*.004,p);
  // Recognizable frames stay within the source corridor and fragment before the torso.
  const t=flight*(.12+r*.64),v=streamCurve.getPoint(t);
  m.position.copy(v);m.position.y+=(rng(i+80)-.5)*.23*(1-t);m.position.z+=(rng(i+40)-.5)*.18;
  m.rotation.set(flight*(r-.5)*.30,flight*(r-.5)*.55,flight*(rng(i+33)-.5)*.32);
  const birth=smooth(.18+i*.003,.23+i*.003,p),breakup=1-smooth(.32+i*.003,.405+i*.003,p);
  m.scale.setScalar(birth*breakup*mix(.75,.38,t));m.material.opacity=clamp(birth*breakup,0,1);
 });
 }
 return {scene,update,body,points,screenMat,tv,cards};
}
