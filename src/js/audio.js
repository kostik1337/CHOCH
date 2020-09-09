
// @ifdef DEBUG
let playButton = document.createElement("button")
playButton.innerHTML = "play sound";
playButton.onclick = function () {
    playing = !playing;
}
document.querySelector("#debug_div").appendChild(playButton);
// @endif

// let sampleRate = audioCtx.sampleRate;

// function createScriptNode(fn) {
//     let node = audioCtx.createScriptProcessor(null, 1, 1);
//     node.onaudioprocess = (event) => {
//         let outputBuffer = event.outputBuffer;
//         let inputBuffer = event.inputBuffer;
//         for (let channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
//             let inputData = inputBuffer.getChannelData(channel);
//             let outputData = outputBuffer.getChannelData(channel);

//             for (let sample = 0; sample < outputBuffer.length; sample++) {
//                 outputData[sample] = fn(channel, inputData[sample]);
//             }
//         }
//     }
//     return node;
// }

// function createLFO(freq) {
//     let phase = 0.;
//     return () => {
//         phase += 2. * Math.PI * freq / sampleRate;
//         phase = phase % (2. * Math.PI);
//         return Math.sin(phase);
//     }
// }

// function waveshape(gainFn) {
//     return createScriptNode((channel, input) => {
//         return Math.max(-1, Math.min(1, input * gainFn()));
//     });
// }

function setupAudioProcessor() {
    let context = new AudioContext();
    let t = (dt) => context.currentTime + dt

    let attackDecay = (param, attack, decay) => {
        //param.setValueAtTime(1.0, t(0))
        param.linearRampToValueAtTime(1.0, t(attack));
        param.linearRampToValueAtTime(0.0, t(attack + decay));
        // param.setTargetAtTime(0.0, t(attack+hold), decay);
    }

    let createRingmodNodes = (freq1, freq2) => {
        let osc = context.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq1;

        let osc2 = context.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = freq2;

        let ringgain = context.createGain();
        ringgain.gain.setValueAtTime(0, t(0))

        let gain = context.createGain();
        gain.gain.setValueAtTime(0, t(0))

        osc.connect(ringgain)
        osc2.connect(ringgain.gain)
        ringgain.connect(gain);

        osc.start();
        osc2.start();

        return [osc, osc2, gain]
    }

    let setupTypingProcessor = () => {
        let [, , gain] = createRingmodNodes(834, 1147)
        let filter = context.createBiquadFilter()
        filter.Q.setValueAtTime(5, t(0))
        filter.frequency.setValueAtTime(2500, t(0))
        filter.type = "bandpass"

        gain.connect(filter)
        filter.connect(context.destination)
        return () => {
            attackDecay(gain.gain, 0.01, 0.1)
        }
    }

    let setupMenuChangeProcessor = () => {
        let [osc, osc2, gain] = createRingmodNodes(0, 0)
        gain.connect(context.destination);
        return (freq) => {
            osc.frequency.value = freq
            osc2.frequency.value = freq * 1.33
            attackDecay(gain.gain, 0.01, 0.1)
        }
    }

    let setupCheckpointProcessor = () => {
        let [osc, osc2, gain] = createRingmodNodes(0, 0)

        let delayTime = 0.4
        let delay = context.createDelay(delayTime);
        delay.delayTime.setValueAtTime(delayTime, t(0));
        let delayGain = context.createGain();
        delayGain.gain.setValueAtTime(0.4, t(0))

        gain.connect(delay)
        delay.connect(delayGain)
        delayGain.connect(delay)
        gain.connect(context.destination);
        delayGain.connect(context.destination);

        let notes = [440, 392]
        let playNote = (index) => {
            osc.frequency.setValueAtTime(notes[index], t(0))
            osc2.frequency.setValueAtTime(notes[index] * 1.45, t(0))
            attackDecay(gain.gain, 0.01, 0.4)
        }
        return () => {
            playNote(0)
            setTimeout(() => playNote(1), 1000 * delayTime / 4)
            setTimeout(() => playNote(0), 1000 * delayTime / 2)
        }
    }

    let setupDeathProcessor = () => {
        let gain = context.createGain();
        gain.gain.setValueAtTime(0, t(0))

        let detuneCents = 20
        for (let i = -1; i <= 1; ++i) {
            let osc = context.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.value = 55 * Math.pow(2, i*detuneCents / 1200);
            osc.start();
            osc.connect(gain);
        }

        let filter = context.createBiquadFilter()
        filter.Q.setValueAtTime(1, t(0))
        filter.frequency.setValueAtTime(1000, t(0))
        filter.type = "lowpass"
        gain.connect(filter);
        filter.connect(context.destination);

        return () => {
            attackDecay(gain.gain, 0.01, 0.5)
        }
    }

    let typingProcs = Array(3).fill().map(setupTypingProcessor)
    let typingProcIndex = 0
    let menuProc = setupMenuChangeProcessor()
    let checkpointProc = setupCheckpointProcessor()
    let deathProc = setupDeathProcessor()

    return {
        typingFn: () => {
            typingProcs[(++typingProcIndex) % typingProcs.length]()
        },
        menuChangeFn: (isLeftRight) => {
            menuProc(isLeftRight ? 550 : 660)
        },
        checkpoint: checkpointProc,
        lastCheckpoint: checkpointProc,
        death: deathProc,
    }
}

let audioProcessor = null

function getAudioProcessor() {
    if (!audioProcessor) audioProcessor = setupAudioProcessor()
    return audioProcessor
}

let BPM = 120;
let index = 0;
let sequence = [0, 2, 3, 5];
let playing = true;

function playNote(note) {
    //audioProcessor.typingFn()

    // let oscillator = audioCtx.createOscillator();
    // oscillator.type = 'square';
    // oscillator.frequency.setValueAtTime(110 * Math.pow(2, note / 12), audioCtx.currentTime);

    // let filterDecayTime = 0.1;
    // let biquadFilter = audioCtx.createBiquadFilter();
    // biquadFilter.type = "lowpass";
    // biquadFilter.frequency
    //     .setValueAtTime(1000, audioCtx.currentTime)
    //     .linearRampToValueAtTime(100, audioCtx.currentTime + filterDecayTime);
    // biquadFilter.Q.setValueAtTime(5, audioCtx.currentTime);

    // let gain = audioCtx.createGain();
    // let decayTime = 1;
    // gain.gain
    //     .setValueAtTime(0.3, audioCtx.currentTime)
    //     .exponentialRampToValueAtTime(0.001, audioCtx.currentTime + decayTime)
    //     .setValueAtTime(0, audioCtx.currentTime + decayTime);

    // oscillator
    //     .connect(biquadFilter)
    //     .connect(gain)
    //     .connect(audioCtx.destination);
    // oscillator.start();
}

//scheduleNote();

// function scheduleNote() {
//     let note = sequence[Math.floor(index)];
//     index = (index + 1 / 8) % sequence.length;
//     window.setTimeout(scheduleNote, 60_000 / 4 / BPM);
//     if (note != null && playing) playNote(note);
// }