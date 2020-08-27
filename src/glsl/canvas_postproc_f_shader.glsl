uniform vec2 res;
uniform sampler2D tex;

void main() {
    vec2 uv = gl_FragCoord.xy / res;
    uv.y = 1. - uv.y;
    vec4 texel = texture2D(tex, uv);
    gl_FragColor = vec4(mix(vec3(0.07, 0.07, 0.13), texel.rgb, texel.a), 1.);
}