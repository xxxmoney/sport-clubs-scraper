import { Browser, Page, launch } from 'puppeteer';

class Configuration {
    pageUrl;
    linksLimitOverride = null;
    loadNextSelector;
    loadNextInterval;
    linksSelector;
    setDescriptionInterval;
    linksCountInfoSelector;    
    linksCountInfoRegex;    
    /** @type {Array.<ConfigurationDescriptionItem>} */
    descriptionOptions;
}
class ConfigurationDescriptionItem {
    name;
    selector;
    regex = null;
    transformation = null;
}

class Link {
    url;
    /** @type {Description} */
    description;

    constructor(url) {
        this.url = url;
        this.description = new Description();
    }
}
class Description {
    /** @type {Array.<DescriptionItem>} */
    items;
    
    constructor() {
        this.items = [];
    }

    /** 
     * Adds description item to description.
     * @param {DescriptionItem} item 
    */
    add(item) {
        this.items.push(item);
    }
}
class DescriptionItem {
    name;
    value;

    constructor(name, value) {
        this.name = name;
        this.value = value;
    }
}

class Error {
    url;
    name;
    message;

    constructor(url, name, message) {
        this.url = url;
        this.name = name;
        this.message = message;
    }   

    toString() {
        return `${this.name}: ${this.message} (${this.url})`;
    }
}

class Scraper {
    /** @type {Browser} */
    #browser;
    /** @type {Array.<Link>} */
    #links;
    /** @type {Array.<Error>} */
    #errors;
    /** @type {Configuration} */
    #cofiguration;

    constructor(configuration) {
        this.#browser = null;
        this.#links = [];
        this.#errors = [];
        this.#cofiguration = configuration;
    }

    /** Initializes scraper. */
    async init() {
        this.#browser = await launch(); 
    } 
    /** Closes scraper. */
    async close() {
        await this.#browser.close();
    }    
     
    get links() {        
        return this.#links;
    }
    get errors() {        
        return this.#errors;
    }

    /** 
     * Gets links count from page. 
     * @param {Page} page
    */
    async #getLinksCount(page) {
        const linksCountInfo = await page.evaluate((selector) => {
            const element = document.querySelector(selector);
            return element ? element.innerText : null;
        }, this.#cofiguration.linksCountInfoSelector);

        if (linksCountInfo) {
            const match = linksCountInfo.match(this.#cofiguration.linksCountInfoRegex);
            if (match) {
                return parseInt(match[0].replace(" ", ""));
            }

            throw new Error("Links count info does not match regex.");
        }

        throw new Error("Links count info not found.");
    }    
    /** 
     * Loads next links. 
     * @param {Page} page
    */
    async #loadNext(page) {
        await page.evaluate((selector) => {
            const element = document.querySelector(selector);
            if (element) {
                element.click();
            }
        }, this.#cofiguration.loadNextSelector);

        // Timeout with promise
        await new Promise(resolve => setTimeout(resolve, this.#cofiguration.loadNextInterval));        
    }
    /** 
     * Returns links' hrefs. 
     * @param {Page} page
    */
    async #getLinkHrefs(page) {
        return await page.evaluate((selector) => {
            const anchors = Array.from(document.querySelectorAll(selector));
            return anchors.map(anchor => anchor.href);
        }, this.#cofiguration.linksSelector);
    }
    
    /** Gets links from page. */
    async setLinks() {
        const page = await this.#browser.newPage();
        await page.goto(this.#cofiguration.pageUrl);

        // Get links count.
        const limit = this.#cofiguration.linksLimitOverride ?? await this.#getLinksCount(page);
        
        // Keeps loading next page until all links are loaded.
        let hrefs = [];
        while ((hrefs = await this.#getLinkHrefs(page)).length < limit) {
            await this.#loadNext(page);
        }        

        // Sets links from hrefs.
        this.#links = hrefs.map(href => new Link(href));

        await page.close();
    }

    /** 
     * Sets descriptions for link. 
     * @param {String} descriptionUrl
     * @param {Link} link
    */
    async #setDescription(link) {
        const page = await this.#browser.newPage(link.url);
        await page.goto(link.url);

        // Goes through all description options and sets description.
        for (let i = 0; i < this.#cofiguration.descriptionOptions.length; i++) {
            const option = this.#cofiguration.descriptionOptions[i];

            let value = await page.evaluate((selector) => {
                const element = document.querySelector(selector);
                return element ? element.innerText : null;
            }, option.selector);

            // Checks whether value has value.
            if(!value) {
                const error = new Error(link.url, option.name, "Description value not found.");
                this.#errors.push(error);
                console.error(error.toString());
                continue;
            }

            // Checks whether value matches regex.
            if(option.regex) {
                const match = value.match(option.regex);
                if(!match) {
                    const error = new Error(link.url, option.name, "Description value does not match regex.");
                    this.#errors.push(error);
                    console.error(error.toString());
                    continue;
                }
                value = match[0];
            }

            // Checks whether value needs transformation.
            if(option.transformation) {
                value = option.transformation(value);
            }

            const item = new DescriptionItem(option.name, value);
            link.description.add(item);            
        }

        await page.close();
    }

    /** Gets descriptions from loaded links. */
    async setDescriptions() {        
       // Goes through all links and sets description.
        //  await Promise.all(this.#links.map(async link => {
        //     await this.#setDescription(link.url, link);
        // }));        

        // Goes through all links and sets description.
        for (let i = 0; i < this.#links.length; i++) {
            await this.#setDescription(this.#links[i]);

            // Timeout with promise.
            await new Promise(resolve => setTimeout(resolve, this.#cofiguration.setDescriptionInterval));
        }
    }
    
}

export { Scraper, Configuration };
