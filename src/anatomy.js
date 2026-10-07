import {Vector3} from 'three';

// Dimensions in scene units; 3.36 high, approximately 7.7 heads tall.
// Torso cross-sections and tapered, articulated limbs form one connected surface.
const torso=[
 [1.72,.155,.135,.015],[1.84,.295,.190,-.025],
 [1.98,.315,.205,-.020],[2.13,.245,.145,.015],
 [2.30,.285,.170,.012],[2.48,.355,.205,.010],
 [2.63,.385,.175,-.010],[2.72,.335,.125,-.015],
 [2.81,.125,.095,-.005],[2.96,.092,.085,.015],
];
const head=[
 [2.94,.068,.075,.040],[2.99,.110,.112,.034],
 [3.06,.135,.139,.019],[3.16,.164,.163,-.001],
 [3.25,.163,.154,-.007],[3.32,.125,.123,-.011],
 [3.36,.025,.030,-.009],
];
const muscles=[0,.16,.38,.67,.86,1];
const limbProfile=[.74,.96,1,.88,.75,.70];
const lerp=(a,b,t)=>a+(b-a)*t;
function sectionDistance(x,y,z,sections){
 if(y<sections[0][0]||y>sections.at(-1)[0])return 1;
 let i=0;while(i<sections.length-2&&y>sections[i+1][0])i++;
 const a=sections[i],b=sections[i+1],t=(y-a[0])/(b[0]-a[0]);
 const rx=lerp(a[1],b[1],t),rz=lerp(a[2],b[2],t),cz=lerp(a[3],b[3],t);
 return (Math.hypot(x/rx,(z-cz)/rz)-1)*Math.min(rx,rz);
}
const limbs=[];
function limb(a,b,r0,r1,depth=1){
 const av=new Vector3(...a),bv=new Vector3(...b),axis=bv.clone().sub(av),length=axis.length();axis.divideScalar(length);
 const side=new Vector3(1,0,0).addScaledVector(axis,-axis.x).normalize();
 const front=new Vector3().crossVectors(side,axis).normalize();
 limbs.push({a:av,b:bv,axis,length,side,front,r0,r1,depth});
}
for(const sign of [-1,1]){
 // Shoulders sit on the ribcage; elbows, wrists and hands carry a slight natural bend.
 limb([sign*.35,2.68,0],[sign*.48,2.47,.008],.137,.116,.93);
 limb([sign*.43,2.59,.005],[sign*.535,2.13,-.028],.117,.082,1.04);
 limb([sign*.535,2.13,-.028],[sign*.55,1.70,.065],.085,.048,.91);
 limb([sign*.55,1.73,.065],[sign*.565,1.49,.084],.063,.049,.52);
 for(let finger=0;finger<4;finger++){
  const x=sign*(.531+finger*.021);
  limb([x,1.53,.086],[x+sign*.005,1.38+Math.abs(finger-1.5)*.016,.10],.014,.011,.80);
 }
 limb([sign*.515,1.62,.09],[sign*.495,1.50,.13],.023,.015,.78);
 // Femur and tibia proportions; knees and ankles join without hourglass gaps.
 limb([sign*.175,1.87,.005],[sign*.205,1.00,.055],.151,.097,1.10);
 limb([sign*.205,1.04,.055],[sign*.205,.90,.042],.096,.089,1.07);
 limb([sign*.205,.93,.032],[sign*.215,.20,.009],.100,.048,1.18);
 limb([sign*.215,.24,.009],[sign*.215,.105,.044],.050,.052,.95);
 // Heel, midfoot and toes are distinct from the lower leg in side view.
 limb([sign*.215,.095,-.065],[sign*.215,.082,.22],.078,.066,.84);
}
const ellipsoids=[
 [[0,3.115,.170],[.030,.064,.044]], // nose, never a portrait requirement
 [[0,2.989,.123],[.070,.029,.031]], // chin
 [[-.167,3.145,.0],[.023,.052,.023]],[[.167,3.145,.0],[.023,.052,.023]],
];
function distance(x,y,z){
 let d=Math.min(sectionDistance(x,y,z,torso),sectionDistance(x,y,z,head));
 for(const l of limbs){
  const dx=x-l.a.x,dy=y-l.a.y,dz=z-l.a.z;
  const along=dx*l.axis.x+dy*l.axis.y+dz*l.axis.z;
  const t=Math.max(0,Math.min(1,along/l.length));
  let j=0;while(j<muscles.length-2&&t>muscles[j+1])j++;
  const bulge=lerp(limbProfile[j],limbProfile[j+1],(t-muscles[j])/(muscles[j+1]-muscles[j]));
  const r=lerp(l.r0,l.r1,t)*bulge;
  const side=dx*l.side.x+dy*l.side.y+dz*l.side.z;
  const front=dx*l.front.x+dy*l.front.y+dz*l.front.z;
  const cap=along<0?-along:along>l.length?along-l.length:0;
  d=Math.min(d,(Math.sqrt((side/r)**2+(front/(r*l.depth))**2+(cap/r)**2)-1)*r);
 }
 for(const [c,r] of ellipsoids)d=Math.min(d,(Math.sqrt(((x-c[0])/r[0])**2+((y-c[1])/r[1])**2+((z-c[2])/r[2])**2)-1)*Math.min(...r));
 return d;
}
export const BODY_STEP=.030;
export function humanTargets(){
 const points=[];
 for(let yi=0;yi<=113;yi++)for(let xi=-21;xi<=21;xi++)for(let zi=-10;zi<=12;zi++){
  const x=xi*BODY_STEP,y=yi*BODY_STEP,z=zi*BODY_STEP;
  const d=distance(x,y,z);
  // Sample the UNION boundary, avoiding the internal shells of overlapping volumes.
  if(d<=.003&&d>=-BODY_STEP*.95)points.push(new Vector3(x+1,y,z));
 }
 return points;
}
