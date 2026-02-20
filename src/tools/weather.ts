export async function getWeather(location: string): Promise<string> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(`https://wttr.in/${encodeURIComponent(location)}?format=3`, {
            headers: {
                'User-Agent': 'curl/8.5.0'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return (await response.text()).trim();
    } catch (error) {
        console.error("❌ Weather API Error:", error);
        return "Unable to fetch weather data for that location at the moment.";
    }
}
