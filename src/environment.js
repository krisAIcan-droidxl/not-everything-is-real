import * as T from 'three';
const noise=i=>{const n=Math.sin(i*127.1+311.7)*43758.5453;return n-Math.floor(n)};
export function createEnvironment(scene,loadTexture){
 const ground=loadTexture('/assets/wet-concrete.webp');ground.wrapS=ground.wrapT=T.RepeatWrapping;ground.repeat.set(12,12);ground.anisotropy=4;
 const floor=new T.Mesh(new T.PlaneGeometry(70,70),new T.MeshStandardMaterial({color:'#596473',map:ground,roughnessMap:ground,bumpMap:ground,bumpScale:.017,roughness:.28,metalness:.35,transparent:true,opacity:.83,depthWrite:false}));
 floor.rotation.x=-Math.PI/2;floor.name='floor';floor.renderOrder=2;scene.add(floor);
 // Shallow, irregular pools carry the CRT spill. No reflection render pass.
 const poolMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:{source:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec2 vUv;void main(){vec2 q=(vUv-.5)*vec2(1.7,1.);float radius=length(q);float ripple=.72+.28*sin(q.x*83.+sin(q.y*47.)*3.);float glow=exp(-radius*radius*13.)*ripple;gl_FragColor=vec4(vec3(.15,.21,.27),glow*.18);}`});
 const spill=new T.Mesh(new T.PlaneGeometry(4.5,7),poolMaterial);spill.rotation.x=-Math.PI/2;spill.position.set(-2.5,.004,2.1);spill.renderOrder=3;scene.add(spill);
 // Fixed atmospheric sheets: photographed light diffusion without post-processing.
 const hazeMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{progress:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec2 vUv;uniform float progress;float hash(vec2 p){return fract(sin(dot(p,vec2(12.9,78.2)))*43758.5);}void main(){vec2 p=vUv-.5;float beam=exp(-pow(p.x*5.+p.y*.55,2.))*(1.-smoothstep(.12,.55,abs(p.y)));float grain=hash(floor(vUv*700.))*.14+.86;float edge=(1.-smoothstep(.25,.5,abs(p.x)));gl_FragColor=vec4(vec3(.21,.29,.39),beam*edge*grain*.095);}`});
 for(const z of [-3,-6]){const m=new T.Mesh(new T.PlaneGeometry(12,8),hazeMaterial);m.position.set(.9,3.2,z);m.name='atmosphere';scene.add(m)}
 const debris=new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshStandardMaterial({color:'#343e49',roughness:.51,metalness:.32}),72),dummy=new T.Object3D();
 for(let i=0;i<72;i++){dummy.position.set((noise(i)-.5)*10,.013,(noise(i+120)-.5)*7);dummy.rotation.set(0,noise(i+3)*7,.03);dummy.scale.set(.025+noise(i+4)*.09,.006+noise(i+8)*.009,.014+noise(i+7)*.05);dummy.updateMatrix();debris.setMatrixAt(i,dummy.matrix)}scene.add(debris);
 const cable=new T.CatmullRomCurve3([new T.Vector3(-2.9,.15,-.8),new T.Vector3(-3.1,.025,-1.1),new T.Vector3(-3.8,.025,-.5),new T.Vector3(-4.1,.025,.7),new T.Vector3(-3.2,.025,1.4)]);
 scene.add(new T.Mesh(new T.TubeGeometry(cable,40,.016,5,false),new T.MeshStandardMaterial({color:'#080a0c',roughness:.75})));
 return {floor,hazeMaterial,debris};
}
