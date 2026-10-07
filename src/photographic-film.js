import * as T from 'three';
import {smooth} from './sequence.js';
const random=i=>{const n=Math.sin(i*127.1+311.7)*43758.5453;return n-Math.floor(n)};
// The two approved photographs are the visible scene throughout. No procedural
// human or CRT appears behind them. This is a photographic 2.5D film, not a 180° model orbit.
export function createPhotographicFilm(){
 const scene=new T.Scene();scene.background=new T.Color('#000000');
 const progress={value:0},clock={value:0},aspect={value:1.6},live={value:0},atlas={value:null};
 let resolve;const ready=new Promise(r=>resolve=r);
 if(typeof window==='undefined'){atlas.value=new T.DataTexture(new Uint8Array([0,0,0,255]),1,1);resolve()}
 else{scene.visible=false;atlas.value=new T.TextureLoader().load('/assets/approved-gate02-frames.jpg',()=>{scene.visible=true;resolve()});atlas.value.colorSpace=T.SRGBColorSpace;atlas.value.anisotropy=8;}
 const material=new T.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{atlas,progress,clock,aspect,live},
 vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
 fragmentShader:`varying vec2 vUv;uniform sampler2D atlas;uniform float progress,clock,aspect,live;
 float ease(float a,float b,float x){float t=clamp((x-a)/(b-a),0.,1.);return t*t*t*(t*(t*6.-15.)+10.);}
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 vec3 photo(vec2 uv,float end){float x=mix(0.,650./1536.,end);float width=mix(645./1536.,886./1536.,end);return texture2D(atlas,vec2(x+uv.x*width,uv.y)).rgb;}
 float inside(vec2 u){return step(0.,u.x)*step(u.x,1.)*step(0.,u.y)*step(u.y,1.);}
 vec2 fitted(vec2 screen,float ratio,float offset,float zoom){vec2 extent=vec2(min(1.,ratio/aspect),min(1.,aspect/ratio));return (screen-.5-vec2(offset,0.))/(extent*zoom)+.5;}
 void main(){float p=progress;float open=ease(.025,.28,p);float settle=ease(.80,1.,p);
  // Slow photographic dolly, then a shared TV/person composition; no viewport-model motion.
  float televisionOffset=-.19*open*(1.-settle);
  float personOffset=.13*ease(.26,.48,p)*(1.-settle);
  vec2 a=fitted(vUv,645./864.,televisionOffset,1.+.075*sin(p*3.14159265));
  vec2 b=fitted(vUv,886./864.,personOffset,1.+.028*sin(p*3.14159265));
  vec3 start=photo(clamp(a,0.,1.),0.)*inside(a),end=photo(clamp(b,0.,1.),1.)*inside(b);
  float room=ease(.24,.82,p);
  // Keep the original wet room throughout, with its deep shadows and backlight.
  vec3 background=start;
  float tvMask=ease(.17,.22,a.x)*(1.-ease(.74,.79,a.x))*ease(.25,.30,a.y)*(1.-ease(.65,.70,a.y));
  background*=1.-open*.98*(1.-tvMask);
  background*=1.-ease(.74,.94,p);
  // Body is constructed cell by cell from feet to head, never a whole-person fade.
  vec2 cell=floor(b*vec2(170.,240.));float arrival=.30+clamp(b.y,0.,1.)*.40+hash(cell)*.045;
  float formed=ease(arrival,arrival+.035,p);
  float subject=ease(.30,.37,b.x)*ease(.015,.055,b.y)*(1.-ease(.97,1.,b.y))*inside(b);
  background=mix(background,end,subject*formed);
  // Titles, frame marks and final composition are the exact original photograph.
  float finish=ease(.84,.995,p);background=mix(background,end,finish);
  // Live CRT snow is local to the photographed glass, restrained, absent in exact endpoints.
  float glass=ease(.385,.405,a.x)*(1.-ease(.67,.69,a.x))*ease(.365,.385,a.y)*(1.-ease(.585,.605,a.y));
  float noise=hash(floor(a*vec2(520.,390.))+floor(clock*30.));
  float snow=mix(sin(p*3.14159265),1.,live)*glass*(1.-finish);
  background+=vec3(.11,.13,.14)*(noise-.35)*snow;
  float flicker=step(.965,hash(vec2(floor(b.y*130.),floor(clock*16.))))*ease(.55,.72,b.x)*inside(b)*finish*live;
  background+=end*vec3(.11,.07,.10)*flicker;
  gl_FragColor=vec4(max(background,vec3(0.)),1.);
  #include <colorspace_fragment>
 }`});
 const plate=new T.Mesh(new T.PlaneGeometry(2,2),material);plate.frustumCulled=false;plate.renderOrder=0;scene.add(plate);
 const geometry=new T.PlaneGeometry(.045,.007),seeds=new Float32Array(320);
 for(let i=0;i<seeds.length;i++)seeds[i]=random(i+1);
 geometry.setAttribute('seed',new T.InstancedBufferAttribute(seeds,1));
 const filamentMaterial=new T.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,blending:T.AdditiveBlending,uniforms:{atlas,progress,clock},
 vertexShader:`attribute float seed;varying vec2 vUv;varying float vSeed;void main(){vUv=uv;vSeed=seed;gl_Position=instanceMatrix*vec4(position,1.);}`,
 fragmentShader:`varying vec2 vUv;varying float vSeed;uniform sampler2D atlas;uniform float progress,clock;
 float hash(float x){return fract(sin(x*127.1)*43758.5453);}
 void main(){vec2 q=vUv*2.-1.;float core=exp(-pow(q.y*6.,2.))*(1.-smoothstep(.55,1.,abs(q.x)));
  float pulse=.06+pow(hash(floor(clock*18.)+vSeed*417.),6.);
  // Sample only photographed media on the dissolved side of the approved end panel.
  vec2 uv=vec2((650.+886.*(.60+vSeed*.37))/1536.,.10+hash(vSeed*17.)*.80);
  vec3 color=mix(texture2D(atlas,uv).rgb,vec3(.53,.65,.79),.25);
  gl_FragColor=vec4(color*(1.+pulse*2.),core*pulse);
  #include <colorspace_fragment>
 }`});
 const stream=new T.InstancedMesh(geometry,filamentMaterial,seeds.length);stream.frustumCulled=false;stream.renderOrder=1;scene.add(stream);
 const dummy=new T.Object3D();
 function update(p,camera){progress.value=p;clock.value=p*12;live.value=0;aspect.value=camera.aspect;
  camera.position.set(0,0,1);camera.lookAt(0,0,0);camera.updateProjectionMatrix();
  const open=smooth(.025,.28,p),settle=smooth(.80,1.,p);
  const bWidth=Math.min(1,(886/864)/camera.aspect);
  const originX=-.38*open*(1-settle),destinationX=.26*smooth(.26,.48,p)*(1-settle)+.13*bWidth;
  const alive=smooth(.14,.24,p)*(1-smooth(.82,.995,p));
  for(let i=0;i<seeds.length;i++){const r=seeds[i],travel=smooth(.17+r*.13,.44+r*.14,p),rise=random(i+17);
   const t=travel*(.13+r*.85);dummy.position.set(T.MathUtils.lerp(originX,destinationX,t),T.MathUtils.lerp(-.02,-.72+rise*1.45,t)+Math.sin(t*Math.PI)*.10,(0));
   dummy.position.x+=(random(i+22)-.5)*.055*(1-t);dummy.position.y+=(random(i+23)-.5)*.12*(1-t);
   const organized=smooth(.42+rise*.20,.61+rise*.20,p);
   const visibility=alive*(1-organized);dummy.scale.set(visibility*(.6+r*2.),visibility*(.65+r*.3),1);dummy.rotation.set(0,0,(r-.5)*.3);dummy.updateMatrix();stream.setMatrixAt(i,dummy.matrix);
  }stream.instanceMatrix.needsUpdate=true;
 }
 return {scene,ready,update,animate:time=>{clock.value=time;live.value=1},progress,clock,aspect,stream,plate,mode:'photographic'};
}
