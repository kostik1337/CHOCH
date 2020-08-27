const STATE_MENU = 0
const STATE_START_CUTSCENE = 1
const STATE_GAME = 2
const STATE_DEATH = 3
const STATE_WIN = 4

let gameState = {
    state: STATE_MENU
};

let player = {
    pos: new Vec2(0, 0),
    cam: new Vec2(0, 0),
    maxVelocity: 0.005,
    reqSpeed: new Vec2(0, 0),
    speed: new Vec2(0, 0),
    movementStates: [0, 0, 0, 0],
    lastCheckpointId: 0,
    lastCheckpointPos: new Vec2(0.5, 0.1),

    solidNormal: null
};

// @ifdef DEBUG
let debugInfo = {
    fps: 0,
    frames: 0,
    lastTimeCheck: 0
};
// @endif

function init(gl, buf) {
    let shaderProgram = initShaderProgram(gl, vsSource, gameFsSource);
    let uniformLoc = s => gl.getUniformLocation(shaderProgram, s);
    ctx.programInfo = {
        program: shaderProgram,
        uTime: uniformLoc("t"),
        uRes: uniformLoc("res"),
        uPos: uniformLoc("pos"),
        uCam: uniformLoc("cam"),
    };

    ctx.testTex = createCanvasPostprocTexture(gl)
    shaderProgram = initShaderProgram(gl, vsSource, canvasPostprocFsSource);
    uniformLoc = s => gl.getUniformLocation(shaderProgram, s);
    ctx.canvasPostprocProgramInfo = {
        program: shaderProgram,
        uRes: uniformLoc("res"),
        uTex: uniformLoc("tex"),
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    const attrPosition = gl.getAttribLocation(shaderProgram, "aPos");
    gl.vertexAttribPointer(attrPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(attrPosition);

    playerInitPos()

    player.cam.set(player.pos.x, player.pos.y)
    // @ifdef DEBUG
    var fpsText = document.createElement("div")
    fpsText.classList.add('debug')
    debugInfo.fpsText = fpsText
    document.querySelector("#debug_div").appendChild(fpsText);
    // @endif
}

function playerInitPos() {
    player.speed.set(0, 0)
    player.pos.set(player.lastCheckpointPos.x, player.lastCheckpointPos.y)
}

function update() {
    if (gameState.state != STATE_GAME) return;
    player.speed.mixEq(player.reqSpeed.x, player.reqSpeed.y, 0.3);
    player.pos.addEq(player.speed.x, player.speed.y);
    if (player.solidNormal != null) {
        let dot = player.solidNormal.dot(player.speed);
        if (dot < 0) {
            let offset = player.solidNormal.mul(-dot * 1.);
            player.pos.addEq(offset.x, offset.y);
        }
    }
    let speedOffset = 0;
    player.cam.mixEq(player.pos.x + player.speed.x * speedOffset, player.pos.y + player.speed.y * speedOffset, 0.1);
}

function render(gl) {
    if (gameState.state == STATE_MENU || gameState.state == STATE_START_CUTSCENE) {
        const programInfo = ctx.canvasPostprocProgramInfo;
        gl.useProgram(programInfo.program);
        gl.uniform2f(programInfo.uRes, ctx.canvasSize.x, ctx.canvasSize.y);
        gl.uniform1i(programInfo.uTex, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    } else if (gameState.state == STATE_GAME) {
        const programInfo = ctx.programInfo;
        gl.useProgram(programInfo.program);
        gl.uniform1f(programInfo.uTime, (Date.now() - ctx.timeStart) / 1e3);
        gl.uniform2f(programInfo.uRes, ctx.canvasSize.x, ctx.canvasSize.y);
        gl.uniform2f(programInfo.uPos, player.pos.x, player.pos.y);
        gl.uniform2f(programInfo.uCam, player.cam.x, player.cam.y);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        let pixelValues = new Uint8Array(3 * 4);
        gl.readPixels(0, 0, 3, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixelValues);
        // solid check
        if (pixelValues[0] > 1) {
            player.solidNormal = new Vec2(
                2. * pixelValues[1] / 255. - 1.,
                2. * pixelValues[2] / 255. - 1.
            );
        } else {
            player.solidNormal = null;
        }

        let isCheckpoint = pixelValues[8] > 1
        // death check
        if (pixelValues[4] > 1 && !isCheckpoint) {
            playerInitPos();
        }

        let checkpointId = Math.round(pixelValues[9]);
        if (isCheckpoint && checkpointId >= player.lastCheckpointId) {
            player.lastCheckpointPos.set(player.pos.x, player.pos.y);
            player.lastCheckpointId = checkpointId;
        }

        // @ifdef DEBUG
        debugInfo.frames++;
        let time = new Date().getTime();
        if (time - debugInfo.lastTimeCheck > 1000) {
            debugInfo.lastTimeCheck = time;
            debugInfo.fps = debugInfo.frames;
            debugInfo.frames = 0;
        }
        debugInfo.fpsText.innerHTML = `FPS: ${debugInfo.fps}`;
        // @endif
    }
}

function setTextureCanvasData(gl, tex, canvas) {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
}

function onKeyEvent(event, pressed) {
    if (gameState.state == STATE_MENU) {
        // enter
        if (event.which == 13) {
            gameState.state = STATE_START_CUTSCENE

            print_2d([
                "totosz@vlt1337>№", ";color='#888';w=''", "hack https:⁄⁄asodih90xvy809.com/90as8y/№",

                ";color='#888';ms=50;w='+'",
                "HTTP/2 404№",
                "content-type: text/html; charset=UTF-8№",
                "referrer-policy: no-referrer№",
                "content-length: 1565№",
                `date: ${new Date().toDateString()}№`,
                'alt-svc: h3-29=":443"; ma=2592000,h3-27=":443"; ma=2592000,h3-T051=":443"; ma=2592000,h3-T050=":443"; ma=2592000,h3-Q050=":443"; ma=2592000,h3-Q046=":443"; ma=2592000,h3-Q043=":443"; ma=2592000,quic=":443"; ma=2592000; v="46,43"№',
                " №",

                "<!DOCTYPE html>№",
                "<html lang=en>№",
                "<meta charset=utf-8>№",
                "<title>Error 404 (Not Found)!!1</title>№",
                "<p>The requested URL was not found on this server. Tough luck :-)№",

                ";y=500;x=100;ms=100;w='';color='#f00';font='16px italic \"Arial\",sans-serif'",
                "#$&*^#@*&$^!?!№",
                "You can hide it from me but I'll find it anyway!№",

                // TODO write this in the console, not speech
                ";color='#0f0';w='+'", "totosz@vlt1337>№", ";color='#888';w=''", "hack https:⁄⁄asodih90xvy809.com/90as8y/ --find-missing-page№",
                "--please№",

                "№",
            ], (canvasCtx) => setTextureCanvasData(ctx.gl, ctx.testTex, canvasCtx.canvas))
                .then(() => new Promise(resolve => setTimeout(resolve, 1000)))
                .then(() => gameState.state = STATE_GAME);
        }
    } else if (gameState.state == STATE_GAME) {
        // arrow keys: left, right, up, down
        let index = [38, 40, 37, 39].indexOf(event.which);
        let ms = player.movementStates;

        ms[index] = pressed;
        const speed = player.maxVelocity;
        player.reqSpeed.set(
            ms[2] ? -speed : ms[3] ? speed : 0,
            ms[0] ? speed : ms[1] ? -speed : 0
        )
    }
}

function onMouseMove(x, y) {
    //player.size = x / ctx.canvasSize.x;
}