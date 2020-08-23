uniform float t;
uniform vec2 res;
uniform vec2 pos;
uniform vec2 cam;

const float playerSize = 0.03;
const vec2 cameraZoom = vec2(3., 2.5);

#define PI 3.14159265

float hash(float x) {return fract(sin(x)*31345.23);}

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

  float checkpoint = sdBox(p-vec2(0.,1.25), vec2(csize.x, 0.1));
  return MapValue(0., 0., deadly, checkpoint, 1);
}

MapValue map(vec2 p) {
  float row = floor(p.y/csize.y);
  p.x += hash(row)*1.;
  ivec2 cid = ivec2(floor(p/csize));
  vec2 p1 = mod(p, csize) - csize/2.;

  MapValue v;
  if (cid.x == 0 ) {
     v = room1(p1);
  } else {
    return MapValue(-1., -1., 1., 1., 0);
  }
  vec2 boxSize = csize/2.1;
  v.solid = -sdBox(p1, boxSize);
  vec2 axis1 = vec2(1./sqrt(2.)), axis2 = axis1.yx*vec2(1.,-1.);
  p.y += t*.2;
  p1 += axis1 * (hash(floor(dot(p, axis2)*5.)) - .5)*.05;
  p.y += t*.1;
  p1 += axis2 * (hash(floor(dot(p, axis1)*3.)) - .5)*.07;
  v.solidDisplay = -sdBox(p1, boxSize);
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
  vec3 c = vec3(1.);
  if (m.solidDisplay > 0.) {
      if (m.checkpoint < 0.) c = vec3(0., 1.,0.); // checkpoint zone
      else if (m.deadly < 0.) c = vec3(1., 0.,0.);  // deadly zone
      else c = vec3(0.204, 0.188, 0.474);
  }
  c = mix(c, vec3(1.,1.,1.), step(length(uv - pos), playerSize));
  return c;
}

#define LAYERS 1.0

void main() {
    // pixel 1 - collision check + normal
    if (gl_FragCoord.x < 1. && gl_FragCoord.y < 1.) {
        float solid = map(pos).solid;
        gl_FragColor = vec4(solid < playerSize ? vec3(1., 0.5*(normal(pos)+1.)) : vec3(0.), 1.);
    } else
    // pixel 2 - death check
    if (gl_FragCoord.x < 2. && gl_FragCoord.y < 1.) {
        gl_FragColor = vec4(vec3(map(pos).deadly < playerSize/2. ? vec3(1.) : vec3(0.)), 1.);
    } else
    // pixel 3 - checkpoint check
    if (gl_FragCoord.x < 3. && gl_FragCoord.y < 1.) {
        MapValue m = map(pos);
        gl_FragColor = vec4(m.checkpoint < 0. ? vec3(1., float(m.checkpointId)/255., 0.) : vec3(0.), 1.);
    } else {
        vec2 uv = 2. * gl_FragCoord.xy / res - 1.;
        // uv.y *= -1.;
        uv.x *= res.x / res.y;
        uv /= cameraZoom; // zoom
        uv += cam;

        vec3 c = vec3(0.);
        for (float i = 0.; i<LAYERS; ++i) {
          c += renderLayer(uv + vec2(0., 0.05*i/LAYERS)) / LAYERS;
        }

        gl_FragColor = vec4(sqrt(c), 1.0);
    }
}