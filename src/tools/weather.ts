export async function getWeather(location: string): Promise<string> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        // 1. Geocoding
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`, {
            signal: controller.signal
        });

        if (!geoRes.ok) {
            clearTimeout(timeoutId);
            throw new Error(`Geocoding HTTP error! status: ${geoRes.status}`);
        }

        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            clearTimeout(timeoutId);
            return `I couldn't find a location matching "${location}".`;
        }

        const { latitude, longitude, name, country } = geoData.results[0];

        // 2. Weather
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`, {
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!weatherRes.ok) {
            throw new Error(`Weather HTTP error! status: ${weatherRes.status}`);
        }

        const weatherData = await weatherRes.json();
        const current = weatherData.current_weather;

        const weatherMap: Record<number, string> = {
            0: "Clear sky ☀️",
            1: "Mainly clear 🌤️",
            2: "Partly cloudy ⛅",
            3: "Overcast ☁️",
            45: "Foggy 🌫️",
            48: "Depositing rime fog 🌫️",
            51: "Light drizzle 🌧️",
            53: "Moderate drizzle 🌧️",
            55: "Dense drizzle 🌧️",
            61: "Slight rain 🌧️",
            63: "Moderate rain 🌧️",
            65: "Heavy rain 🌧️",
            71: "Slight snow fall ❄️",
            73: "Moderate snow fall ❄️",
            75: "Heavy snow fall ❄️",
            95: "Thunderstorm ⛈️"
        };

        const condition = weatherMap[current.weathercode] || "Mixed conditions";

        return `${name}, ${country}: ${condition}, ${current.temperature}°C (Wind: ${current.windspeed} km/h)`;
    } catch (error) {
        console.error("❌ Weather API Error:", error);
        return "Unable to fetch weather data for that location at the moment.";
    }
}
