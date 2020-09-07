var ctx = {};

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
    if (!e.repeat) onKeyEvent(e.which, pressed)
};
window.addEventListener('keydown', e => keyFunction(e, true));
window.addEventListener('keyup', e => keyFunction(e, false));
window.addEventListener('load', main, false);
window.setInterval(() => update(), 16);