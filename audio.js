/* ========================================
   MOLBIT AUDIO SYSTEM
   ======================================== */

class AudioSystem {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.enabled = true;
        
        // Element frequencies (musical notes)
        this.elementFrequencies = {
            'H': 261.63,  // C4
            'C': 293.66,  // D4
            'N': 329.63,  // E4
            'O': 349.23,  // F4
            'P': 392.00,  // G4
            'S': 440.00,  // A4
            'Cl': 493.88, // B4
            'Na': 523.25, // C5
            'K': 587.33,  // D5
            'Ca': 659.25  // E5
        };
        
        this.init();
    }
    
    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = 0.3; // Master volume
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
            this.enabled = false;
        }
    }
    
    /**
     * Play a single tone for an atom
     */
    playAtomSound(element, duration = 0.2) {
        if (!this.enabled || !this.audioContext) return;
        
        const frequency = this.elementFrequencies[element] || 440;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        // Envelope
        const now = this.audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.5, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
        
        oscillator.start(now);
        oscillator.stop(now + duration);
    }
    
    /**
     * Play a chord for a bond (both atoms together)
     */
    playBondSound(element1, element2, bondType = 1) {
        if (!this.enabled || !this.audioContext) return;
        
        const freq1 = this.elementFrequencies[element1] || 440;
        const freq2 = this.elementFrequencies[element2] || 440;
        
        const duration = 0.3 + (bondType * 0.1); // Longer for stronger bonds
        
        // Play both frequencies
        this.playTone(freq1, duration, 0.3);
        this.playTone(freq2, duration, 0.3);
        
        // Add harmonic for bond strength
        if (bondType === 2) {
            this.playTone((freq1 + freq2) / 2, duration, 0.2); // Double bond
        } else if (bondType === 3) {
            this.playTone((freq1 + freq2) / 2, duration, 0.2); // Triple bond
            this.playTone(freq1 * 1.5, duration * 0.5, 0.15); // Harmonic
        }
    }
    
    /**
     * Play ionic bond sound (different from covalent)
     */
    playIonicBondSound(element1, element2) {
        if (!this.enabled || !this.audioContext) return;
        
        const freq1 = this.elementFrequencies[element1] || 440;
        const freq2 = this.elementFrequencies[element2] || 440;
        
        // Ionic bonds sound different - rising tone
        const now = this.audioContext.currentTime;
        const duration = 0.4;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.type = 'sawtooth'; // Different waveform for ionic
        oscillator.frequency.setValueAtTime(freq1, now);
        oscillator.frequency.exponentialRampToValueAtTime(freq2, now + duration);
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.4, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
        
        oscillator.start(now);
        oscillator.stop(now + duration);
    }
    
    /**
     * Play success sound (molecule complete)
     */
    playSuccessSound() {
        if (!this.enabled || !this.audioContext) return;
        
        // Happy ascending arpeggio
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C-E-G-C (major chord)
        const noteLength = 0.15;
        
        notes.forEach((freq, index) => {
            setTimeout(() => {
                this.playTone(freq, noteLength, 0.4);
            }, index * 100);
        });
    }
    
    /**
     * Play error sound
     */
    playErrorSound() {
        if (!this.enabled || !this.audioContext) return;
        
        // Descending tone
        const now = this.audioContext.currentTime;
        const duration = 0.3;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(400, now);
        oscillator.frequency.exponentialRampToValueAtTime(200, now + duration);
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
        
        oscillator.start(now);
        oscillator.stop(now + duration);
    }
    
    /**
     * Play hint sound
     */
    playHintSound() {
        if (!this.enabled || !this.audioContext) return;
        
        this.playTone(659.25, 0.1, 0.3); // E
        setTimeout(() => this.playTone(783.99, 0.1, 0.3), 100); // G
    }
    
    /**
     * Helper: Play a single tone
     */
    playTone(frequency, duration, volume = 0.3) {
        if (!this.enabled || !this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        const now = this.audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
        
        oscillator.start(now);
        oscillator.stop(now + duration);
    }
    
    /**
     * Toggle audio on/off
     */
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
    
    /**
     * Set master volume (0-1)
     */
    setVolume(volume) {
        if (this.masterGain) {
            this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
        }
    }
}

// Export as global
window.audioSystem = new AudioSystem();
