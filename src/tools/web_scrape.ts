import * as cheerio from 'cheerio';

export async function scrapeWebsite(url: string): Promise<string> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

        console.log(`🌍 Scraping URL: ${url}`);
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Remove script and style elements
        $('script, style, noscript, iframe, img, svg').remove();

        const title = $('title').text().trim();

        let content = '';
        $('p, h1, h2, h3, h4, h5, h6, li').each((_, el) => {
            const text = $(el).text().trim();
            if (text.length > 0) {
                content += text + '\n';
            }
        });

        if (!content) {
            content = $('body').text().trim().replace(/\s+/g, ' ');
        }

        // Truncate output to avoid Gemini context limit
        const maxLength = 6000;
        let finalContent = `[Title: ${title}]\n\n${content}`;

        if (finalContent.length > maxLength) {
            finalContent = finalContent.substring(0, maxLength) + '\n\n...[Content Truncated due to length limit]';
        }

        return finalContent;
    } catch (error: any) {
        console.error(`❌ Web Scrape Error (${url}):`, error.message);
        return `Failed to scrape website: ${error.message}`;
    }
}
