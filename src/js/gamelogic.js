var player = {
    pos: new Vec2(0, 0),
    speed: new Vec2(0, 0),
    size: 1,
    movementStates: [0, 0, 0, 0],
};


function init(gl, buf) {
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    var uniformLoc = s => gl.getUniformLocation(shaderProgram, s);
    ctx.programInfo = {
        program: shaderProgram,
        uTime: uniformLoc("t"),
        uRes: uniformLoc("res"),
        uPos: uniformLoc("pos"),
        uSize: uniformLoc("size"),
    };

    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    const attrPosition = gl.getAttribLocation(shaderProgram, "aPos")
    gl.vertexAttribPointer(attrPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(attrPosition);
}

function update() {
    player.pos.addEq(player.speed.x, player.speed.y);
}

function render(gl) {
    const programInfo = ctx.programInfo;
    gl.useProgram(programInfo.program);
    gl.uniform1f(programInfo.uTime, (Date.now() - ctx.timeStart) / 1e3);
    gl.uniform2f(programInfo.uRes, ctx.canvasSize.x, ctx.canvasSize.y);
    gl.uniform2f(programInfo.uPos, player.pos.x, player.pos.y);
    gl.uniform1f(programInfo.uSize, player.size);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // reading pixels from screen - if necessary
    // var pixelValues = new Uint8Array(4);
    // gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixelValues);
    // if (pixelValues[0] == 0) player.speed.mulEqScalar(0.);
}

function onKeyEvent(event, pressed) {
    var index = -1;
    switch (event.key) {
        case 'w': index = 0; break;
        case 's': index = 1; break;
        case 'a': index = 2; break;
        case 'd': index = 3; break;
    }
    var ms = player.movementStates;
    ms[index] = pressed;
    const speed = 0.01;
    player.speed.y = ms[0] ? -speed : ms[1] ? speed : 0;
    player.speed.x = ms[2] ? -speed : ms[3] ? speed : 0;
}

function onMouseMove(x, y) {
    player.size = x / ctx.canvasSize.x;
}