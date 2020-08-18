const STATE_MENU = 0
const STATE_GAME = 1
const STATE_DEATH = 2

var gameState = {
    timeUntilStart: 0,
    state: STATE_GAME
};

var player = {
    pos: new Vec2(0, 0),
    maxVelocity: 0.003,
    reqSpeed: new Vec2(0, 0),
    speed: new Vec2(0, 0),
    movementStates: [0, 0, 0, 0],
    lastCheckpointId: 0,
    lastCheckpointPos: new Vec2(0.5, 0.1),

    solidNormal: null
};

function init(gl, buf) {
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    var uniformLoc = s => gl.getUniformLocation(shaderProgram, s);
    ctx.programInfo = {
        program: shaderProgram,
        uTime: uniformLoc("t"),
        uRes: uniformLoc("res"),
        uPos: uniformLoc("pos"),
        uCamPos: uniformLoc("camPos"),
    };

    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    const attrPosition = gl.getAttribLocation(shaderProgram, "aPos");
    gl.vertexAttribPointer(attrPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(attrPosition);

    playerInitPos()
    // @ifdef DEBUG

    // @endif
}

function playerInitPos() {
    player.speed.set(0, 0)
    player.pos.set(player.lastCheckpointPos.x, player.lastCheckpointPos.y)
}

function update() {
    player.speed.mixEq(player.reqSpeed.x, player.reqSpeed.y, 0.2);
    player.pos.addEq(player.speed.x, player.speed.y);
    if (player.solidNormal != null) {
        let dot = player.solidNormal.dot(player.speed);
        if (dot < 0) {
            let offset = player.solidNormal.mul(-dot * 1.);
            player.pos.addEq(offset.x, offset.y);
        }
    }
}

function render(gl) {
    const programInfo = ctx.programInfo;
    gl.useProgram(programInfo.program);
    gl.uniform1f(programInfo.uTime, (Date.now() - ctx.timeStart) / 1e3);
    gl.uniform2f(programInfo.uRes, ctx.canvasSize.x, ctx.canvasSize.y);
    gl.uniform2f(programInfo.uPos, player.pos.x, player.pos.y);
    gl.uniform2f(programInfo.uCamPos, player.pos.x, player.pos.y);
    //gl.uniform1f(programInfo.uSize, player.size);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    var pixelValues = new Uint8Array(3 * 4);
    gl.readPixels(0, 0, 3, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixelValues);
    //console.log(pixelValues);
    // solid check
    if (pixelValues[0] > 1) {
        player.solidNormal = new Vec2(
            2. * pixelValues[1] / 255. - 1.,
            2. * pixelValues[2] / 255. - 1.
        );
    } else {
        player.solidNormal = null;
    }

    if (pixelValues[4] > 1) {
        playerInitPos();
    }
    if (pixelValues[8] > 1) {
        player.lastCheckpointPos.set(player.pos.x, player.pos.y);
        player.lastCheckpointId = Math.round(pixelValues[9]);
    }
}

function onKeyEvent(event, pressed) {
    let index = [38, 40, 37, 39].indexOf(event.which);
    var ms = player.movementStates;

    ms[index] = pressed;
    const speed = player.maxVelocity;
    player.reqSpeed.set(
        ms[2] ? -speed : ms[3] ? speed : 0,
        ms[0] ? speed : ms[1] ? -speed : 0
    )
}

function onMouseMove(x, y) {
    //player.size = x / ctx.canvasSize.x;
}