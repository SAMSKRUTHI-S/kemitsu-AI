/**
 * Advanced Web Audio API Sound Synthesizer for Demon Slayer Anime Effects
 * Real-time synthesized effects for Water, Flame, Thunder, Sun, Beast Breathing!
 */
const SoundManager = {
    audioCtx: null,
    muted: localStorage.getItem('kimetsu_sound_muted') === 'true',

    init() {
        if (!this.audioCtx && (window.AudioContext || window.webkitAudioContext)) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();
        }
    },

    toggle() {
        this.muted = !this.muted;
        localStorage.setItem('kimetsu_sound_muted', this.muted);
        return !this.muted;
    },

    isMuted() {
        return this.muted;
    },

    getNow() {
        this.init();
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
        return this.audioCtx.currentTime;
    },

    // 1. Water Breathing: Fluid whoosh & gentle splash
    playWater() {
        if (this.muted) return;
        try {
            const now = this.getNow();
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            const filter = this.audioCtx.createBiquadFilter();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(180, now + 0.35);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1200, now);
            filter.frequency.linearRampToValueAtTime(300, now + 0.35);

            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start(now);
            osc.stop(now + 0.4);
            this.playBladeSheen(now, 1800);
        } catch (e) {}
    },

    // 2. Flame Breathing: Roaring fiery explosive whoosh
    playFlame() {
        if (this.muted) return;
        try {
            const now = this.getNow();
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(160, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);

            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.45);
            this.playBladeSheen(now, 2600);
        } catch (e) {}
    },

    // 3. Thunder Breathing: Sharp electric lightning snap
    playThunder() {
        if (this.muted) return;
        try {
            const now = this.getNow();
            // Sharp snap
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(2800, now);
            osc.frequency.exponentialRampToValueAtTime(90, now + 0.22);

            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.26);

            // Sub bass rumble
            const rumble = this.audioCtx.createOscillator();
            const rumbleGain = this.audioCtx.createGain();
            rumble.type = 'sine';
            rumble.frequency.setValueAtTime(90, now + 0.05);
            rumble.frequency.linearRampToValueAtTime(30, now + 0.35);
            rumbleGain.gain.setValueAtTime(0.25, now + 0.05);
            rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            rumble.connect(rumbleGain);
            rumbleGain.connect(this.audioCtx.destination);
            rumble.start(now + 0.05);
            rumble.stop(now + 0.42);
        } catch (e) {}
    },

    // 4. Sun Breathing: Resonant sacred blade hum
    playSun() {
        if (this.muted) return;
        try {
            const now = this.getNow();
            [440, 660, 880, 1320].forEach((freq, idx) => {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.02);
                gain.gain.setValueAtTime(0.12, now + idx * 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

                osc.connect(gain);
                gain.connect(this.audioCtx.destination);
                osc.start(now + idx * 0.02);
                osc.stop(now + 0.5);
            });
            this.playBladeSheen(now, 3200);
        } catch (e) {}
    },

    // 5. Beast Breathing: Dual blade rip / savage clash
    playBeast() {
        if (this.muted) return;
        try {
            const now = this.getNow();
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(950, now);
            osc.frequency.exponentialRampToValueAtTime(140, now + 0.28);
            gain.gain.setValueAtTime(0.22, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.32);
            this.playBladeSheen(now, 2100);
        } catch (e) {}
    },

    // Metallic blade sheen overtone
    playBladeSheen(now, startFreq) {
        try {
            const metal = this.audioCtx.createOscillator();
            const metalGain = this.audioCtx.createGain();
            metal.type = 'triangle';
            metal.frequency.setValueAtTime(startFreq, now);
            metal.frequency.exponentialRampToValueAtTime(startFreq * 0.4, now + 0.18);
            metalGain.gain.setValueAtTime(0.15, now);
            metalGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

            metal.connect(metalGain);
            metalGain.connect(this.audioCtx.destination);
            metal.start(now);
            metal.stop(now + 0.22);
        } catch (e) {}
    },

    // Play based on technique name
    playBreathing(style) {
        switch ((style || '').toLowerCase()) {
            case 'flame': this.playFlame(); break;
            case 'thunder': this.playThunder(); break;
            case 'sun': this.playSun(); break;
            case 'beast': this.playBeast(); break;
            case 'water':
            default: this.playWater(); break;
        }
    },

    // Standard blade unsheathe slash
    playSlash() {
        this.playWater();
    },

    // Kasugai Crow Dispatch Receive Chime
    playChime() {
        if (this.muted) return;
        try {
            const now = this.getNow();
            const freqs = [587.33, 880, 1174.66, 1760];
            freqs.forEach((freq, idx) => {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.05);
                gain.gain.setValueAtTime(0.08, now + idx * 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45 + idx * 0.06);

                osc.connect(gain);
                gain.connect(this.audioCtx.destination);
                osc.start(now + idx * 0.05);
                osc.stop(now + 0.6);
            });
        } catch (e) {}
    },

    // Hover sounds for distinct buttons
    playHover(type = 'default') {
        if (this.muted) return;
        try {
            const now = this.getNow();
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            switch (type) {
                case 'water':
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(520, now);
                    osc.frequency.exponentialRampToValueAtTime(320, now + 0.08);
                    gain.gain.setValueAtTime(0.05, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
                    break;
                case 'flame':
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(180, now);
                    osc.frequency.linearRampToValueAtTime(80, now + 0.08);
                    gain.gain.setValueAtTime(0.04, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
                    break;
                case 'thunder':
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(1200, now);
                    osc.frequency.exponentialRampToValueAtTime(2400, now + 0.05);
                    gain.gain.setValueAtTime(0.03, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
                    break;
                case 'sun':
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(880, now);
                    osc.frequency.linearRampToValueAtTime(1100, now + 0.1);
                    gain.gain.setValueAtTime(0.04, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
                    break;
                case 'beast':
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(240, now);
                    osc.frequency.exponentialRampToValueAtTime(140, now + 0.07);
                    gain.gain.setValueAtTime(0.05, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                    break;
                case 'scroll':
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(700, now);
                    osc.frequency.exponentialRampToValueAtTime(450, now + 0.06);
                    gain.gain.setValueAtTime(0.04, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
                    break;
                case 'art':
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(650, now);
                    osc.frequency.exponentialRampToValueAtTime(950, now + 0.08);
                    gain.gain.setValueAtTime(0.05, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
                    break;
                default:
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(600, now);
                    osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);
                    gain.gain.setValueAtTime(0.03, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                    break;
            }

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.12);
        } catch (e) {}
    },

    playClick() {
        if (this.muted) return;
        try {
            const now = this.getNow();
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(900, now);
            osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);
            gain.gain.setValueAtTime(0.07, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.05);
        } catch (e) {}
    }
};
