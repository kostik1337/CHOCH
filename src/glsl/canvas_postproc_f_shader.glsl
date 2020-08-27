uniform vec2 res;
uniform sampler2D tex;
uniform float t;

const vec3 BLANK = vec3(0.07, 0.07, 0.13);

vec3 drawTexWithBounds(vec2 uv) {
    if (uv.x < 0. || uv.x > 1. || uv.y < 0. || uv.y > 1.) return BLANK;

    vec2 auv = abs(2.*uv-1.);
    vec2 boundsSize = vec2(1.-0.01, 0.005);
    float borderLine = max(
        smoothstep(boundsSize.x-boundsSize.y, boundsSize.x, auv.x),
        smoothstep(boundsSize.x-boundsSize.y, boundsSize.x, auv.y) 
    ) * smoothstep(boundsSize.x+boundsSize.y, boundsSize.x, auv.x) 
      * smoothstep(boundsSize.x+boundsSize.y, boundsSize.x, auv.y);

    vec4 texel = texture2D(tex, 0.96*uv-0.02);
    float scanlines = 1. - 0.1*(sin((uv.y+t/20.) *300.)+1.);
    return mix(BLANK, max(texel.rgb, vec3(borderLine)), max(texel.a, borderLine)*scanlines);
}

vec2 distort(vec2 uv) {
  float distFactor = 0.05;
  uv = 2.*uv-1.;
  return (vec2(
    uv.x * (1. + distFactor*pow(abs(uv.y), 2.)),
    uv.y * (1. + distFactor*pow(abs(uv.x), 2.))
  )+1.)/2.;
}

void main() {
    vec2 uv = gl_FragCoord.xy / res;
    uv.y = 1. - uv.y;
    uv = 1.04*uv -0.02;

    uv = distort(uv);
    const float aberration = 0.002;
    vec3 texel = vec3(
        drawTexWithBounds(uv-vec2(aberration, 0.)).r,
        drawTexWithBounds(uv).g,
        drawTexWithBounds(uv+vec2(aberration, 0.)).b
    );
    gl_FragColor = vec4(texel, 1.);
}