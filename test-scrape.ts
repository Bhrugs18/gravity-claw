import { scrapeWebsite } from './src/tools/web_scrape.js';

async function test() {
    console.log("Testing web scrape...");
    const text = await scrapeWebsite("https://example.com");
    console.log(text);
}

test();
