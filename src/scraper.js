import puppeteer from 'puppeteer';

class Scraper {
    #browser;

    constructor() {
        this.#browser = null;
    }

    async init() {
        this.#browser = await puppeteer.launch();        
    }
    async close() {
        await this.#browser.close();
    }    
    
}

export { Scraper };
