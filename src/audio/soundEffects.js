// Web Audio API Synthesizer with Mobile Haptic Feedback

let audioCtx = null

function getAudioContext() {
    if (!audioCtx && typeof window !== 'undefined') {
        const AudioContext = window.AudioContext || window.webkitAudioContext
        if (AudioContext) {
            audioCtx = new AudioContext()
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {})
    }
    return audioCtx
}

// Mobile Haptic Feedback helper
function triggerHaptic(pattern) {
    try {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(pattern)
        }
    } catch {
        // ignore unsupported
    }
}

// 1. Pen Flick / Slingshot release sound + haptic tap
export function playFlickSound(power = 0.5) {
    triggerHaptic(Math.round(15 + power * 20))
    try {
        const ctx = getAudioContext()
        if (!ctx) return
        const t = ctx.currentTime

        // Snap click
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(320 + power * 240, t)
        osc.frequency.exponentialRampToValueAtTime(70, t + 0.08)

        gain.gain.setValueAtTime(0.3 * Math.min(1, power + 0.3), t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08)

        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(t)
        osc.stop(t + 0.09)

        // Noise whoosh
        const bufferSize = ctx.sampleRate * 0.06
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
        const data = buffer.getChannelData(0)
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1
        }
        const noise = ctx.createBufferSource()
        noise.buffer = buffer

        const filter = ctx.createBiquadFilter()
        filter.type = 'bandpass'
        filter.frequency.value = 1800 + power * 800

        const noiseGain = ctx.createGain()
        noiseGain.gain.setValueAtTime(0.2 * power, t)
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06)

        noise.connect(filter)
        filter.connect(noiseGain)
        noiseGain.connect(ctx.destination)
        noise.start(t)
        noise.stop(t + 0.06)
    } catch {
        // audio fail silent
    }
}

// 2. Pen-to-Pen clash sound + solid haptic impact
export function playClashSound(intensity = 0.5) {
    triggerHaptic(Math.round(20 + intensity * 35))
    try {
        const ctx = getAudioContext()
        if (!ctx) return
        const t = ctx.currentTime

        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.type = 'sine'
        osc.frequency.setValueAtTime(800 + Math.random() * 300, t)
        osc.frequency.exponentialRampToValueAtTime(140, t + 0.07)

        const vol = Math.min(0.4, Math.max(0.1, intensity * 0.4))
        gain.gain.setValueAtTime(vol, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07)

        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(t)
        osc.stop(t + 0.08)
    } catch {
        // audio fail silent
    }
}

// 3. Fall off table sound + double rumble
export function playFallSound() {
    triggerHaptic([40, 30, 40])
    try {
        const ctx = getAudioContext()
        if (!ctx) return
        const t = ctx.currentTime

        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(450, t)
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.35)

        gain.gain.setValueAtTime(0.25, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35)

        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(t)
        osc.stop(t + 0.36)
    } catch {
        // audio fail silent
    }
}

// 4. Round Won point chime
export function playPointSound() {
    triggerHaptic([25, 40, 50])
    try {
        const ctx = getAudioContext()
        if (!ctx) return
        const t = ctx.currentTime
        const notes = [523.25, 659.25, 783.99] // C5, E5, G5

        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.type = 'sine'
            osc.frequency.value = freq

            const noteTime = t + idx * 0.08
            gain.gain.setValueAtTime(0.2, noteTime)
            gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.4)

            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.start(noteTime)
            osc.stop(noteTime + 0.42)
        })
    } catch {
        // audio fail silent
    }
}

// 5. Match Victory celebration fanfare
export function playVictorySound() {
    triggerHaptic([60, 40, 60, 40, 100])
    try {
        const ctx = getAudioContext()
        if (!ctx) return
        const t = ctx.currentTime
        const notes = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6

        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.type = 'triangle'
            osc.frequency.value = freq

            const noteTime = t + idx * 0.12
            gain.gain.setValueAtTime(0.25, noteTime)
            gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.5)

            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.start(noteTime)
            osc.stop(noteTime + 0.55)
        })
    } catch {
        // audio fail silent
    }
}

// 6. Defeat sound
export function playDefeatSound() {
    triggerHaptic([80, 50, 80])
    try {
        const ctx = getAudioContext()
        if (!ctx) return
        const t = ctx.currentTime
        const notes = [440, 415.3, 392, 349.23]

        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.type = 'sine'
            osc.frequency.value = freq

            const noteTime = t + idx * 0.14
            gain.gain.setValueAtTime(0.2, noteTime)
            gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.4)

            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.start(noteTime)
            osc.stop(noteTime + 0.45)
        })
    } catch {
        // audio fail silent
    }
}
