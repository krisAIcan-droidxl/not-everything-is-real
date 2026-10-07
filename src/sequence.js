import * as T from 'three';
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
 // Anatomical volumes sampled into a single instanced body. All pieces travel from the glass.
 const volumes=[
 [[0,3.03,0],[.225,.30,.215]],[[0,2.70,0],[.105,.15,.105]],
 [[0,2.37,0],[.42,.35,.21]],[[0,1.99,0],[.28,.27,.17]],[[0,1.73,0],[.31,.23,.21]],
 [[-.20,1.29,0],[.135,.36,.145]],[[.20,1.29,0],[.135,.36,.145]],
 [[-.22,.67,.015],[.10,.32,.105]],[[.22,.67,.015],[.10,.32,.105]],
 [[-.22,.16,.11],[.12,.13,.23]],[[.22,.16,.11],[.12,.13,.23]],
 [[-.49,2.30,0],[.12,.31,.12]],[[.49,2.30,0],[.12,.31,.12]],
 [[-.61,1.85,.025],[.085,.24,.085]],[[.61,1.85,.025],[.085,.24,.085]],
 [[-.65,1.54,.035],[.08,.12,.055]],[[.65,1.54,.035],[.08,.12,.055]],
 [[0,3.01,.205],[.05,.075,.065]],[[0,2.88,.14],[.14,.07,.12]]];
 const points=[];const step=.055;
 for(let y=.05;y<3.35;y+=step)for(let x=-.76;x<.77;x+=step)for(let z=-.27;z<.34;z+=step){
 let inside=false,bound=false;for(const [c,r] of volumes){let d=((x-c[0])/r[0])**2+((y-c[1])/r[1])**2+((z-c[2])/r[2])**2;if(d<=1){inside=true;if(d>.53)bound=true}}
 if(inside&&bound&&rng(points.length+ x*900+y*810)>.16)points.push(new T.Vector3(x+1,y,z));}
 const body=new T.InstancedMesh(new T.BoxGeometry(step*.89,step*.89,step*.89),new T.MeshStandardMaterial({roughness:.58,metalness:.18}),points.length);body.instanceMatrix.setUsage(T.DynamicDrawUsage);body.frustumCulled=false;scene.add(body);
 const dummy=new T.Object3D();points.forEach((v,i)=>body.setColorAt(i,new T.Color().setHSL(.49,.02,rng(i)>.96?.7:.25+rng(i+10)*.27)));
 // Generic editorial/media canvases: fictional feed, CCTV, face and advert.
 const cards=[];
 for(let k=0;k<6;k++){const c=document.createElement('canvas');c.width=384;c.height=256;const ctx=c.getContext('2d');ctx.fillStyle=['#d5d5cb','#192725','#a8b6af','#242927','#c2b9a7','#1b1d21'][k];ctx.fillRect(0,0,384,256);ctx.fillStyle=k%2?'#d4d8d3':'#202726';ctx.font='15px monospace';ctx.fillText(['WORLD / REPORT','CAM 04 • LIVE','YOU / YOUR FEED','IDENTITY / 017','A BETTER YOU','SIGNAL ARCHIVE'][k],18,28);
 if(k===3||k===2){ctx.beginPath();ctx.ellipse(196,117,40,54,0,0,7);ctx.fill();ctx.fillRect(139,180,115,80);ctx.fillStyle='#788581';ctx.fillRect(174,108,10,3);ctx.fillRect(206,108,10,3)}else {for(let j=0;j<4;j++){ctx.globalAlpha=.25+j*.12;ctx.fillRect(18,55+j*42, k===4?220:90+j*53,23)}ctx.globalAlpha=1;}
 for(let j=0;j<256;j+=4){ctx.fillStyle='#00000018';ctx.fillRect(0,j,384,1)}const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;
 for(let j=0;j<3;j++){const m=mesh(new T.PlaneGeometry(.64,.43,4,4),new T.MeshBasicMaterial({map:tex,side:T.DoubleSide,transparent:true}),[0,0,0]);cards.push(m)}}
 const curve=new T.CatmullRomCurve3([new T.Vector3(-1.4,1.8,8.5),new T.Vector3(-2.05,1.45,5.2),new T.Vector3(.1,1.95,5),new T.Vector3(5.5,2.3,3),new T.Vector3(5.2,2.5,-3.8),new T.Vector3(.7,2.2,-5.5),new T.Vector3(-4.4,2.2,-2.7),new T.Vector3(-3.8,1.95,4.9),new T.Vector3(.2,1.8,6.4)],false,'catmullrom',.35);
 const knots=[0,.18,.28,.47,.58,.68,.77,.88,1];
 const speeds=knots.map((v,i)=>i===0||i===knots.length-1?0:2/((knots[i]-knots[i-1])*8+(knots[i+1]-knots[i])*8));
 const sources=points.map((_,i)=>new T.Vector3(-2.51+(rng(i+6)-.5)*.95,.9+(rng(i+7)-.5)*.75,.70));
 const mids=points.map((_,i)=>new T.Vector3(mix(-1.5,1.5,rng(i+2)),.3+rng(i+5)*3.6,.7+rng(i+8)*1.1));
 function update(p,camera){
 let idx=0;while(idx<knots.length-2&&p>knots[idx+1])idx++;const h=knots[idx+1]-knots[idx], f=clamp((p-knots[idx])/h,0,1);const f2=f*f,f3=f2*f;
 const settle=(2*f3-3*f2+1)*idx/8+(f3-2*f2+f)*h*speeds[idx]+(-2*f3+3*f2)*(idx+1)/8+(f3-f2)*h*speeds[idx+1];
 camera.position.copy(curve.getPoint(settle));const focus=smooth(.16,.5,p);camera.lookAt(mix(-2.35,.35,focus),mix(.9,1.65,focus),0);camera.fov=mix(40,36,smooth(.77,1,p));camera.updateProjectionMatrix();
 screenMat.uniforms.progress.value=p;glow.intensity=3+smooth(.13,.3,p)*2;
 points.forEach((target,i)=>{
 const r=rng(i+3),delay=target.y/3.35*.22+r*.075;
 const fly=smooth(.20+r*.035,.42+r*.055,p);const form=smooth(.29+delay,.49+delay,p);
 const src=sources[i];
 const mid=mids[i];
 dummy.position.copy(src).lerp(mid,fly).lerp(target,form);
 const residual=smooth(.81,.96,p)*(r>.965?1:0);dummy.position.x+=residual*(.3+r*1.5);dummy.position.z+=residual*.7;
 dummy.rotation.set((1-form)*r*6,(1-form)*r*8,(1-form)*r*3);
 const size=smooth(.19+r*.05,.24+r*.05,p);dummy.scale.setScalar(size*(1-residual*.35));dummy.updateMatrix();body.setMatrixAt(i,dummy.matrix);
 });body.instanceMatrix.needsUpdate=true;
 cards.forEach((m,i)=>{const r=rng(i+90);const t=smooth(.18+i*.004,.38+i*.006,p);m.position.set(mix(-2.5,-.4+r*2.8,t),mix(.9,.4+rng(i+80)*3,t),mix(.7,1.2+rng(i+40)*1.8,t));m.rotation.set(t*(r-.5),t*(r-.5)*2,t*(rng(i+33)-.5));const s=smooth(.18+i*.004,.23+i*.004,p)*(1-smooth(.36+i*.006,.55+i*.006,p));m.scale.setScalar(s);m.material.opacity=clamp(s*2,0,1)});
 }
 return {scene,update,body,points,screenMat};
}
