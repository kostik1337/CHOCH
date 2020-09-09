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

    camZoom: 3.,
    godmode: true,
    noclip: true,
    fast: false
};
// @endif

let gameSettings = {
    difficulty: 1,
    graphics: 2,
    difficultyVariants: ["easiest", "easy", "normal", "nightmare"],
    graphicsVariants: ["low", "medium", "high"],
    currentSelection: 0
}

function init(gl, buf) {
    ctx.time = 0

    // main game shader
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

    // game postproc shader
    shaderProgram = initShaderProgram(gl, vsSource, postprocFsSource);
    uniformLoc = s => gl.getUniformLocation(shaderProgram, s);
    ctx.postprocProgramInfo = {
        program: shaderProgram,
        uRes: uniformLoc("res"),
        uTex: uniformLoc("tex"),
    }

    // canvas postproc shader (crt)
    ctx.canvasTex = createPostprocTexture(gl, 0, 0)
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
    setState(STATE_MENU)
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
        showCutscene(startCutsceneData, STATE_START_CUTSCENE)
    } else if (state == STATE_END) {
        showCutscene(endCutsceneData, STATE_END)
    } else if (state == STATE_GAME) {
        // create framebuffer here
        let divide = [4, 2, 1][gameSettings.graphics]
        ctx.fbTexData = createFramebufferWithTexture(ctx.gl, ctx.canvasSize.x / divide, ctx.canvasSize.y / divide, ctx.fbTexData)

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
        let speedMul = debugInfo.fast ? 5 : 1
        player.speed.mixEq(speedMul * player.reqSpeed.x, speedMul * player.reqSpeed.y, 0.3);
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
    let dt = [1 / 80, 1 / 70, 1 / 60, 1 / 50][gameSettings.difficulty]
    ctx.time += dt
    if (gameState == STATE_MENU || gameState == STATE_START_CUTSCENE || gameState == STATE_END) {
        const programInfo = ctx.canvasPostprocProgramInfo;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, ctx.canvasTex);
        gl.useProgram(programInfo.program);
        gl.uniform2f(programInfo.uRes, ctx.canvasSize.x, ctx.canvasSize.y);
        gl.uniform1i(programInfo.uTex, 0);
        gl.uniform1f(programInfo.uTime, ctx.time);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    } else if (gameState == STATE_GAME) {
        // render all game stuff to texture
        gl.bindFramebuffer(gl.FRAMEBUFFER, ctx.fbTexData[0]);
        let programInfo = ctx.programInfo;
        gl.useProgram(programInfo.program);
        gl.uniform1f(programInfo.uTime, ctx.time);
        gl.uniform2f(programInfo.uRes, ctx.fbTexData[2], ctx.fbTexData[3]);
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

        // post-process texture
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        programInfo = ctx.postprocProgramInfo;
        gl.bindTexture(gl.TEXTURE_2D, ctx.fbTexData[1]);
        gl.useProgram(programInfo.program);
        gl.uniform2f(programInfo.uRes, ctx.canvasSize.x, ctx.canvasSize.y);
        gl.uniform1i(programInfo.uTex, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

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
            getAudioProcessor().death()
        }

        // checkpoint check
        let checkpointId = Math.round(pixelValues[9]);
        if (isCheckpoint && checkpointId >= player.lastCheckpointId) {
            if (checkpointId == 255) {
                setState(STATE_END)
                getAudioProcessor().lastCheckpoint()
                return
            }
            if (checkpointId > player.lastCheckpointId) {
                player.checkpointFactor = 1;
                getAudioProcessor().checkpoint()
            }
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
    gl.bindTexture(gl.TEXTURE_2D, ctx.canvasTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cctx.canvas);
}

function updateMenuCanvas() {
    // TODO: move these vars to some global place and reuse them
    let w = cctx.canvas.width, h = cctx.canvas.height
    let x = 50, lh = 48 // line height

    cctx.clearRect(0, 0, w, h)
    cctx.font = cliFont;
    cctx.shadowBlur = 12;

    let drawMenuItem = (text, i) => {
        cctx.shadowColor = (cctx.fillStyle = i == gameSettings.currentSelection ? "#0a0" : "#bbb") + 'b';
        cctx.fillText(text, x, h / 2 - lh * 3 / 2 + lh * i);
    }
    drawMenuItem("play", 0)
    drawMenuItem(`difficulty: ${gameSettings.difficultyVariants[gameSettings.difficulty]}`, 1)
    drawMenuItem(`graphics: ${gameSettings.graphicsVariants[gameSettings.graphics]}`, 2)

    setTextureCanvasData()
}

function showCutscene(cutsceneDataFn, forState) {
    let w = cctx.canvas.width, h = cctx.canvas.height
    cctx.clearRect(0, 0, w, h)
    setTextureCanvasData()
    print_2d(cctx, cutsceneDataFn(w, h),
        () => gameState != forState,
        setTextureCanvasData,
        () => { getAudioProcessor().typingFn() }
    );
}

function onKeyEvent(keyCode, pressed) {
    let enterPressed = keyCode == 13 && pressed
    if (gameState == STATE_MENU) {
        let index = [38, 40, 37, 39].indexOf(keyCode);
        if (pressed) {
            if (gameSettings.currentSelection == 0 && enterPressed) {
                setState(STATE_START_CUTSCENE)
                getAudioProcessor().menuChangeFn(true)
            }
            if (index == 0 || index == 1) {
                let maxSettings = 3
                gameSettings.currentSelection =
                    (gameSettings.currentSelection + (index == 1 ? 1 : maxSettings - 1)) % maxSettings
                updateMenuCanvas()
                getAudioProcessor().menuChangeFn(false)
            }

            if (index == 2 || index == 3) {
                if (gameSettings.currentSelection == 1) {
                    let variantsLen = gameSettings.difficultyVariants.length
                    gameSettings.difficulty = (gameSettings.difficulty + (index == 3 ? 1 : variantsLen - 1)) % variantsLen
                    updateMenuCanvas()
                    getAudioProcessor().menuChangeFn(true)
                } else if (gameSettings.currentSelection == 2) {
                    let variantsLen = gameSettings.graphicsVariants.length
                    gameSettings.graphics = (gameSettings.graphics + (index == 3 ? 1 : variantsLen - 1)) % variantsLen
                    updateMenuCanvas()
                    getAudioProcessor().menuChangeFn(true)
                }
            }
        }
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