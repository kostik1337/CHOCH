var ctx = {};

// @include 01_shaders.js
// @include mathhelpers.js
// @include gamelogic.js
// @include audio.js

function main() {
    var canvas = document.querySelector('#glcanvas');
    var gl = canvas.getContext('webgl');

    // @ifdef DEBUG
    if (!gl) {
        console.log('Unable to initialize WebGL. Your browser or machine may not support it.');
        return;
    }
    // @endif

    ctx.canvasSize = new Vec2(canvas.clientWidth, canvas.clientHeight);
    ctx.gl = gl;
    ctx.timeStart = Date.now();

    const buffer = initScreenQuadBuffer(gl);
    init(gl, buffer)

    loop();
    const rect = canvas.getBoundingClientRect();
    canvas.addEventListener('mousemove',
        e => onMouseMove(e.clientX - rect.left, e.clientY - rect.top));
}

function loop() {
    const gl = ctx.gl;

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    render(gl);

    window.requestAnimationFrame(loop);
}

function initScreenQuadBuffer(gl) {
    const positionBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const positions = [
        1.0, 1.0,
        -1.0, 1.0,
        1.0, -1.0,
        -1.0, -1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    return positionBuffer;
}

function loadShader(gl, type, source) {
    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    // @ifdef DEBUG
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.log(`An error occurred compiling ${type == gl.VERTEX_SHADER ? "vertex" : "fragment"} shader: ${gl.getShaderInfoLog(shader)}`);
        gl.deleteShader(shader);
        return null;
    }
    // @endif

    return shader;
}

function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // @ifdef DEBUG
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.log(`Unable to initialize the shader program: ${gl.getProgramInfoLog(shaderProgram)}`);
        return null;
    }
    // @endif

    return shaderProgram;
}

var keyFunction = (e, pressed) => {
    if (!e.repeat) onKeyEvent(e, pressed)
};
window.addEventListener('keydown', e => keyFunction(e, true));
window.addEventListener('keyup', e => keyFunction(e, false));
window.addEventListener('load', main, false);
window.setInterval(() => update(), 16);