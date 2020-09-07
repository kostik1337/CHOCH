let joy;
let joyDeadzone = 0.33;

const AXIS = 0;
const BUTTON = 1;

// add 16 to axis value to invert it
const layout = [
    // dpad FIXME now it's abcd keys or whateh
    {
        //alias: 'UP',
        type: BUTTON,
        button: 0,
        keyCode: 38,
    },
    {
        //alias: 'RIGHT',
        type: BUTTON,
        button: 1,
        keyCode: 39,
    },
    {
        //alias: 'DOWN',
        type: BUTTON,
        button: 2,
        keyCode: 40,
    },
    {
        //alias: 'LEFT',
        type: BUTTON,
        button: 3,
        keyCode: 37,
    },
    // mushroom
    {
        //alias: 'UP',
        type: AXIS,
        axis: 1,
        keyCode: 38,
    },
    {
        //alias: 'RIGHT',
        type: AXIS,
        axis: 0 + 16,
        keyCode: 39,
    },
    {
        //alias: 'DOWN',
        type: AXIS,
        axis: 1 + 16,
        keyCode: 40,
    },
    {
        //alias: 'LEFT',
        type: AXIS,
        axis: 0,
        keyCode: 37,
    },
    // start button
    {
        //alias: 'RETURN',
        type: BUTTON,
        button: 9,
        keyCode: 13,
    }
];


window.addEventListener("gamepadconnected", e=>joy=e.gamepad);


function joyInput(joy, onPressed) {
    layout.forEach(binding => {
        let pressed, strength;

        if (binding.type === BUTTON) {
            let b = joy.buttons[binding.button];
            pressed = b && b.pressed; // gamepad might not have that many buttons
        } else {
            let v = joy.axes[binding.axis % 16];
            pressed = (Math.abs(v) > joyDeadzone) && ((v > 0) == (binding.axis > 15));
        }

        if (pressed !== binding.repeat)
            onPressed(binding.keyCode, pressed, strength);
        
        binding.repeat = pressed;
    });
}