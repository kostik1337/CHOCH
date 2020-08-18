uniform float t;
uniform vec2 res;
uniform vec2 pos;
uniform vec2 camPos;

const float playerSize = 0.01;

#define PI 3.14159265

// copied from iq's sdf functions
mat2 mr(float a) {float s=sin(a),c=cos(a);return mat2(c,s,-s,c);}

float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p)-b;
  return length(max(d,0.0)) + min(max(d.x,d.y),0.0);
}

float sdCircle(vec2 p, float r) {return length(p)-r;}

struct MapValue {
  float solid; // solid < 0 - point is solid (distance to closest solid)
  float deadly; // deadly and checkpoint work the same way
  float checkpoint;
  int checkpointId; // id of checkpoint, if checkpoint in current point
};

vec3 col = vec3(1.);

MapValue map(vec2 p) {
  vec2 csize = vec2(1., 2.);
  ivec2 cid = ivec2(floor(p/csize));
  vec2 p1 = mod(p, csize)- csize/2.;
  MapValue val;
  
  if(cid.x == 0 && cid.y == 0) {
    //col = vec3(cid/3.+1., 1.);
    float solid = sdBox(p1, csize/1.9);
    
    vec2 pdead = p1 + vec2(0., 0.5);
    pdead *= mr(t);
    float ang = mod(atan(pdead.y, pdead.x), PI/3.) - PI/6.;
    pdead = length(pdead) * vec2(cos(ang), sin(ang));
    float deadly = sdCircle(pdead-vec2(0.2, 0.), 0.05);
    
    float checkpoint = sdBox(p1, vec2(csize.x, 0.1));
    val = MapValue(-solid, deadly, checkpoint, 1);
  }else {
    val = MapValue(-1., 1., 1., 0);
  }
  return val;
}

vec2 normal(vec2 p) {
    vec2 E=vec2(0.001, 0.);
    float m = map(p).solid;
    return normalize(vec2(
        map(p+E.xy).solid - m,
        map(p+E.yx).solid - m
    ));
}

void main() {
    // pixel 1 - collision check + normal
    if (gl_FragCoord.x < 1. && gl_FragCoord.y < 1.) {
        float solid = map(pos).solid;
        gl_FragColor = vec4(solid < playerSize ? vec3(1., 0.5*(normal(pos)+1.)) : vec3(0.), 1.);
    } else
    // pixel 2 - death check
    if (gl_FragCoord.x < 2. && gl_FragCoord.y < 1.) {
        gl_FragColor = vec4(vec3(map(pos).deadly < playerSize ? vec3(1.) : vec3(0.)), 1.);
    } else
    // pixel 3 - checkpoint check
    if (gl_FragCoord.x < 3. && gl_FragCoord.y < 1.) {
        MapValue m = map(pos);
        gl_FragColor = vec4(m.checkpoint < playerSize ? vec3(1., float(m.checkpointId)/255., 0.) : vec3(0.), 1.);
    } else {
        vec2 uv = 2. * gl_FragCoord.xy / res - 1.;
        // uv.y *= -1.;
        uv.x *= res.x / res.y;
        uv *= 0.3; // zoom
        uv += camPos;

        MapValue m = map(uv);
        vec3 c = vec3(0.);
        if (m.solid > 0.) {
            if (m.checkpoint < 0.) c = vec3(0., 1.,0.); // checkpoint zone
            else if (m.deadly < 0.) c = vec3(1., 0.,0.);  // deadly zone
            else c = vec3(1.);
        }
        c = mix(c, vec3(0.,0.,1.), step(length(uv - pos), 0.01));

        gl_FragColor = vec4(c, 1.0);
    }
}