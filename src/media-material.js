import * as T from 'three';

// One photographic atlas shared by all broadcasts. Only UVs/signals animate;
// the scroll-controlled world transforms never depend on elapsed time.
export function broadcastMaterial(atlas,clock,index){
 const tile=index%4;
 return new T.ShaderMaterial({transparent:true,side:T.DoubleSide,depthWrite:false,
  uniforms:{mediaAtlas:atlas,signalClock:clock,opacity:{value:0},tile:{value:tile},seed:{value:index+1}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`varying vec2 vUv;uniform sampler2D mediaAtlas;uniform float signalClock,opacity,tile,seed;
  float hash(float x){return fract(sin(x*127.1)*43758.5453);}
  vec3 sampleMedia(vec2 uv){float upper=1.-floor(tile/2.);vec2 origin=vec2(mod(tile,2.)*.5,upper*.52734375);vec2 size=vec2(.5,mix(.52734375,.47265625,upper));return texture2D(mediaAtlas,origin+clamp(uv,vec2(.006),vec2(.994))*size).rgb;}
  void main(){float frame=floor(signalClock*12.);float fault=step(.96,hash(frame+seed*19.));
   vec2 uv=.5+(vUv-.5)*(.95+.02*sin(signalClock*.7+seed));uv.x+=sin(signalClock*.23+seed)*.012;
   float band=step(.72,hash(floor(vUv.y*24.)+frame+seed));uv.x+=fault*band*.035;
   vec3 c=sampleMedia(uv);c.r=mix(c.r,sampleMedia(uv+vec2(.015,0.)).r,fault);c.b=mix(c.b,sampleMedia(uv-vec2(.015,0.)).b,fault);
   c*=.94+.06*sin(vUv.y*900.);gl_FragColor=vec4(c,opacity*(1.-fault*.18));
   #include <colorspace_fragment>
  }`});
}
