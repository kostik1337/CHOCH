let joy;
let joyDeadzone = 0.33;

const AXIS = 0;
const BUTTON = 1;

// arrays where [[1] = type, [2] = axis/button, [3] = key code to emit, [4] = hold]
// add 16 to axis value to invert it
let layout = [
    // dpad
    [1, 13, 38], [1, 16, 39], [1, 14, 40], [1, 15, 37],
    // thumb
    [0, 1, 38], [0, 16, 39], [0, 17, 40], [0, 0, 37],
    // xyab - enter
    [1, 0, 13], [1, 1, 13], [1, 2, 13], [1, 3, 13],
    // start - escape
    [1, 9, 27],
];


window.addEventListener("gamepadconnected", e => joy = e.gamepad);


function joyInput(joy, onPressed) {
    layout.forEach(binding => {
        let [type, idx, keycode, repeat] = binding,
            pressed;

        if (type === BUTTON) {
            let b = joy.buttons[idx];
            pressed = b && b.pressed ? 1 : 0; // gamepad might not have that many buttons
        } else {
            let v = joy.axes[idx % 16];
            pressed = (v > 0) == (idx > 15) ? Math.abs(v) : 0;
            if (pressed < joyDeadzone) pressed = 0;
        }

        if (pressed !== repeat)
            onPressed(keycode, pressed ? 1 : 0);

        binding[3] = pressed;
    });
}


function onKeyEvent(keyCode, pressed) {
    let enterPressed = keyCode == 13 && pressed
    // arrow keys; wsad; zsqd
    let index = [38, 40, 37, 39, 87, 83, 65, 68, 90, 87, 81, 68].indexOf(keyCode);
    if (index >= 0) index = index % 4

    // t
    if (keyCode == 84 && pressed) {
        gameSettings.speedrunMode = !gameSettings.speedrunMode
        updateSpeedrunMode()
    }

    // r
    if (gameSettings.speedrunMode &&
        (gameState == STATE_START_CUTSCENE || gameState == STATE_GAME || gameState == STATE_END) &&
        keyCode == 82) {
        setState(STATE_GAME)
        return
    }

    if (gameState == STATE_MENU) {
        if (pressed > 0) {
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
        //if (enterPressed) setState(STATE_MENU)
    } else if (gameState == STATE_GAME) {
        let ms = player.movementStates;

        ms[index] = pressed;
        let speed = player.maxVelocity;
        player.reqSpeed.set(
            (ms[3] - ms[2]) * speed,
            (ms[0] - ms[1]) * speed
        )

        if (keyCode == 27) {
            setState(STATE_MENU)
        }

        // @ifdef DEBUG

        // shift to move fast
        if (keyCode == 16) {
            debugInfo.fast = (pressed != 0)
        }
        if (pressed != 0) {
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