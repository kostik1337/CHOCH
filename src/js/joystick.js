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
        } else {
            let v = joy.axes[idx % 16];
            pressed = (Math.abs(v) > joyDeadzone) && ((v > 0) == (idx > 15));
        }

        if (pressed !== repeat)
            onPressed(keycode, pressed);
        
        binding[3] = pressed;
    });
}