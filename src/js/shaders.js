// File starts with 01 to be first in preprocessing chain

const vsSource = `
precision mediump float;
// @include ../glsl/v_shader.glsl
`;

const gameFsSource = `
precision mediump float;
// @include ../glsl/f_shader.glsl
`;

const canvasPostprocFsSource = `
precision mediump float;

uniform vec2 res;
uniform sampler2D tex;

void main() {
    vec2 uv = gl_FragCoord.xy / res;
    uv.y = 1. - uv.y;
    gl_FragColor = vec4(texture2D(tex, uv).aaa, 1.);
}
`