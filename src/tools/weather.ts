import axios from 'axios';

export async function getWeather(location: string): Promise<string> {
    try {
        const response = await axios.get(`https://wttr.in/${encodeURIComponent(location)}?format=3`, { timeout: 10000 });
        return response.data.trim();
    } catch (error) {
        console.error("❌ Weather API Error:", error);
        return "Unable to fetch weather data for that location at the moment.";
    }
}
