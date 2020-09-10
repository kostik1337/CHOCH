uniform vec2 res;
uniform sampler2D tex;
uniform vec3 fact; // fact.x - death factor, fact.y - checkpoint factor, fact.z - end factor

void main() {
    vec2 uv = gl_FragCoord.xy / res;
    vec2 uvn = abs(uv*2. - 1.);
    float aberrationSize = 0.003 + 0.015*fact.x;
    vec3 texel = vec3(
        texture2D(tex, uv-vec2(aberrationSize, 0.)).r,
        texture2D(tex, uv).g,
        texture2D(tex, uv+vec2(aberrationSize, 0.)).b
    );
    float darkLen = 0.6;
    float dark = max(smoothstep(1.-darkLen, 1., uvn.x), smoothstep(1.-darkLen, 1., uvn.y));
    gl_FragColor = vec4(mix(texel, vec3(0.), 0.25*dark) + vec3(0.,fact.y,0.) + fact.z, 1.);
}