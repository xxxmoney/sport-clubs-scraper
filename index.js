import { Scraper, Configuration } from './src/scraper.js';
import { ExcelMaker } from './src/excelMaker.js';
import fs from 'fs';

const files = {
    links: 'logs\\links.json',
    errors: 'logs\\errors.json'
};

const getLinks = async () => {
    const replaceSpaces = (value) => value.replace(/ /g, "");

    const config = {
        pageUrl: "https://www.sportvokoli.cz/sportovni-kluby",
        linksLimitOverride: null,
        loadNextSelector: ".txt-c a",
        linksSelector: "#lister-rows a",
        linksCountInfoSelector: ".map-results h1",
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
    const options = {
        flag: 'w',
        autoClose: true
      };
    const linksJson = JSON.stringify(scraper.links);
    const errorsJson = JSON.stringify(scraper.errors);
    fs.writeFileSync(files.links, linksJson, options);
    fs.writeFileSync(files.errors, errorsJson, options);
};

(async () => {
    await getLinks();

    const linksJson = fs.readFileSync(files.links, 'utf8');
    const links = JSON.parse(linksJson);

    ExcelMaker.saveData(Scraper.flattenData(links), "output\\links.xlsx");    
})();

