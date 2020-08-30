uniform float t;
uniform vec2 res;
uniform vec2 pos;
uniform vec2 speed;
uniform vec2 cam;
// death factor
uniform float df;
// checkpoint factor
uniform float cf;

const float playerSize = 0.03;
const vec2 cameraZoom = vec2(3., 2.5);

#define PI 3.14159265

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
  float solidDisplay;
  float deadly; // deadly and checkpoint work the same way
  float checkpoint;
  int checkpointId; // id of checkpoint, if checkpoint in current point
};

const vec2 csize = vec2(1., 2.5);

MapValue room1(vec2 p) {
  vec2 pdead = p - vec2(-0.3, -0.4);
  pdead *= mr(t);
  float deadly = sdCross(pdead, vec2(0.05, 0.45));

  pdead = p - vec2(0.3, 0.1);
  pdead *= mr(-t+PI/4.);
  deadly = min(deadly, sdCross(pdead, vec2(0.05, 0.45)));

  pdead = p - vec2(-0.3, 0.7);
  pdead *= mr(t+PI/8.);
  deadly = min(deadly, sdCross(pdead, vec2(0.05, 0.45)));

  float checkpoint = sdBox(p-vec2(0.,1.), vec2(csize.x, 0.1));
  return MapValue(0., 0., deadly, checkpoint, 255);
}

float roomBox(vec2 p) {
  vec2 boxSize = csize/2.1;
  return sdBox(p, boxSize);
}

MapValue map(vec2 p) {
  vec2 op = p;
  float row = floor(p.y/csize.y);
  p.x += hash(row)*1.;
  ivec2 cid = ivec2(floor(p/csize));
  vec2 p1 = mod(p, csize) - csize/2.;
  MapValue val;
  //col = vec3(cid.x/10., cid.y/2., p1.y/csize.y);
  
  MapValue v;
  bool isRoom = true;
  if (cid.x == 0) {
    v = room1(p1);
  } else {
    isRoom = false;
    v = MapValue(-1., -1., 1., 1., 0);
  }
  

  float rb;
  vec2 axis1 = vec2(1./sqrt(2.)), axis2 = axis1.yx*vec2(1.,-1.);
//  float mix = 
  if(isRoom) {
    v.solid = -roomBox(p1);
    // p.y += t*.2;
    // p1 += axis1 * (hash(floor(dot(p, axis2)*5.)) - .5)*.05;
    // p.y -= t*.2;
    // p1 += axis2 * (hash(floor(dot(p, axis1)*3.)) - .5)*.07;
    rb = roomBox(p1);
  } else {
    rb = 1.;
  }
  v.solidDisplay = step(0., rb) * 
    mix(0.3, 0.7, linNoise(floor(dot(op+vec2(.1*t, 0.),axis1)*5.) + t/3.)) *
    mix(0.5, 1., linNoise(floor(dot(op,axis2)*3.) + t/4.3));
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

vec3 renderLayer(vec2 uv) {
  MapValue m = map(uv);
  vec3 c = vec3(0.);
  if(m.solid > 0.) {
    c += pow(0.003 / abs(m.checkpoint), 2.) * vec3(0.1, 1., 0.1);
    if (m.checkpoint < 0.) {
      c += vec3(0., 0.1,0.);
    }
    else {
      c += pow(0.003 / abs(m.deadly), 2.) * vec3(1., 0.1,0.1);
      if (m.deadly < 0.) c += vec3(.1, 0.,0.);
    }
  }
  // if (m.solidDisplay > 0.) {
  //   c += m.solidDisplay;
  // }
  c += pow(0.002 / abs(m.solid), 4.);
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
  vec2 uvBody = uv - vec2(0., radius / 4.);
  c += pow(radius/100. / sdPosCircle(uvBody, bodyRadius), 2.);

  // draw legs
  vec2 spiderDirUp = vec2(cos(spiderAngle), sin(spiderAngle));
  for(float i=0.; i<8.; ++i) {
    float ang = mix(-PI/4., PI/4., mod(i, 4.)/3.) + step(4., i) * PI - PI/2. + spiderAngle;
    vec2 legOffset = 0.9*radius*vec2(cos(ang), sin(ang));
    legOffset += radius * 0.1 *spiderDirUp * sin(20.*t + (mod(i,2.)==0. ? PI: 0.)) * length(speed);
    // legs ends (circles)
    c += pow(radius/100. / sdPosCircle(uv + legOffset, radius/16.), 2.);

    // legs distorted sticks
    vec2 uvSeg = uv;
    float r = length(uv) / bodyRadius;
    uvSeg += (vec2(linNoise(r*10.-t), linNoise(r*10.+15.-t))-.5) * radius * 0.05;
    c += pow(radius/200. / sdSegment(uvSeg, uv-uvBody, -legOffset), 1.);
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

#define LAYERS 6.0

vec3 renderAll(vec2 uv) {
  vec3 c = vec3(0.);
  for (float i = 0.; i<LAYERS; ++i) {
    vec2 uv1 = uv * (1.0-i/LAYERS*0.1) - vec2(0., i/LAYERS*0.1) +
      vec2(hash2(uv+i+t)-.5, hash2(1.3*uv+i+1.4*t)-.5)*0.001;
    uv1 = uv1 / cameraZoom + cam; // zoom

    c += renderLayer(uv1) / LAYERS;
    // c += vec3(
    //   renderLayer(uv1-vec2(aberrationSize,0.)).r,
    //   renderLayer(uv1).g,
    //   renderLayer(uv1+vec2(aberrationSize,0.)).b
    // ) / LAYERS;
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

        float aberrationSize = 0.002 * cameraZoom.x;
        vec3 c = vec3(
          renderAll(uv-vec2(aberrationSize,0.)).r,
          renderAll(uv).g,
          renderAll(uv+vec2(aberrationSize,0.)).b
        );

        gl_FragColor = vec4(sqrt(c)+vec3(df,cf,0.), 1.0);
    }
}