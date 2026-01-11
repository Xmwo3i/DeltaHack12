// ============================================================
// VOICE COACH - AI Voice Feedback System
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

    getFeedback(accuracy, feedback) {
        if (accuracy >= 85) {
            const goodMessages = ["Perfect!", "Great form!", "Excellent!", "You're crushing it!"];
            return goodMessages[Math.floor(Math.random() * goodMessages.length)];
        }
        
        if (accuracy >= 65) {
            return "Good! Keep going!";
        }
        
        if (feedback?.length) {
            const f = feedback[0];
            if (f.includes('elbow') && f.includes('extend')) return "Extend your arms more!";
            if (f.includes('elbow') && f.includes('bend')) return "Bend deeper!";
            if (f.includes('knee') && f.includes('bend')) return "Lower down more!";
            if (f.includes('knee') && f.includes('extend')) return "Stand up straighter!";
            return "Check your form!";
        }
        
        return "Focus on form!";
    }

    announceRep(repCount) {
        if (!this.enabled) return;
        
        if (repCount === 5) {
            this.speak("5 reps! Nice!", true);
        } else if (repCount === 10) {
            this.speak("10! Halfway!", true);
        } else if (repCount % 5 === 0) {
            this.speak(`${repCount}!`, true);
        } else {
            this.speak(`${repCount}`, true);
        }
    }

    announceStart(exerciseName) {
        this.speak(`Starting ${exerciseName}. Begin when ready!`, true);
    }

    announceEnd(exerciseName, reps) {
        this.speak(`Done! ${reps} reps of ${exerciseName}. Great work!`, true);
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