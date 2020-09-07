uniform vec2 res;
uniform sampler2D tex;
uniform float t;

void main() {
    vec2 uv = gl_FragCoord.xy / res;
    //uv.y = 1. - uv.y;
    float aberrationSize = 0.003;
    vec3 texel = vec3(
        texture2D(tex, uv-vec2(aberrationSize, 0.)).r,
        texture2D(tex, uv).g,
        texture2D(tex, uv+vec2(aberrationSize, 0.)).b
    );
    gl_FragColor = vec4(texel, 1.);
}