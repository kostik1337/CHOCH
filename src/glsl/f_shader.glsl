uniform float t;
uniform vec2 res;
uniform vec2 pos;
uniform float size;

void main() {
    vec2 uv = 2. * gl_FragCoord.xy / res - 1.;
    uv.y *= -1.;
    uv.x *= res.x / res.y;

    float c = step(length(uv - pos), size);
    gl_FragColor = vec4(vec3(c), 1.0);
}