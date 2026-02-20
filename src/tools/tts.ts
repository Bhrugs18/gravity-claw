import axios from 'axios';
import { config } from '../config.js';

/**
 * Generates an audio buffer from text using ElevenLabs API.
 * Uses a default voice (Rachel) for simplicity.
 */
export async function generateTTS(text: string): Promise<Buffer> {
    const voiceId = "21m00Tcm4TlvDq8ikWAM"; // Rachel - classic friendly voice
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    const response = await axios.post(url, {
        text: text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
        }
    }, {
        headers: {
            'Content-Type': 'application/json',
            'xi-api-key': config.ELEVENLABS_API_KEY
        },
        responseType: 'arraybuffer'
    });

    return Buffer.from(response.data);
}
