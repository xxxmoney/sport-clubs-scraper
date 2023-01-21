import { Scraper } from './src/scraper.js';

(async () => {
    const scraper = new Scraper();
    await scraper.init();

    // Do something with scraper

    await scraper.close();
})();
