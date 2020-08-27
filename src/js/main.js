var ctx = {};

var textCtx = document.querySelector('#canvas2d').getContext("2d");

function createTextureFromCanvas(gl, text) {
    let textCanvas = textCtx.canvas;
    textCanvas.width = 128;
    textCanvas.height = 128;
    const render = initFont(font, textCtx);
    render(text.toUpperCase(), 10, textCanvas.height/2, 5);

    let textTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return textTex
}

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

var keyFunction = (e, pressed) => {
    if (!e.repeat) onKeyEvent(e, pressed)
};
window.addEventListener('keydown', e => keyFunction(e, true));
window.addEventListener('keyup', e => keyFunction(e, false));
window.addEventListener('load', main, false);
window.setInterval(() => update(), 16);