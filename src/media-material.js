import * as T from 'three';

// One photographic atlas shared by all broadcasts. Only UVs/signals animate;
// the scroll-controlled world transforms never depend on elapsed time.
export function broadcastMaterial(atlas,clock,index,progress){
 const tile=index%4;
 return new T.ShaderMaterial({transparent:true,side:T.DoubleSide,depthWrite:false,
  uniforms:{mediaAtlas:atlas,signalClock:clock,gateProgress:progress,opacity:{value:0},tile:{value:tile},seed:{value:index+1}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`varying vec2 vUv;uniform sampler2D mediaAtlas;uniform float signalClock,gateProgress,opacity,tile,seed;
  float hash(float x){return fract(sin(x*127.1)*43758.5453);}
  vec3 sampleMedia(vec2 uv){float upper=1.-floor(tile/2.);vec2 origin=vec2(mod(tile,2.)*.5,upper*.52734375);vec2 size=vec2(.5,mix(.52734375,.47265625,upper));return texture2D(mediaAtlas,origin+clamp(uv,vec2(.006),vec2(.994))*size).rgb;}
  void main(){float frame=floor(signalClock*12.);float fault=step(.96,hash(frame+seed*19.));
   vec2 uv=.5+(vUv-.5)*(.95+.02*sin(signalClock*.7+seed));uv.x+=sin(signalClock*.23+seed)*.012;
   float band=step(.72,hash(floor(vUv.y*24.)+frame+seed));uv.x+=fault*band*.035;
   vec3 c=sampleMedia(uv);c.r=mix(c.r,sampleMedia(uv+vec2(.015,0.)).r,fault);c.b=mix(c.b,sampleMedia(uv-vec2(.015,0.)).b,fault);
   c*=.94+.06*sin(vUv.y*900.);
   float fragmented=smoothstep(.32,.55,gateProgress);
   float center=.2+hash(seed*11.)*.6;
   float streak=exp(-pow((vUv.y-center)*110.,2.))*(1.-smoothstep(.3,.5,abs(vUv.x-.5)));
   float spark=.15+pow(hash(frame+seed*77.),4.)*.85;
   float mask=mix(1.,streak*spark,fragmented);c=mix(c,c*1.65,fragmented);
   gl_FragColor=vec4(c,opacity*(1.-fault*.18)*mask);
   #include <colorspace_fragment>
  }`});
}

// Camera-facing signal filaments: bright cores with soft edges, never solid cubes.
export function signalFilamentMaterial(atlas,clock,progress){
 return new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,
  uniforms:{mediaAtlas:atlas,signalClock:clock,gateProgress:progress},
  vertexShader:`attribute vec3 target;attribute vec3 assembly;varying vec2 vUv;varying vec3 vTarget;varying vec3 vAssembly;
  void main(){vUv=uv;vTarget=target;vAssembly=assembly;
   vec4 center=modelViewMatrix*instanceMatrix*vec4(0.,0.,0.,1.);
   vec2 scale=vec2(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz));
   float angle=(assembly.x-.5)*.55;vec2 offset=position.xy*scale;
   offset=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*offset;
   gl_Position=projectionMatrix*(center+vec4(offset,0.,0.));
  }`,
  fragmentShader:`varying vec2 vUv;varying vec3 vTarget;varying vec3 vAssembly;
  uniform sampler2D mediaAtlas;uniform float signalClock,gateProgress;
  float hash(float x){return fract(sin(x*127.1)*43758.5453);}
  void main(){float seed=vAssembly.x;float tick=floor(signalClock*18.);
   float pulse=pow(hash(tick+seed*417.),7.);vec2 q=vUv*2.-1.;
   float zigzag=(step(-.45,q.x)-step(.05,q.x))*mix(-.16,.16,step(.5,seed));
   float core=exp(-pow((q.y-zigzag)*11.,2.));float halo=exp(-pow((q.y-zigzag)*3.,2.))*.14;
   float tip=1.-smoothstep(.55,1.,abs(q.x));
   float cell=floor(seed*4.);float upper=1.-floor(cell/2.);vec2 origin=vec2(mod(cell,2.)*.5,upper*.52734375);
   vec2 imageUV=fract(vec2(vTarget.y*1.8+seed,vTarget.x*2.3+seed));
   vec3 source=texture2D(mediaAtlas,origin+(imageUV*.976+.012)*vec2(.5,mix(.52734375,.47265625,upper))).rgb;
   vec3 color=mix(source,vec3(.75,.86,.95),.22+seed*.12);
   float energy=.055+pulse*1.25;float alpha=(core+halo)*tip*energy;
   gl_FragColor=vec4(color*(.8+pulse*1.8),alpha);
   #include <colorspace_fragment>
  }`});
}
