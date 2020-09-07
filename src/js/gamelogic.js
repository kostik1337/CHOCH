const STATE_MENU = 0
const STATE_START_CUTSCENE = 1
const STATE_GAME = 2
const STATE_END = 3

let gameState = -1;

let player = {}

// @ifdef DEBUG
let debugInfo = {
    fps: 0,
    frames: 0,
    lastTimeCheck: 0,
    
    ups: 0,
    updates: 0,
    lastTimeUpd: 0,

    camZoom: .7,
    godmode: true,
    noclip: true,
    fast: false
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
        uSpeed: uniformLoc("speed"),
        uDeathFactor: uniformLoc("df"),
        uCheckpointFactor: uniformLoc("cf"),
    };

    ctx.testTex = createCanvasPostprocTexture(gl)
    shaderProgram = initShaderProgram(gl, vsSource, canvasPostprocFsSource);
    uniformLoc = s => gl.getUniformLocation(shaderProgram, s);
    ctx.canvasPostprocProgramInfo = {
        program: shaderProgram,
        uRes: uniformLoc("res"),
        uTex: uniformLoc("tex"),
        uTime: uniformLoc("t"),
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    const attrPosition = gl.getAttribLocation(shaderProgram, "aPos");
    gl.vertexAttribPointer(attrPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(attrPosition);

    // @ifdef DEBUG
    setState(STATE_GAME)
    // @endif
    // @ifndef DEBUG
    setState(STATE_MENU)
    // @endif

    // @ifdef DEBUG
    var debugDiv = document.createElement("div")
    debugDiv.classList.add('debug')
    debugInfo.debugDiv = debugDiv
    document.querySelector("#debug_div").appendChild(debugDiv);
    // @endif
}

function setState(state) {
    gameState = state
    if (state == STATE_MENU) {
        updateMenuCanvas()
    } else if (state == STATE_START_CUTSCENE) {
        startCutsceneStart()
    } else if (state == STATE_GAME) {
        player = {
            pos: new Vec2(0, 0),
            cam: new Vec2(0, 0),
            maxVelocity: 0.005,
            reqSpeed: new Vec2(0, 0),
            speed: new Vec2(0, 0),
            movementStates: [0, 0, 0, 0],
            lastCheckpointId: -1,
            lastCheckpointPos: new Vec2(0.5, -0.9),
            isDead: false,
            deathFactor: 0.,
            checkpointFactor: 0.,

            solidNormal: null
        }
        playerResurrect()
        player.cam.set(player.pos.x, player.pos.y)
    } else if (state == STATE_END) {
        let cliFont = "`bold 22px 'Andale Mono', 'Courier New', monospace`";
        let wait = (t) => [`ms=${t}`, " №"]

        let w = cctx.canvas.width, h = cctx.canvas.height
        cctx.clearRect(0, 0, w, h)
        setTextureCanvasData()
        print_2d(cctx, [
            `+n;ms=100;font=${cliFont};color='#0f0';w=''`, "Congratulations! You won!№",
            "№"
        ], () => gameState != STATE_END, setTextureCanvasData);
    }
}

function playerResurrect() {
    player.isDead = false
    player.deathFactor = 0
    player.speed.set(0, 0)
    player.pos.set(player.lastCheckpointPos.x, player.lastCheckpointPos.y)
}

function update() {
    if (joy) joyInput(joy, onKeyEvent); // can only poll buttons, no events

    if (gameState != STATE_GAME) return;

    if (player.isDead) {
        player.speed.set(0, 0)
    } else {
        // @ifdef DEBUG
        let speedMul = debugInfo.fast ? 5: 1
        player.speed.mixEq(speedMul*player.reqSpeed.x, speedMul*player.reqSpeed.y, 0.3);
        // @endif
        // @ifndef DEBUG
        player.speed.mixEq(player.reqSpeed.x, player.reqSpeed.y, 0.3);
        // @endif

        player.pos.addEq(player.speed.x, player.speed.y);
        if (player.solidNormal != null) {
            let dot = player.solidNormal.dot(player.speed);
            if (dot < 0) {
                let offset = player.solidNormal.mul(-dot * 1.);
                player.pos.addEq(offset.x, offset.y);
            }
        }
    }
    let speedOffset = 0;
    player.cam.mixEq(player.pos.x + player.speed.x * speedOffset, player.pos.y + player.speed.y * speedOffset, 0.1);

    player.deathFactor *= 0.92;
    player.checkpointFactor *= 0.95;

    // @ifdef DEBUG
    debugInfo.updates++;
    let time = new Date().getTime();
    if (time - debugInfo.lastTimeUpd > 1000) {
        debugInfo.lastTimeUpd = time;
        debugInfo.ups = debugInfo.updates;
        debugInfo.updates = 0;
        updateDebugData()
    }
    // @endif
}

function render(gl) {
    if (gameState == STATE_MENU || gameState == STATE_START_CUTSCENE || gameState == STATE_END) {
        const programInfo = ctx.canvasPostprocProgramInfo;
        gl.useProgram(programInfo.program);
        gl.uniform2f(programInfo.uRes, ctx.canvasSize.x, ctx.canvasSize.y);
        gl.uniform1i(programInfo.uTex, 0);
        gl.uniform1f(programInfo.uTime, (Date.now() - ctx.timeStart) / 1e3);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    } else if (gameState == STATE_GAME) {
        const programInfo = ctx.programInfo;
        gl.useProgram(programInfo.program);
        gl.uniform1f(programInfo.uTime, (Date.now() - ctx.timeStart) / 1e3);
        gl.uniform2f(programInfo.uRes, ctx.canvasSize.x, ctx.canvasSize.y);
        gl.uniform2f(programInfo.uPos, player.pos.x, player.pos.y);
        gl.uniform2f(programInfo.uSpeed, player.speed.x / player.maxVelocity, player.speed.y / player.maxVelocity);
        // @ifdef DEBUG
        gl.uniform4f(programInfo.uCam, player.cam.x, player.cam.y, debugInfo.camZoom * 1.3, debugInfo.camZoom);
        // @endif
        // @ifndef DEBUG
        gl.uniform4f(programInfo.uCam, player.cam.x, player.cam.y, 3. * 1.3, 3.);
        // @endif
        gl.uniform1f(programInfo.uDeathFactor, player.deathFactor);
        gl.uniform1f(programInfo.uCheckpointFactor, player.checkpointFactor);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        let pixelValues = new Uint8Array(3 * 4);
        gl.readPixels(0, 0, 3, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixelValues);
        // solid check
        if (pixelValues[0] > 1
            // @ifdef DEBUG
            && !debugInfo.noclip
            // @endif
        ) {
            player.solidNormal = new Vec2(
                2. * pixelValues[1] / 255. - 1.,
                2. * pixelValues[2] / 255. - 1.
            );
        } else {
            player.solidNormal = null;
        }

        let isCheckpoint = pixelValues[8] > 1
        // death check
        if (pixelValues[4] > 1 && !isCheckpoint && !player.isDead
            // @ifdef DEBUG
            && !debugInfo.godmode
            // @endif
        ) {
            player.isDead = true
            player.deathFactor = 1
            setTimeout(() => {
                playerResurrect();
            }, 500)
        }

        // checkpoint check
        let checkpointId = Math.round(pixelValues[9]);
        if (isCheckpoint && checkpointId >= player.lastCheckpointId) {
            if (checkpointId == 255) {
                setState(STATE_END)
                return
            }
            if (checkpointId > player.lastCheckpointId) player.checkpointFactor = 1;
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
            updateDebugData()
        }
        // @endif
    }
}

// @ifdef DEBUG
function updateDebugData() {
    let debugText = `FPS: ${debugInfo.fps}<br/>
updates per sec: ${debugInfo.ups}<br/>
camZoom: ${debugInfo.camZoom}<br/>
godmode: ${debugInfo.godmode}<br/>
noclip: ${debugInfo.noclip}`
    debugInfo.debugDiv.innerHTML = debugText;
    // console.log(debugText);
}
// @endif

let cctx = document.querySelector("#canvas2d").getContext("2d")

function setTextureCanvasData() {
    let gl = ctx.gl
    let tex = ctx.testTex
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cctx.canvas);
}

function updateMenuCanvas() {
    // TODO: move these vars to some global place and reuse them
    let w = cctx.canvas.width, h = cctx.canvas.height
    let cliFont = "bold 22px 'Andale Mono', 'Courier New', monospace";

    cctx.clearRect(0, 0, w, h)
    cctx.font = cliFont;
    cctx.shadowColor = (cctx.fillStyle = "#bbb") + 'b';
    cctx.shadowBlur = 12;
    cctx.fillText("play", 20, h / 2 - 12);
    setTextureCanvasData()
}

function startCutsceneStart() {
    let cliFont = "`bold 22px 'Andale Mono', 'Courier New', monospace`";
    let wait = (t) => [`ms=${t}`, " №"]

    let w = cctx.canvas.width, h = cctx.canvas.height
    cctx.clearRect(0, 0, w, h)
    setTextureCanvasData()
    print_2d(cctx, [
        // ...wait(1000),

        `+n;ms=50;font=${cliFont};color='#0f0'`, "[totosz@vlt1337 ~]$ ",
        ...wait(500),
        ";ms=50;color='#bbb';w=''", "hack https:⁄⁄asodih90xvy809.com/90as8y/№",

        "+n;ms=300", ". . .  №",

        "n+n;color='#888';ms=50;w='+'",
        "HTTP/2 404№", "+n",
        "content-type: text/html; charset=UTF-8№", "+n",
        "referrer-policy: no-referrer№", "+n",
        "content-length: 1565№", "+n",
        `date: ${new Date().toDateString()}№`, "+n",
        'alt-svc: h3-29=":443"; ma=2592000,h3-27=":443"; ma=2592000,h3-T051=":443";', "+n",
        'ma=2592000,h3-T050=":443"; ma=2592000,h3-Q050=":443"; ma=2592000,h3-Q046=":443";', '+n',
        'ma=2592000,h3-Q043=":443"; ma=2592000,quic=":443"; ma=2592000; v="46,43"№', "n+n",

        "<!DOCTYPE html>№", "+n",
        "<html lang=en>№", "+n",
        "<meta charset=utf-8>№", "+n",
        "<title>Error 404 (Not Found)!!1</title>№", "+n",
        "<p>The requested URL was not found on this server. Tough luck :-)№",

        "n+n,ms=500;color='#c00'", "[ERROR] Hacking failed with code 0x04729632",

        "+n;color='#0f0'", "[totosz@vlt1337 ~]$ ",

        "x_=x;y_=y", // save caret location

        ...wait(1200),
        ";y=600;x=200;ms=60;w='';color='#f80';font=`bold italic 32px 'Lucida Sans Unicode', 'Lucida Grande', sans-serif`",
        "Damn it... They moved it again.№", "+n",
        ...wait(800),
        `;c.fillStyle='#000';c.shadowBlur=0;c.clearRect(0,y-60,${w},${h})`,
        ";ms=60;y=600;x=200", "You can hide it from me but I'll find it anyway!№",
        ...wait(800),
        `;c.fillStyle='#000';c.shadowBlur=0;c.clearRect(0,y-60,${w},${h})`,

        `;x=x_;y=y_;ms=50;color='#bbb';w='';font=${cliFont}`, "hack https:⁄⁄asodih90xvy809.com/ --find-missing-page№",
        ";ms=800", " №", ";ms=50", "--please№",

        ...wait(400),
        `;c.fillStyle='#000';c.shadowBlur=0;c.clearRect(0,0,${w},${h});y=40`,
        "n+n;ms=500;w='+',color='#fff'", "Initialize crawler №", ";x=700;color='#0f0'", "[ OK ]",
        "+n;color='#fff'", "Generate search route №", ";x=700;color='#0f0'", "[ OK ]",
        "+n;color='#fff'", "Calculate expression matcher №", ";x=700;color='#0f0'", "[ OK ]",
        "+n;color='#fff'", "Perform automated search №", "ms=1200;x=700;color='#f00'", "[FAIL]",
        "n+n;color='#fff';x=200", "Manual guidance required. Press enter to start№",
        "w='';ms=200", ". . .  №",

        ...wait(2000),

        "№" // terminate
    ], () => gameState != STATE_START_CUTSCENE, setTextureCanvasData);
}

function onKeyEvent(keyCode, pressed) {
    let enterPressed = keyCode == 13 && pressed
    if (gameState == STATE_MENU) {
        if (enterPressed) setState(STATE_START_CUTSCENE)
    } else if (gameState == STATE_START_CUTSCENE) {
        if (enterPressed) setState(STATE_GAME)
    } else if (gameState == STATE_END) {
        if (enterPressed) setState(STATE_MENU)
    } else if (gameState == STATE_GAME) {
        // arrow keys: left, right, up, down
        let index = [38, 40, 37, 39].indexOf(keyCode);
        let ms = player.movementStates;

        ms[index] = pressed;
        let speed = player.maxVelocity;
        player.reqSpeed.set(
            ms[2] ? -speed : ms[3] ? speed : 0,
            ms[0] ? speed : ms[1] ? -speed : 0
        )

        // shift to move fast
        if (keyCode == 16) {
            debugInfo.fast = pressed
        }
        // @ifdef DEBUG
        if (pressed) {
            // '1' or '2'
            if (keyCode == 49 || keyCode == 50) debugInfo.camZoom = (keyCode == 50 ? .7 : 3)
            else if (keyCode == 71) debugInfo.godmode = !debugInfo.godmode // 'g'
            else if (keyCode == 78) debugInfo.noclip = !debugInfo.noclip // 'n'
            else return
            updateDebugData()
        }
        // @endif
    }
}

function onMouseMove(x, y) {
    //player.size = x / ctx.canvasSize.x;
}