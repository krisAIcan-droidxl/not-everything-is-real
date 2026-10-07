import * as T from 'three';
const noise=i=>{const n=Math.sin(i*127.1+311.7)*43758.5453;return n-Math.floor(n)};
export function createEnvironment(scene,loadTexture){
 const ground=loadTexture('/assets/wet-concrete.webp');ground.wrapS=ground.wrapT=T.RepeatWrapping;ground.repeat.set(12,12);ground.anisotropy=4;
 const floorMaterial=new T.MeshStandardMaterial({color:'#596473',map:ground,roughnessMap:ground,bumpMap:ground,bumpScale:.010,roughness:.42,metalness:.24,transparent:true,opacity:.83,depthWrite:false});
 floorMaterial.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>','diffuseColor.a *= 1.0 - smoothstep(13.0, 28.0, length(vViewPosition));\n#include <opaque_fragment>')};
 const floor=new T.Mesh(new T.PlaneGeometry(70,70),floorMaterial);
 floor.rotation.x=-Math.PI/2;floor.name='floor';floor.renderOrder=2;scene.add(floor);
 // Shallow, irregular pools carry the CRT spill. No reflection render pass.
 const poolMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec2 vUv;float hash(vec2 p){return fract(sin(dot(p,vec2(12.9,78.2)))*43758.5);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}void main(){vec2 q=(vUv-.5)*vec2(1.7,1.);float radius=length(q);float wet=.64+.36*noise(vUv*vec2(18.,24.));float glow=exp(-radius*radius*13.)*wet;gl_FragColor=vec4(vec3(.15,.21,.27),glow*.10);}`});
 const spill=new T.Mesh(new T.PlaneGeometry(4.5,7),poolMaterial);spill.rotation.x=-Math.PI/2;spill.position.set(-2.5,.004,2.1);spill.renderOrder=3;scene.add(spill);
 // Fixed atmospheric sheets: photographed light diffusion without post-processing.
 const hazeMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec2 vUv;float hash(vec2 p){return fract(sin(dot(p,vec2(12.9,78.2)))*43758.5);}void main(){vec2 p=vUv-.5;float beam=exp(-pow(p.x*5.+p.y*.55,2.));float vertical=smoothstep(.02,.34,vUv.y)*(1.-smoothstep(.62,.99,vUv.y));float grain=hash(floor(vUv*700.))*.14+.86;float edge=1.-smoothstep(.25,.5,abs(p.x));gl_FragColor=vec4(vec3(.21,.29,.39),beam*vertical*edge*grain*.10);}`});
 for(const z of [-3,-6]){const m=new T.Mesh(new T.PlaneGeometry(12,7),hazeMaterial);m.position.set(.9,3.55,z);m.name='atmosphere';scene.add(m)}
 const debris=new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshStandardMaterial({color:'#343e49',roughness:.51,metalness:.32}),72),dummy=new T.Object3D();
 for(let i=0;i<72;i++){dummy.position.set((noise(i)-.5)*10,.013,(noise(i+120)-.5)*7);dummy.rotation.set(0,noise(i+3)*7,.03);dummy.scale.set(.025+noise(i+4)*.09,.006+noise(i+8)*.009,.014+noise(i+7)*.05);dummy.updateMatrix();debris.setMatrixAt(i,dummy.matrix)}scene.add(debris);
 const cable=new T.CatmullRomCurve3([new T.Vector3(-2.9,.15,-.8),new T.Vector3(-3.1,.025,-1.1),new T.Vector3(-3.8,.025,-.5),new T.Vector3(-4.1,.025,.7),new T.Vector3(-3.2,.025,1.4)]);
 scene.add(new T.Mesh(new T.TubeGeometry(cable,40,.016,5,false),new T.MeshStandardMaterial({color:'#080a0c',roughness:.75})));
 return {floor,hazeMaterial,debris};
}
