
// @ifdef DEBUG
let playButton = document.createElement("button")
playButton.innerHTML = "play sound";
playButton.onclick = function () {
    playing = !playing;
}
document.querySelector("#debug_div").appendChild(playButton);
// @endif

function setupAudioProcessor() {
    let context = new AudioContext();
    let t = (dt) => context.currentTime + dt

    let reverb = Freeverb(context)
    reverb.roomSize = 0.7
    reverb.dampening = 4000
    reverb.wet.value = .5
    reverb.dry.value = .0
    reverb.connect(context.destination);

    let attackDecay = (param, attack, decay, maxVal = 1, minVal = 0) => {
        //param.setValueAtTime(1.0, t(0))
        param.linearRampToValueAtTime(maxVal, t(attack));
        param.linearRampToValueAtTime(minVal, t(attack + decay));
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

        let delayTime = 0.45
        let delay = context.createDelay(delayTime);
        delay.delayTime.setValueAtTime(delayTime, t(0));
        let delayGain = context.createGain();
        delayGain.gain.setValueAtTime(0.5, t(0))

        gain.connect(delay)
        delay.connect(delayGain)
        delayGain.connect(delay)
        gain.connect(reverb);
        delayGain.connect(reverb);

        let notes = [440, 220, 440]
        let playNote = (index) => {
            osc.frequency.setValueAtTime(notes[index], t(0))
            osc2.frequency.setValueAtTime(notes[index] * .75, t(0))
            attackDecay(gain.gain, 0.03, 0.3)
        }
        return () => {
            playNote(0)
            setTimeout(() => playNote(1), 1000 * delayTime / 4)
            setTimeout(() => playNote(2), 1000 * delayTime / 2)
        }
    }

    let setupDeathProcessor = () => {
        let gain = context.createGain();
        gain.gain.setValueAtTime(0, t(0))

        let detuneCents = 20
        for (let i = -1; i <= 1; ++i) {
            let osc = context.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.value = 55 * Math.pow(2, i * detuneCents / 1200);
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

    let setupAmbient = () => {
        let lfo = context.createOscillator()
        lfo.frequency.value = 0.119
        lfo.type = 'sine';
        lfo.start();

        let lfoGain = context.createGain()
        lfoGain.gain.setValueAtTime(10, t(0))

        let delay = context.createDelay(1.0);
        delay.delayTime.setValueAtTime(1.0, t(0));
        let delayGain = context.createGain();
        delayGain.gain.setValueAtTime(0.9, t(0));

        let gain = context.createGain();
        gain.gain.setValueAtTime(0, t(0));

        // minor 7-th
        [220, 220*4/3, 370].forEach((fr) => {
            let osc = context.createOscillator();
            osc.frequency.value = fr
            osc.type = 'sine';
            osc.start();
            osc.connect(gain)
            lfoGain.connect(osc.detune)
        })

        lfo.connect(lfoGain)
        gain.connect(delay)
        delay.connect(delayGain)
        delayGain.connect(delay)
        delay.connect(reverb)

        return (on) => {
            if(on) {
                gain.gain.linearRampToValueAtTime(0.3, t(2));
            } else {
                gain.gain.setValueAtTime(0, t(0));    
            }
        }
    }

    let typingProcs = Array(3).fill().map(setupTypingProcessor)
    let typingProcIndex = 0
    let menuProc = setupMenuChangeProcessor()
    let checkpointProc = setupCheckpointProcessor()
    let deathProc = setupDeathProcessor()
    let ambientProc = setupAmbient()

    return {
        ctx: context,
        startTime: t(0),
        typingFn: () => {
            typingProcs[(++typingProcIndex) % typingProcs.length]()
        },
        menuChangeFn: (isLeftRight) => {
            menuProc(isLeftRight ? 550 : 660)
        },
        checkpoint: checkpointProc,
        lastCheckpoint: checkpointProc,
        death: deathProc,
        ambient: ambientProc
    }
}

let audioProcessor = null

function getAudioProcessor() {
    if (!audioProcessor) audioProcessor = setupAudioProcessor()
    return audioProcessor
}