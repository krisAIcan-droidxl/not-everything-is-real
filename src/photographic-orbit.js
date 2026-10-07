import * as T from 'three';
import {createSequence,smooth} from './sequence.js';
import {orbitBounds} from './orbit-bounds.js';
import {createReferenceWorld} from './reference-world.js';

// Eight photographed views share one pose and one floor contact. The existing
// world/camera/assembly remain authoritative; this replaces only the body surface.
export function createPhotographicOrbit(){
 const s=createSequence({photographicSurface:false});
 // The original photographic set replaces every procedural room/CRT surface.
 s.tv.visible=false;s.environment.floor.visible=false;s.environment.debris.visible=false;
 for(const child of s.scene.children){if(child.name==='floor-reflection'||child.name==='atmosphere'||child.geometry?.type==='TubeGeometry')child.visible=false;}
 const referenceWorld=createReferenceWorld(s.scene);
 let resolve;const portraitReady=new Promise(r=>resolve=r);
 const atlas=typeof window==='undefined'?new T.DataTexture(new Uint8Array([0,0,0,0]),1,1):new T.TextureLoader().load('/assets/orbit-person-atlas.webp',resolve);
 if(typeof window==='undefined')resolve();
 atlas.colorSpace=T.SRGBColorSpace;atlas.anisotropy=8;
 const bounds=new T.DataTexture(orbitBounds,8,256);bounds.minFilter=bounds.magFilter=T.LinearFilter;bounds.needsUpdate=true;
 const uniforms={atlas:{value:atlas},bounds:{value:bounds},progress:{value:0},angle:{value:0},reflection:{value:0}};
 const material=new T.ShaderMaterial({uniforms,transparent:true,depthWrite:false,side:T.DoubleSide,
 vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:`
 uniform sampler2D atlas;uniform sampler2D bounds;uniform float progress;uniform float angle;uniform float reflection;varying vec2 vUv;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 vec4 view(float i,vec2 uv){
 i=mod(i,8.);float tileId=i;
 if(i==2.)tileId=6.;if(i==3.)tileId=5.;if(i==5.)tileId=3.;if(i==6.)tileId=2.;
 // Registration is UV-only: retain the supplied photographs without resampling.
 float center=231.,top=11.,bottom=500.;
 if(tileId==1.){center=205.5;top=9.;bottom=502.;}
 if(tileId==2.){center=176.5;top=11.;bottom=501.;}
 if(tileId==3.){center=161.5;top=10.;bottom=497.;}
 if(tileId==4.){center=229.;top=6.;bottom=491.;}
 if(tileId==5.){center=202.5;top=5.;bottom=492.;}
 if(tileId==6.){center=171.;top=7.;bottom=495.;}
 if(tileId==7.){center=173.5;top=4.;bottom=496.;}
 vec2 q=uv;if(i==7.)q.x=1.-q.x;
 q.x+=(center-192.)/384.;
 q.y=(1.-bottom/512.)+(q.y-.024)*((bottom-top)/512.)/.952;
 if(any(lessThan(q,vec2(.001)))||any(greaterThan(q,vec2(.999))))return vec4(0.);
 vec2 tile=vec2(mod(tileId,4.),1.-floor(tileId/4.));return texture2D(atlas,(tile+q)/vec2(4.,2.));
 }
 void main(){
 float frame=mod(angle+8.,8.),lo=floor(frame),f=fract(frame);
 // Premultiplied interpolation keeps transparent photographic edges clean.
 float w=f*f*(3.-2.*f);
 vec2 ba=texture2D(bounds,vec2((lo+.5)/8.,vUv.y)).rg;
 vec2 bb=texture2D(bounds,vec2((mod(lo+1.,8.)+.5)/8.,vUv.y)).rg;
 vec2 target=mix(ba,bb,w);float x=(vUv.x-target.x)/max(target.y-target.x,.002);
 vec4 a=view(lo,vec2(mix(ba.x,ba.y,x),vUv.y)),b=view(lo+1.,vec2(mix(bb.x,bb.y,x),vUv.y));
 float alpha=mix(a.a,b.a,w);vec3 color=mix(a.rgb*a.a,b.rgb*b.a,w)/max(alpha,.0001);
 vec2 cell=floor(vUv*vec2(90.,170.));float seed=hash(cell);
 float arrival=.245+vUv.y*.275+seed*.035;
 float assembled=smoothstep(arrival,arrival+.055,progress);
 // Irregular data edge instead of a straight half-body division.
 float edge=.55+.055*sin(vUv.y*27.)+.03*sin(vUv.y*71.);
 float erosion=smoothstep(.77,.97,progress)*smoothstep(edge,edge+.18,vUv.x);
 alpha*=assembled*(1.-erosion*smoothstep(.18,.72,seed));
 if(reflection>.5){alpha*=.19*pow(1.-vUv.y,2.);color*=vec3(.52,.65,.83);}
 if(alpha<.008)discard;
 gl_FragColor=vec4(color,alpha);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const geo=new T.PlaneGeometry(2.55,3.4);
 const human=new T.Mesh(geo,material);human.name='photographic-orbit-human';human.position.set(1,1.62,0);human.renderOrder=4;human.frustumCulled=false;
 const reflectionMaterial=material.clone();reflectionMaterial.uniforms={...uniforms,reflection:{value:1}};
 const reflection=new T.Mesh(geo,reflectionMaterial);reflection.name='photographic-orbit-reflection';reflection.position.set(1,-1.63,0);reflection.scale.y=-1;reflection.renderOrder=1;
 s.scene.add(human,reflection);s.physicalHuman.visible=false;
 // Remove the superseded surface/reflection, keeping CRT reflection and particles.
 for(const child of s.scene.children)if(child.name==='floor-reflection'&&child.geometry===s.physicalHuman.geometry)child.visible=false;
 const originalUpdate=s.update;
 const sourceDelta=new T.Vector3(),sourceOrigin=new T.Vector3(-2.51,.92,.71),glass=new T.Vector3(.17,.04,0),scratch=new T.Matrix4();
 const worldReference=()=>{referenceWorld.television.updateMatrixWorld();sourceDelta.copy(glass).applyMatrix4(referenceWorld.television.matrixWorld).sub(sourceOrigin);};
 const update=(p,camera)=>{originalUpdate(p,camera);
 // Frame the photographed CRT at hero scale, then open up continuously for causality.
 const opening=1-smooth(.14,.28,p);
 if(opening>0){const center=new T.Vector3(-2.35,.86,.18);const near=center.clone().add(new T.Vector3(.27,.35,3.25-.28*smooth(0,.12,p)));camera.position.lerp(near,opening);const focus=new T.Vector3().addVectors(camera.position,camera.getWorldDirection(new T.Vector3()).multiplyScalar(5));focus.lerp(center,opening);camera.lookAt(focus);camera.updateProjectionMatrix();}
 const hero=smooth(.86,.98,p);
 if(hero>0){const focus=camera.position.clone().add(camera.getWorldDirection(new T.Vector3()).multiplyScalar(8));focus.lerp(new T.Vector3(0,1.62,0),hero);camera.lookAt(focus);camera.fov=T.MathUtils.lerp(camera.fov,27,hero);camera.updateProjectionMatrix();}
 referenceWorld.update(p,camera);worldReference();
 const assembly=s.body.geometry.attributes.assembly;
 for(let i=0;i<s.body.count;i++){const r=assembly.getX(i),delay=assembly.getY(i),sourceFlag=assembly.getZ(i);const fly=smooth(.19+r*.025,.32+r*.03,p);const form=sourceFlag===1?smooth(.55+r*.015,.745+r*.015,p):smooth(.245+delay,.395+delay,p);const w=(1-form)*(1-fly*.6);s.body.getMatrixAt(i,scratch);scratch.elements[12]+=sourceDelta.x*w;scratch.elements[13]+=sourceDelta.y*w;scratch.elements[14]+=sourceDelta.z*w;s.body.setMatrixAt(i,scratch);}
 s.body.instanceMatrix.needsUpdate=true;
 s.cards.forEach((card,i)=>{const flight=smooth(.18+i*.003,.39+i*.004,p),final=smooth(.79+i*.002,.94+i*.002,p);card.position.addScaledVector(sourceDelta,(1-final)*(1-flight*.8));});
 const theta=Math.atan2(camera.position.x-1,camera.position.z);uniforms.angle.value=((theta/(Math.PI*2)*8)%8+8)%8;uniforms.progress.value=p;human.rotation.y=theta;reflection.rotation.y=theta;};
 return {...s,update,ready:Promise.all([s.ready,portraitReady,referenceWorld.ready]),animate:time=>{s.animate(time);referenceWorld.animate(time)},referenceWorld,human,portraitUniforms:uniforms,mode:'photographic-orbit'};
}
