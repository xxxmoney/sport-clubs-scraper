import { Scraper, Configuration } from './src/scraper.js';
import fs from 'fs';

(async () => {
    const replaceSpaces = (value) => value.replace(/ /g, "");

    const config = {
        pageUrl: "https://www.sportvokoli.cz/sportovni-kluby",
        linksLimitOverride: 5,
        loadNextSelector: ".txt-c a",
        loadNextInterval: 10,
        setDescriptionInterval: 10,
        linksSelector: "#lister-rows a",
        linksCountInfoSelector: "map-results h1",
        linksCountInfoRegex: /\d{2} \d{3}/,
        descriptionOptions: [
            { name: "name", selector: ".club-name" },
            { name: "address", selector: ".box .dlist *:nth-child(4)", transformation: (value) => value.replace("\n\nNAPLÁNOVAT TRASU", "")  },
            { name: "phone", selector: ".box .dlist *:nth-child(6)", regex: /(?:\+(?:\d ?){3})?(?:\d ?){9}/, transformation: replaceSpaces },
            { name: "email", selector: ".box .dlist *:nth-child(6)", regex: /[\w.]+@[\w.]+/, transformation: replaceSpaces },
            { name: "website", selector: ".box .dlist *:nth-child(8) a" },
            { name: "sportType", selector: ".box .dlist *:nth-child(2)" }        
        ]
    };
    const scraper = new Scraper(config);    
    await scraper.init();

    try {
        await scraper.setLinks();
        await scraper.setDescriptions();
    } catch (error) {
        console.error(error);
    }

    await scraper.close();
    

    // Saves links and errors to file.
    const linksJson = JSON.stringify(scraper.links);
    const errorsJson = JSON.stringify(scraper.errors);
    fs.writeFileSync('log\\links.json', linksJson);
    fs.writeFileSync('log\\errors.json', errorsJson);
})();

