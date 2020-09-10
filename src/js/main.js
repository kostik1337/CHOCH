var ctx = {};

let canvasW = () => ctx.canvas.clientWidth
let canvasH = () => ctx.canvas.clientHeight

function main() {
    var canvas = document.querySelector('#glcanvas');
    var gl = canvas.getContext('webgl');

    handleResize();

    // @ifdef DEBUG
    if (!gl) {
        console.log('Unable to initialize WebGL. Your browser or machine may not support it.');
        return;
    }
    // @endif

    ctx.canvas = canvas
    ctx.gl = gl;

    const buffer = initScreenQuadBuffer(gl);
    init(gl, buffer)

    loop();
}

function loop() {
    const gl = ctx.gl;

    gl.viewport(0, 0, canvasW(), canvasH());

    render(gl);

    window.requestAnimationFrame(loop);
}

function handleResize() {
    ["glcanvas", "canvas2d"].forEach(id =>{
        const canvas = document.getElementById(id);
        canvas.width = window.innerWidth 
        canvas.height = window.innerHeight
        em = Math.round(16 * Math.min(canvas.width, canvas.height) / 1200);
        document.querySelector('html').style.fontSize = em + "px";
        onResize()
    });
}

var keyFunction = (e, pressed) => {
    if (!e.repeat) onKeyEvent(e.which, pressed)
};
window.addEventListener('keydown', e => keyFunction(e, 1));
window.addEventListener('keyup', e => keyFunction(e, 0));
window.addEventListener('load', main, false);
window.addEventListener('resize', handleResize);
window.setInterval(() => update(), 16);