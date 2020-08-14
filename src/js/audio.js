
// @ifdef DEBUG
var playButton = document.createElement("button")
playButton.innerHTML = "play sound";
playButton.onclick = function () {
    playing = !playing;
}
document.querySelector("#debug_div").appendChild(playButton);
// @endif

let audioCtx = new AudioContext();
let sampleRate = audioCtx.sampleRate;

function createScriptNode(fn) {
    let node = audioCtx.createScriptProcessor(null, 1, 1);
    node.onaudioprocess = (event) => {
        let outputBuffer = event.outputBuffer;
        let inputBuffer = event.inputBuffer;
        for (let channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
            let inputData = inputBuffer.getChannelData(channel);
            let outputData = outputBuffer.getChannelData(channel);

            for (let sample = 0; sample < outputBuffer.length; sample++) {
                outputData[sample] = fn(channel, inputData[sample]);
            }
        }
    }
    return node;
}

function createLFO(freq) {
    let phase = 0.;
    return () => {
        phase += 2. * Math.PI * freq / sampleRate;
        phase = phase % (2. * Math.PI);
        return Math.sin(phase);
    }
}

function waveshape(gainFn) {
    return createScriptNode((channel, input) => {
        return Math.max(-1, Math.min(1, input * gainFn()));
    });
}

let BPM = 120;
let index = 0;
let sequence = [0, 2, 3, 5];
let playing = true;

function playNote(note) {
    let oscillator = audioCtx.createOscillator();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(110 * Math.pow(2, note / 12), audioCtx.currentTime);

    let filterDecayTime = 0.1;
    let biquadFilter = audioCtx.createBiquadFilter();
    biquadFilter.type = "lowpass";
    biquadFilter.frequency
        .setValueAtTime(1000, audioCtx.currentTime)
        .linearRampToValueAtTime(100, audioCtx.currentTime + filterDecayTime);
    biquadFilter.Q.setValueAtTime(5, audioCtx.currentTime);

    let gain = audioCtx.createGain();
    let decayTime = 1;
    gain.gain
        .setValueAtTime(0.3, audioCtx.currentTime)
        .exponentialRampToValueAtTime(0.001, audioCtx.currentTime + decayTime)
        .setValueAtTime(0, audioCtx.currentTime + decayTime);

    oscillator
        .connect(biquadFilter)
        .connect(gain)
        .connect(audioCtx.destination);
    oscillator.start();
}

scheduleNote();

function scheduleNote() {
    let note = sequence[Math.floor(index)];
    index = (index + 1/8) % sequence.length;
    window.setTimeout(scheduleNote, 60_000 / 4 / BPM);
    if (note != null && playing) playNote(note);
}