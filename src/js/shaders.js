// File starts with 01 to be first in preprocessing chain

const vsSource = `
precision mediump float;
// @include ../glsl/v_shader.glsl
`;

const gameFsSource = `
precision mediump float;
// @include ../glsl/f_shader.glsl
`;

const postprocFsSource = `
precision mediump float;
// @include ../glsl/postproc_f_shader.glsl
`;

const canvasPostprocFsSource = `
precision mediump float;
// @include ../glsl/canvas_postproc_f_shader.glsl
`