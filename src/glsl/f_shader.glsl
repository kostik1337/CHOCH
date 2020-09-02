uniform float t;
uniform vec2 res;
uniform vec2 pos;
uniform vec2 speed;
// cam.xy = cam position, cam.zw - cam zoom
uniform vec4 cam;
// death factor
uniform float df;
// checkpoint factor
uniform float cf;

const float playerSize = 0.03;
// room size
const vec2 csize = vec2(1., 2.5);

#define PI 3.14159265
#define LAYERS 1.0

float hash(float x) {return fract(sin(x)*31345.23);}
float hash2(vec2 x) {return hash(dot(x, vec2(43.123, 32.12345)));}

float linNoise(float x) {
  return mix(hash(floor(x)), hash(floor(x)+1.), fract(x));
}

// copied from iq's sdf functions
mat2 mr(float a) {float s=sin(a),c=cos(a);return mat2(c,s,-s,c);}

float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p)-b;
  return length(max(d,0.0)) + min(max(d.x,d.y),0.0);
}

float sdCircle(vec2 p, float r) {return length(p)-r;}

float sdCross(vec2 p, vec2 size) {
  return min(
      sdBox(p, size),
      sdBox(p, size.yx)
  );
}

struct MapValue {
  float solid; // solid < 0 - point is solid (distance to closest solid)
  float deadly; // deadly and checkpoint work the same way
  float deadlyFactor; // > 0.5 - deadly zone on, < .5 - off
  float checkpoint;
  int checkpointId; // id of checkpoint, if checkpoint in current point
};

#define INF 1e10

vec2 roomTest(vec2 p) {
  vec2 pdead = p - vec2(-0.3, -0.4);
  pdead *= mr(t);
  float deadly = sdCross(pdead, vec2(0.05, 0.45));

  pdead = p - vec2(0.3, 0.1);
  pdead *= mr(-t+PI/4.);
  deadly = min(deadly, sdCross(pdead, vec2(0.05, 0.45)));

  pdead = p - vec2(-0.3, 0.7);
  pdead *= mr(t+PI/8.);
  deadly = min(deadly, sdCross(pdead, vec2(0.05, 0.45)));

  return vec2(INF, deadly);
}

float fPeakFn(float t, float q) {
  return smoothstep(1.-q,1.,abs(2.*(fract(t)-.5)));
}

// vec2 roomLasers(vec2 p) {
//   float scale = .4;
//   vec2 axes[] = vec2[](vec2(0., 1.), axis45, axis45N);
//   float deadly = INF;
//   for(int i=0;i<3;++i) {
//     float pdot = dot(p, axes[i]);
//     float pyfr = mod(pdot + t/32., scale) - scale/2.;
//     deadly = min(deadly, abs(pyfr)-scale/32. * (fPeakFn(t*.5+3.*pdot+i/3., .5)-.5));
//   }
//   return vec2(INF, deadly);
// }

vec2 roomSines1(vec2 p) {
  float mult = 10.;
  //p = vec2(length(p), atan(p.y, p.x));
  float dead = sin(p.x*mult) * sin(p.y*mult) + .7*sin(2.*t + 5.*p.y + 10.*p.x) + .5;
  return vec2(INF, dead/mult);
}

vec2 roomSines2(vec2 p) {
  float mult = 10.;
  //p = vec2(length(p), atan(p.y, p.x));
  float dead = sin(p.x*mult) * sin(p.y*mult) + .7*sin(2.*t + 5.*p.y + sin(10.*p.x + .3*t)) + .8;
  return vec2(INF, dead/mult);
}

float sawtooth(float t) {
  return 2.*(fract(t)-.5);
}

float asawtooth(float t) {return abs(sawtooth(t));}

vec2 roomPolar1(vec2 p) {
  p = vec2(length(p), atan(p.y, p.x));
  float l = p.x*3.-t/2.;
  float rotDirection = mod(floor(l),2.) == 0. ? -1. : 1.;
  float holes = (asawtooth(p.y/PI*3. - t/4. * rotDirection)-.7)*p.x;
  float deadly = max((asawtooth(l) - .2), holes);
  return vec2(INF, deadly);
}

vec2 mixCheckpoint(vec2 checkpoint, vec2 new, ivec2 room, ivec2 inRoom) {
  return mix(checkpoint, 
    mix(checkpoint, new, step(new.x, checkpoint.x)),
    all(equal(room, inRoom)) ? 1. : 0.
  );
}

#define Y_ROOM 1

MapValue map(vec2 p) {
  vec2 op = p;
  float row = floor(p.y/csize.y);
  //p.x += (hash(row)-.5)*1.;
  ivec2 cid = ivec2(floor(p/csize));
  vec2 p1 = mod(p, csize) - csize/2.;
  MapValue val;
  //col = vec3(cid.x/10., cid.y/2., p1.y/csize.y);
  
  bool isRoom = true;
  // room.x - solids (additional to room bounds), room.y - deadly objects, room.z - deadly factor
  vec3 room = vec3(INF, INF, 1.);
  if (cid.x == 0 && cid.y == 0) {
    room.xy = roomTest(p1);
  } else if (cid.x == 0 && cid.y == 1) {
    room.xy = roomPolar1(p1);
  } else {
    isRoom = false;
  }
  
  MapValue v = MapValue(-INF, room.y, room.z, INF, 0);
  if(isRoom) {
    float roomBox = sdBox(p1, csize/2.2);
    v.solid = min(-roomBox, room.x);
  }

  // draw infinite corridor for now
  v.solid = max(v.solid, .1-abs(p.x-.5));
  
  // checkpoints
  vec2 checkpoint = vec2(INF, 0.);
  checkpoint = mixCheckpoint(checkpoint,vec2(sdBox(p - vec2(.8, 2.2), vec2(0.1)), 0.), cid, ivec2(0));
  v.checkpoint = checkpoint.x;
  v.checkpointId = int(checkpoint.y);
  
  return v;
}

vec2 normal(vec2 p) {
    vec2 E=vec2(0.001, 0.);
    float m = map(p).solid;
    return normalize(vec2(
        map(p+E.xy).solid - m,
        map(p+E.yx).solid - m
    ));
}

float drawLaserBounds(float p, float strength) {
  return pow(0.001 * strength / abs(p), 2.);
}

vec3 renderLayer(vec2 uv) {
  MapValue m = map(uv);
  vec3 c = vec3(0.);
  if(m.solid > 0.) {
    vec3 checkpointColor = vec3(0.1, 1., 0.1);
    c += drawLaserBounds(m.checkpoint, 3.) * checkpointColor;
    if (m.checkpoint < 0.) {
      c += checkpointColor/10.;
    }
    else {
      vec3 deadlyColor = mix(vec3(.1,.1,.1), vec3(1.,.1,.1), vec3(step(.5, m.deadlyFactor)));
      c += drawLaserBounds(m.deadly, 3.) * deadlyColor;
      if (m.deadly < 0.) c += deadlyColor/10.;
    }
  }
  // if (m.solidDisplay > 0.) {
  //   c += m.solidDisplay;
  // }
  c += drawLaserBounds(m.solid, 2.);
  //if (m.solid < 0.) c += m.solidDisplay;
  return c;
}

float sdSegment( in vec2 p, in vec2 a, in vec2 b ) {
    vec2 pa = p-a, ba = b-a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    return length( pa - ba*h );
}

float sdPosCircle(vec2 p, float r) {
  return max(0., length(p)-r);
}

float renderSpider(vec2 uv) {
  float radius = playerSize;
  float c = 0.;

  uv -= pos;
  float spiderAngle = atan(speed.y, speed.x);

  // draw body
  float bodyRadius = radius / 3.;
  vec2 uvBody = uv - vec2(0., (sin(4.*t)+1.) * radius / 16. + radius / 3.);
  c += pow(radius/100. / sdPosCircle(uvBody, bodyRadius), 2.);

  // draw legs
  vec2 spiderDirUp = vec2(cos(spiderAngle), sin(spiderAngle));
  for(float i=0.; i<8.; ++i) {
    float ang = mix(-PI/4., PI/4., mod(i, 4.)/3.) + step(4., i) * PI - PI/2. + spiderAngle;
    vec2 legOffset = 0.9*radius*vec2(cos(ang), sin(ang));
    legOffset += radius * 0.1 *spiderDirUp * sin(20.*t + (mod(i,2.)==0. ? PI: 0.)) * length(speed);
    // legs ends (circles)
    //c += pow(radius/100. / sdPosCircle(uv + legOffset, radius/16.), 2.);

    // legs sticks
    vec2 uvSeg = uv;
    float r = clamp(0., 1., length(uv) / radius);
    uvSeg.y -= 0.01*(r-r*r);
    //uvSeg += (vec2(linNoise(r*10.-10.*t), linNoise(r*10.+15.-15.*t))-.5) * radius * 0.1;
    //c += pow(radius/200. / sdSegment(uvSeg, uv-uvBody, -legOffset), 1.2);

    c += drawLaserBounds(sdSegment(uvSeg, uv-uvBody, -legOffset), r*2.);
  }
  c = min(1., c);

  // draw eyes
  uvBody *= mr(spiderAngle);
  uvBody.y = abs(uvBody.y);
  c -= pow(radius/100. / sdPosCircle(uvBody -
    vec2(1.,0.) * bodyRadius * 0.7 -
    vec2(0.,1.) * bodyRadius * 0.3, radius / 40.), 2.);

  return c;
}

vec3 renderAll(vec2 uv) {
  vec3 c = vec3(0.);
  for (float i = 0.; i<LAYERS; ++i) {
    vec2 uv1 = uv * (1.0-i/LAYERS*0.1) - vec2(0., i/LAYERS*0.1);
      //+ vec2(hash2(uv+i+t)-.5, hash2(1.3*uv+i+1.4*t)-.5)*0.01;
    uv1 = uv1 / cam.zw + cam.xy; // zoom

    c += renderLayer(uv1) / LAYERS;
    if (i ==0.) {
      // debug collider
      //c = mix(c, vec3(0.,0.,0.1), step(length(uv1 - pos), playerSize));
      c += renderSpider(uv1);
    }
  }
  return c;
}

void main() {
    // pixel 1 - collision check + normal
    if (gl_FragCoord.x < 1. && gl_FragCoord.y < 1.) {
        float solid = map(pos).solid;
        gl_FragColor = vec4(solid < playerSize ? vec3(1., 0.5*(normal(pos)+1.)) : vec3(0.), 1.);
    } else
    // pixel 2 - death check
    if (gl_FragCoord.x < 2. && gl_FragCoord.y < 1.) {
        gl_FragColor = vec4(vec3(map(pos).deadly < playerSize/2. ? 1. : 0.), 1.);
    } else
    // pixel 3 - checkpoint check
    if (gl_FragCoord.x < 3. && gl_FragCoord.y < 1.) {
        MapValue m = map(pos);
        gl_FragColor = vec4(m.checkpoint < 0. ? vec3(1., float(m.checkpointId)/255., 0.) : vec3(0.), 1.);
    } else {
        vec2 uv = 2. * gl_FragCoord.xy / res - 1.;
        uv.x *= res.x / res.y;

        float aberrationSize = 0.01;
        vec3 c = vec3(
          renderAll(uv-vec2(aberrationSize,0.)).r,
          renderAll(uv).g,
          renderAll(uv+vec2(aberrationSize,0.)).b
        );

        gl_FragColor = vec4(sqrt(c)+vec3(df,cf,0.), 1.0);
    }
}