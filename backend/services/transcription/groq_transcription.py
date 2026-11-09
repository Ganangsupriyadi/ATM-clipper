from groq import Groq
import os

def transcribe_audio_groq(audio_path: str):
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable not set")
    client = Groq(api_key=api_key)
    with open(audio_path, "rb") as file:
        transcription = client.audio.transcriptions.create(
            file=(os.path.basename(audio_path), file.read()),
            model="whisper-large-v3",
            response_format="verbose_json",
            temperature=0.0
        )
    return transcription
