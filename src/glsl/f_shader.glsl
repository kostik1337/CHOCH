uniform float t;
uniform vec2 res;
uniform vec2 pos;
uniform vec2 camPos;

// copied from iq's sdf functions
float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p)-b;
  return length(max(d,0.0)) + min(max(d.x,d.y),0.0);
}

struct MapValue {
  float solid;
  float deadly;
};

MapValue map(vec2 p) {
  vec2 csize = vec2(1.4);
  ivec2 cid = ivec2(floor(p/csize));
  vec2 p1 = fract(p/csize)- 0.5;
  MapValue val;
  
  if(cid.x == 0 && (cid.y == 0 || cid.y == -1)) {
    //col = vec3(cid/3.+1., 1.);
    float solid = sdBox(p1, vec2(0.45));
    val = MapValue(-solid, 1.);
  }else {
    val = MapValue(-1., 1.);
  }
  // corridor
  float corridorWidth = 0.05;
  val.solid = max(val.solid, corridorWidth-abs(p1.x));
  val.solid = max(val.solid, corridorWidth-abs(p1.y));
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
        gl_FragColor = vec4(solid < 0. ? vec3(1., 0.5*(normal(pos)+1.)) : vec3(0.), 1.);
    } else {
        vec2 uv = 2. * gl_FragCoord.xy / res - 1.;
        // uv.y *= -1.;
        uv.x *= res.x / res.y;
        uv *= 0.3; // zoom
        uv += camPos;

        vec3 c = vec3(0.);
        c += step(0., map(uv).solid);
        c = mix(c, vec3(0.,0.,1.), step(length(uv - pos), 0.01));
        gl_FragColor = vec4(c, 1.0);
    }
}