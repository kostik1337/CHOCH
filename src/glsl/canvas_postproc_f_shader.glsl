uniform vec2 res;
uniform sampler2D tex;
uniform float t;
uniform float ef;

const vec3 BLANK = vec3(0.07, 0.07, 0.13);
const vec3 borderColor = vec3(.6);

vec4 drawTexWithBounds(vec2 uv) {
    if (uv.x < 0. || uv.x > 1. || uv.y < 0. || uv.y > 1.) return vec4(0.);

    vec2 auv = abs(2.*uv-1.);
    vec2 bs = vec2(0.02, 0.002); // bs.x - bounds thickness, bs.y - "smoothness"
    vec2 bsx = bs * res.y/res.x;
    float borderLine = max(
        smoothstep(1.-bsx.x-2.*bsx.y, 1.-bsx.x-bsx.y, auv.x),
        smoothstep(1.-bs.x-2.*bs.y, 1.-bs.x-bs.y, auv.y) 
    ) * smoothstep(1., 1.-bsx.y, auv.x) 
      * smoothstep(1., 1.-bs.y, auv.y);

    vec4 texel = texture2D(tex, 0.96*uv-0.02);
    float mult = 1.5;
    //texel.rgb = pow(texel.rgb*mult, vec3(2.)) / mult;
    //float scanlines = 1. - 0.4*smoothstep(-.8, .8,sin((uv.y+t/20.) *300.));
    float scanlines = 1. - 0.1*(sin((uv.y+t/20.) *300.)+1.);

    return vec4(max(texel.rgb, vec3(borderColor*borderLine)), max(texel.a, borderLine)*scanlines);
}

vec2 distort(vec2 uv) {
  float distFactor = 0.05;
  uv = 2.*uv-1.;
  return (vec2(
    uv.x * (1. + distFactor*pow(abs(uv.y), 2.)),
    uv.y * (1. + distFactor*pow(abs(uv.x), 2.))
  )+1.)/2.;
}

vec3 drawAll(vec2 uv) {
  vec4 texel = drawTexWithBounds(uv) + .2 * drawTexWithBounds((uv-.5) * .99 + .5);
  return mix(BLANK, texel.rgb, texel.a);
}

void main() {
    vec2 uv = gl_FragCoord.xy / res;
    uv.y = 1. - uv.y;
    uv = 1.04*uv -0.02;

    uv = distort(uv);
    const float aberration = 0.002;
    
    vec3 col = vec3(
        drawAll(uv-vec2(aberration, 0.)).r,
        drawAll(uv).g,
        drawAll(uv+vec2(aberration, 0.)).b
    );
    gl_FragColor = vec4(col + ef, 1.);
}