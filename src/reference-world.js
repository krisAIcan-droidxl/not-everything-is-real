import * as T from 'three';
// Original photograph is the single source for the room, wet floor and CRT.
// No endpoint replacement: these meshes remain in the world for the entire film.
export function createReferenceWorld(scene){
 let resolve;const ready=new Promise(r=>resolve=r);
 const photo=typeof window==='undefined'?new T.DataTexture(new Uint8Array([0,0,0,255]),1,1):new T.TextureLoader().load('/assets/approved-gate02-frames.jpg',resolve);
 if(typeof window==='undefined')resolve();photo.colorSpace=T.SRGBColorSpace;photo.anisotropy=8;
 const aspect={value:1.6},clock={value:0},progress={value:0};
 const sample='vec3 original(vec2 uv){return texture2D(photo,vec2(uv.x*645./1536.,uv.y)).rgb;}';
 const background=new T.Mesh(new T.PlaneGeometry(2,2),new T.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{photo:{value:photo},aspect},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,.9999,1.);}',fragmentShader:`
 varying vec2 vUv;uniform sampler2D photo;uniform float aspect;${sample}
 void main(){float ratio=645./864.;vec2 span=vec2(min(1.,aspect/ratio),min(1.,ratio/aspect));vec2 uv=vec2(.5,.43)+(vUv-.5)*span;
 vec3 color=original(uv);
 // Reuse the photographed unoccupied upper room behind the separate CRT layer.
 float aperture=smoothstep(.13,.22,uv.x)*(1.-smoothstep(.74,.84,uv.x))*smoothstep(.21,.29,uv.y)*(1.-smoothstep(.63,.72,uv.y));
 vec3 room=original(vec2(.5+(uv.x-.5)*.40,.67+(uv.y-.265)*.65))*.65;
 color=mix(color,room,aperture);
 // Printed corner marks/loading belong to the UI, not the physical room.
 color*=smoothstep(.02,.08,uv.x)*(1.-smoothstep(.94,.99,uv.x));
 gl_FragColor=vec4(color,1.);
 #include <colorspace_fragment>
 }`}));background.frustumCulled=false;background.renderOrder=-100;
 const television=new T.Mesh(new T.PlaneGeometry(1.88,1.63),new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{photo:{value:photo},clock,progress},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`
 varying vec2 vUv;uniform sampler2D photo;uniform float clock;uniform float progress;${sample}
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float edge(vec2 a,vec2 b,vec2 p){vec2 d=b-a;return (d.x*(p.y-a.y)-d.y*(p.x-a.x))/length(d);}
 void main(){vec2 uv=vec2((140.+vUv.x*340.)/645.,(254.+vUv.y*290.)/864.);
 // Outline of the deep physical casing in the original photo; preserve its pixels.
 vec2 p=vec2(140.+vUv.x*340.,610.-vUv.y*290.);
 float d=min(min(edge(vec2(148.,388.),vec2(211.,320.),p),edge(vec2(211.,320.),vec2(469.,334.),p)),min(edge(vec2(469.,334.),vec2(475.,568.),p),edge(vec2(475.,568.),vec2(181.,610.),p)));
 d=min(d,min(edge(vec2(181.,610.),vec2(148.,578.),p),edge(vec2(148.,578.),vec2(148.,388.),p)));
 float alpha=smoothstep(-1.,1.,d);if(alpha<.005)discard;
 vec3 color=original(uv);
 float glass=smoothstep(.386,.404,uv.x)*(1.-smoothstep(.67,.687,uv.x))*smoothstep(.365,.381,uv.y)*(1.-smoothstep(.59,.606,uv.y));
 float snow=hash(floor(uv*vec2(540.,390.))+floor(clock*30.));
 float fault=step(.95,hash(vec2(floor(clock*19.),floor(uv.y*155.))));
 color+=glass*(vec3(.13,.15,.18)*(snow-.30)+fault*vec3(.15,.045,.08)*smoothstep(.1,.3,progress));
 gl_FragColor=vec4(max(color,vec3(0.)),alpha);
 #include <colorspace_fragment>
 }`}));television.position.set(-2.35,.86,.18);television.name='original-photographic-crt';television.renderOrder=3;television.frustumCulled=false;
 scene.add(background,television);
 return {ready,background,television,aspect,clock,progress,update:(p,camera)=>{aspect.value=camera.aspect;clock.value=p*12;progress.value=p;television.rotation.y=Math.atan2(camera.position.x-television.position.x,camera.position.z-television.position.z);},animate:time=>{clock.value=time}};
}
