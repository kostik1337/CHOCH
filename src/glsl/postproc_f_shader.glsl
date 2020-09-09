uniform vec2 res;
uniform sampler2D tex;
uniform vec3 fact; // fact.x - death factor, fact.y - checkpoint factor, fact.z - end factor
// // death factor
// uniform float df;
// // checkpoint factor
// uniform float cf;

void main() {
    vec2 uv = gl_FragCoord.xy / res;
    //uv.y = 1. - uv.y;
    float aberrationSize = 0.003 + 0.015*fact.x;
    vec3 texel = vec3(
        texture2D(tex, uv-vec2(aberrationSize, 0.)).r,
        texture2D(tex, uv).g,
        texture2D(tex, uv+vec2(aberrationSize, 0.)).b
    );
    gl_FragColor = vec4(texel + vec3(0.,fact.y,0.) + fact.z, 1.);
}