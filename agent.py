"""
FormFit AI Voice Agent
Real-time voice AI coach that interacts with users and controls exercise analysis

Users can say:
- "I want to do push ups"
- "Let's do some squats"  
- "How's my form?"
- "How many reps?"
- "Stop" / "End workout"
"""

from dotenv import load_dotenv
from livekit import agents, rtc
from livekit.agents import AgentSession, Agent, RoomInputOptions
from livekit.plugins import openai, noise_cancellation
import os
import json

load_dotenv(".env.local")


# ============================================================
# EXERCISE DATABASE
# ============================================================

EXERCISES = {
    "push_up": {
        "name": "Push Up",
        "aliases": ["push ups", "pushup", "pushups", "push-up"],
        "instructions": "Get into plank position, lower your chest to the ground, then push back up.",
        "tips": "Keep your core tight and body in a straight line."
    },
    "squat": {
        "name": "Squat", 
        "aliases": ["squats", "bodyweight squat", "air squat"],
        "instructions": "Stand with feet shoulder-width apart, lower down by bending knees, then stand back up.",
        "tips": "Keep your chest up and knees over your toes."
    },
    "bicep_curl": {
        "name": "Bicep Curl",
        "aliases": ["bicep curls", "curls", "arm curls"],
        "instructions": "Hold weights at your sides, curl up to shoulders, then lower slowly.",
        "tips": "Keep your elbows pinned to your sides."
    },
    "shoulder_press": {
        "name": "Shoulder Press",
        "aliases": ["shoulder presses", "overhead press", "military press"],
        "instructions": "Hold weights at shoulder height, press straight up overhead, then lower.",
        "tips": "Stack your wrists under your elbows."
    },
    "lunge": {
        "name": "Lunge",
        "aliases": ["lunges", "forward lunge"],
        "instructions": "Step forward, lower until both knees are at 90 degrees, then push back.",
        "tips": "Keep your front knee over your ankle."
    },
    "lateral_raise": {
        "name": "Lateral Raise",
        "aliases": ["lateral raises", "side raise", "side raises"],
        "instructions": "Hold weights at sides, raise arms out to shoulder height, then lower.",
        "tips": "Don't raise above shoulder height."
    }
}


def find_exercise(user_input: str) -> str | None:
    """Find exercise ID from user input"""
    user_input = user_input.lower().strip()
    
    for exercise_id, exercise in EXERCISES.items():
        if exercise["name"].lower() in user_input:
            return exercise_id
        for alias in exercise["aliases"]:
            if alias in user_input:
                return exercise_id
    return None


def get_exercise_list() -> str:
    """Get formatted list of available exercises"""
    return ", ".join([ex["name"] for ex in EXERCISES.values()])


# ============================================================
# WORKOUT STATE (shared with frontend via data channel)
# ============================================================

class WorkoutState:
    def __init__(self):
        self.active = False
        self.current_exercise = None
        self.reps = 0
        self.is_correct = False
        self.errors = []
        self.is_moving = False
    
    def start_exercise(self, exercise_id: str):
        self.active = True
        self.current_exercise = exercise_id
        self.reps = 0
        self.errors = []
    
    def end_exercise(self):
        self.active = False
        self.current_exercise = None
    
    def update_from_frontend(self, data: dict):
        """Update state from frontend pose analysis"""
        self.reps = data.get("reps", self.reps)
        self.is_correct = data.get("isCorrect", False)
        self.errors = data.get("errors", [])
        self.is_moving = data.get("isMoving", False)


workout_state = WorkoutState()


# ============================================================
# VOICE AI AGENT
# ============================================================

class FitnessCoachAgent(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions="""You are FormFit AI, a friendly and energetic voice fitness coach.

Your capabilities:
1. Start exercises when users request them (push ups, squats, curls, etc.)
2. Give real-time form feedback based on pose analysis data you receive
3. Count reps and track workout progress  
4. Provide exercise instructions and tips
5. Motivate and encourage users

Available exercises: Push Up, Squat, Bicep Curl, Shoulder Press, Lunge, Lateral Raise

Personality:
- Energetic and motivating like a personal trainer
- Clear and concise - users are exercising!
- Supportive but push users to improve
- Use short phrases during active exercise

When user wants to start an exercise:
1. Confirm the exercise enthusiastically
2. Give a brief instruction
3. Tell them to get in position
4. You'll receive form data to give feedback

Keep responses SHORT during exercise - users are moving!
"""
        )


# ============================================================
# LIVEKIT SESSION HANDLER  
# ============================================================

from livekit.agents import AgentServer

server = AgentServer()


@server.rtc_session()
async def fitness_session(ctx: agents.JobContext):
    """Main voice agent session"""
    
    session = AgentSession(
        llm=openai.realtime.RealtimeModel(
            voice="coral",  # Energetic voice
            temperature=0.7,
            model="gpt-4o-realtime-preview"
        )
    )
    
    agent = FitnessCoachAgent()
    
    # Handle data from frontend (pose analysis results)
    @ctx.room.on("data_received")
    def on_data(data: rtc.DataPacket):
        try:
            payload = json.loads(data.data.decode())
            
            if payload.get("type") == "pose_update":
                workout_state.update_from_frontend(payload)
                
            elif payload.get("type") == "rep_counted":
                workout_state.reps = payload.get("reps", 0)
                
            elif payload.get("type") == "exercise_selected":
                exercise_id = payload.get("exerciseId")
                if exercise_id:
                    workout_state.start_exercise(exercise_id)
                    
        except Exception as e:
            print(f"Error processing data: {e}")
    
    # Function to send commands to frontend
    async def send_to_frontend(command: dict):
        data = json.dumps(command).encode()
        await ctx.room.local_participant.publish_data(data)
    
    await session.start(
        room=ctx.room,
        agent=agent,
        room_input_options=RoomInputOptions(
            noise_cancellation=noise_cancellation.BVC(),
        ),
    )
    
    # Initial greeting
    await session.generate_reply(
        instructions="""Greet the user as their AI fitness coach! 
        Tell them you can help with exercises like push ups, squats, and curls.
        Ask what exercise they'd like to do today.
        Be energetic but brief!"""
    )


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":
    agents.cli.run_app(server)