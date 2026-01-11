// ============================================================
// VOICE COACH - AI Voice Feedback System (Updated)
// ============================================================

class VoiceCoach {
    constructor() {
        this.synth = window.speechSynthesis;
        this.enabled = true;
        this.lastSpoke = 0;
        this.minGap = 3500;
        this.speaking = false;
        this.message = "";
        this.onChange = null;
        
        this.initVoice();
    }

    initVoice() {
        const setVoice = () => {
            const voices = this.synth.getVoices();
            this.voice = voices.find(v => v.lang.includes('en')) || voices[0];
        };
        
        if (this.synth.getVoices().length) {
            setVoice();
        } else {
            this.synth.onvoiceschanged = setVoice;
        }
    }

    speak(msg, force = false) {
        if (!this.enabled || !msg) return;
        
        const now = Date.now();
        if (!force && now - this.lastSpoke < this.minGap) return;

        this.synth.cancel();
        
        const utterance = new SpeechSynthesisUtterance(msg);
        utterance.voice = this.voice;
        utterance.rate = 1.1;
        
        utterance.onstart = () => {
            this.speaking = true;
            this.message = msg;
            this.onChange?.(true, msg);
        };
        
        utterance.onend = () => {
            this.speaking = false;
            this.lastSpoke = Date.now();
            this.onChange?.(false, "");
        };
        
        this.synth.speak(utterance);
    }

    /**
     * Get feedback message based on form analysis (Updated for Python-style)
     * @param {number} accuracy - Form score (for compatibility)
     * @param {Array} errors - List of form errors from Python-style checker
     * @param {boolean} isMoving - Is user moving
     * @param {boolean} isInPosition - Is user in exercise position
     */
    getFeedback(accuracy, errors, isMoving, isInPosition) {
        // Not moving - prompt to start
        if (!isMoving) {
            return "Start moving! Begin the exercise.";
        }
        
        // Not in proper position
        if (!isInPosition) {
            return "Get into position first.";
        }
        
        // Has errors - use the first error as feedback
        if (errors && errors.length > 0) {
            // Map error messages to voice-friendly versions
            const error = errors[0];
            
            if (error.includes("arms moving evenly")) {
                return "Keep your arms moving together!";
            }
            if (error.includes("wrists under elbows") || error.includes("Stack wrists")) {
                return "Stack your wrists under your elbows!";
            }
            if (error.includes("weight even")) {
                return "Keep your weight even on both legs!";
            }
            if (error.includes("knees go past toes")) {
                return "Don't let your knees go past your toes!";
            }
            if (error.includes("Go lower")) {
                return "Go lower for full range of motion!";
            }
            if (error.includes("elbow pinned")) {
                return "Keep your elbows pinned to your sides!";
            }
            if (error.includes("Curl both arms")) {
                return "Curl both arms evenly!";
            }
            if (error.includes("hips sag")) {
                return "Don't let your hips sag. Engage your core!";
            }
            if (error.includes("pike up")) {
                return "Don't pike up. Keep your body straight!";
            }
            if (error.includes("Push evenly")) {
                return "Push evenly with both arms!";
            }
            if (error.includes("Front knee")) {
                return "Keep your front knee over your ankle!";
            }
            if (error.includes("Raise both arms")) {
                return "Raise both arms evenly!";
            }
            if (error.includes("above shoulder")) {
                return "Don't raise your arms above shoulder height!";
            }
            
            // Default - just say the error
            return error;
        }
        
        // Good form while moving
        const goodMessages = [
            "Perfect form!",
            "Great job!",
            "Excellent technique!",
            "You're crushing it!",
            "Keep it up!"
        ];
        return goodMessages[Math.floor(Math.random() * goodMessages.length)];
    }

    announceRep(repCount) {
        if (!this.enabled) return;
        
        if (repCount === 1) {
            this.speak("One!", true);
        } else if (repCount === 5) {
            this.speak("Five! Great job!", true);
        } else if (repCount === 10) {
            this.speak("Ten! You're on fire!", true);
        } else if (repCount % 5 === 0) {
            this.speak(`${repCount}!`, true);
        } else {
            this.speak(`${repCount}`, true);
        }
    }

    announceStart(exerciseName) {
        this.speak(`Starting ${exerciseName}. Get into position and begin when ready!`, true);
    }

    announceEnd(exerciseName, reps) {
        this.speak(`Great workout! You did ${reps} reps of ${exerciseName}.`, true);
    }

    stop() {
        this.synth.cancel();
        this.speaking = false;
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) this.stop();
    }
}

// Singleton instance
const voiceCoach = new VoiceCoach();

export default voiceCoach;