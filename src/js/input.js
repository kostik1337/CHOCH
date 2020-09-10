let joy;
let joyDeadzone = 0.33;

const AXIS = 0;
const BUTTON = 1;

// arrays where [[1] = type, [2] = axis/button, [3] = key code to emit, [4] = hold]
// add 16 to axis value to invert it
let layout = [
    // dpad
    [1,13,38],[1,16,39],[1,14,40],[1,15,37],
    // thumb
    [0,1,38],[0,16,39],[0,17,40],[0,0,37],
    // start
    [1,9,13],
];


window.addEventListener("gamepadconnected", e=>joy=e.gamepad);


function joyInput(joy, onPressed) {
    layout.forEach(binding => {
        let [type, idx, keycode, repeat] = binding,
            pressed;

        if (type === BUTTON) {
            let b = joy.buttons[idx];
            pressed = b && b.pressed; // gamepad might not have that many buttons
            
            if (pressed !== repeat)
                onPressed(keycode, pressed);
        } else {
            let v = joy.axes[idx % 16];
            pressed = (Math.abs(v) > joyDeadzone) && ((v > 0) == (idx > 15));
            
            if (pressed !== repeat)
                onPressed(keycode, Math.abs(v));
        }
        
        binding[3] = pressed;
    });
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
}