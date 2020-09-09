
// @ifdef DEBUG
let playButton = document.createElement("button")
playButton.innerHTML = "play sound";
playButton.onclick = function () {
    playing = !playing;
}
document.querySelector("#debug_div").appendChild(playButton);
// @endif

let saturate = (threshold) => (x) => Math.max(-threshold, Math.min(threshold, x));

// from https://www.musicdsp.org/en/latest/Effects/203-fold-back-distortion.html
let fold = (threshold) => (x) => {
    if (x > threshold || x < -threshold) {
        x = Math.abs(Math.abs(x - threshold % (threshold * 4)) - threshold * 2) - threshold;
    }
    return x;
}

function setupAudioProcessor() {
    let context = new AudioContext();
    let t = (dt) => context.currentTime + dt

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

        let reverb = Freeverb(context)
        reverb.roomSize = 0.7
        reverb.dampening = 4000
        reverb.wet.value = .5
        reverb.dry.value = .0

        gain.connect(delay)
        delay.connect(delayGain)
        delayGain.connect(delay)
        gain.connect(reverb);
        delayGain.connect(reverb);
        reverb.connect(context.destination);

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

    let setupMusicProcecssor = () => {
        let setWaveshaperCurve = (shaper, samples, fn) => {
            let curve = new Float32Array(samples)
            for (let i = 0; i < samples; ++i) {
                let normalized = (i / (samples - 1)) * 2 - 1;
                curve[i] = fn(normalized, i);
            }
            shaper.curve = curve
        }

        let setupHihat = () => {
            let bufferSize = context.sampleRate * 1;
            let buffer = context.createBuffer(1, bufferSize, context.sampleRate);
            for (let i = 0; i < bufferSize; i++) {
                buffer.getChannelData(0)[i] = Math.random() * 2 - 1;
            }
            let noise = context.createBufferSource();
            noise.buffer = buffer;
            noise.loop = true;
            noise.start();

            let gain = context.createGain();
            gain.gain.setValueAtTime(0, t(0))

            let filter = context.createBiquadFilter()
            filter.Q.setValueAtTime(1, t(0))
            filter.frequency.setValueAtTime(11000, t(0))
            filter.type = "highpass"

            noise.connect(gain);
            gain.connect(filter);
            filter.connect(context.destination);

            return () => {
                attackDecay(gain.gain, 0.0, 0.08, 0.1)
            }
        }

        let setupBassDrum = () => {
            let osc = context.createOscillator();
            osc.type = 'sine';
            osc.start();

            let gain = context.createGain()
            gain.gain.setValueAtTime(0, t(0))

            osc.connect(gain);
            gain.connect(context.destination);

            return () => {
                gain.gain.cancelScheduledValues(t(0))
                attackDecay(gain.gain, 0.01, 0.5)
                attackDecay(osc.frequency, 0.01, 0.04, 200, 40)
            }
        }

        let setupBass = () => {
            let osc = context.createOscillator();
            osc.frequency.value = 55
            osc.type = 'square';
            osc.start();

            let filter = context.createBiquadFilter()
            filter.Q.setValueAtTime(1, t(0))
            filter.frequency.setValueAtTime(100, t(0))
            filter.type = "lowpass"

            let gain = context.createGain()
            gain.gain.setValueAtTime(1, t(0))

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(context.destination);

            return () => {
                gain.gain.cancelScheduledValues(t(0))
                attackDecay(gain.gain, 0.01, 0.5)
                attackDecay(osc.frequency, 0.01, 0.04, 200, 30)
            }
        }

        // let setupLead = () => {
        //     let osc = context.createOscillator();
        //     osc.type = 'sine';
        //     osc.frequency.value = 220;
        //     osc.start();

        //     let [, , foldGain, folder] = createSaturateFold()
        //     let gain = context.createGain()
        //     gain.gain.value = 0

        //     let lfo1 = context.createOscillator()
        //     lfo1.type = 'sine';
        //     lfo1.frequency.value = 0.1;
        //     lfo1.start();

        //     let lfoGain = context.createGain()
        //     lfoGain.gain.value = 0.25

        //     let constant = context.createConstantSource()
        //     constant.offset.value = 0.75

        //     lfo1.connect(lfoGain)
        //     lfoGain.connect(foldGain.gain)
        //     constant.connect(foldGain.gain)

        //     osc.connect(foldGain);
        //     foldGain.connect(folder);
        //     folder.connect(gain);
        //     gain.connect(context.destination);

        //     return (freq) => {
        //         osc.frequency.value = freq
        //         attackDecay(gain.gain, 0.01, 0.1, 2)
        //     }
        // }

        let hihat = setupHihat()
        let bassDrum = setupBassDrum()
        let bass = setupBass()
        // let lead = setupLead()

        return {
            hihat: hihat,
            bassDrum: bassDrum,
            bass: bass
        }
    }

    let typingProcs = Array(3).fill().map(setupTypingProcessor)
    let typingProcIndex = 0
    let menuProc = setupMenuChangeProcessor()
    let checkpointProc = setupCheckpointProcessor()
    let deathProc = setupDeathProcessor()
    let musicProc = setupMusicProcecssor()

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
        music: musicProc
    }
}

let audioProcessor = null

function getAudioProcessor() {
    if (!audioProcessor) audioProcessor = setupAudioProcessor()
    return audioProcessor
}

// let sequence = [0, 2, 3, 5];
// let playing = true;

function setupSequencer() {
    let BPM = 120, sixteenthTime = 60 / 4 / BPM;

    let prevNote = 0
    let bassDrumPattern = [1, 0, 0, 1, 0, 0, 1, 0]
    let noteToFreq = (base, n) => base * Math.pow(2, n / 12)

    function scheduleNote() {
        setTimeout(scheduleNote, 50);
        if (audioProcessor) {
            let noteIdx = Math.floor((audioProcessor.ctx.currentTime - audioProcessor.startTime) / sixteenthTime)
            if (noteIdx > prevNote) {
                prevNote = noteIdx

                // if (noteIdx % 16 == 0) {
                //     let bassNote = bassPattern[Math.round(noteIdx / 16) % bassPattern.length]
                //     audioProcessor.music.bass[1](noteToFreq(88, bassNote))
                // }
                //audioProcessor.music.lead(noteToFreq(220, leadPattern[noteIdx % leadPattern.length]))
                if (bassDrumPattern[noteIdx % bassDrumPattern.length]) {
                    audioProcessor.music.bassDrum()
                    audioProcessor.music.bass[0]()
                }
                //else audioProcessor.music.hihat()
            }
            //playNote(note);
        }
    }
    scheduleNote();
}

setupSequencer()