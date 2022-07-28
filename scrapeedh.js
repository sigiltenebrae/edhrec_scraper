const puppeteer = require('puppeteer');
const url = 'https://edhrec.com/commanders/'
const card = 'jon-irenicus-shattered-one';

async function scrape() {
    const browser = await puppeteer.launch({});
    const page = await browser.newPage();
    await page.goto(url + card);



    const categories = await page.$$('div.CardView_cardlist__1CcNe');
    let rec_scrape = []
    for (let cat of categories) {
        //const inside = await cat.evaluate(el => el.textContent);
        let category_scrape = []
        let category_name = await cat.$eval('h3', el => el.innerText);
        let cards = await cat.$$('div.CardView_card__2vJOP');
        for (let card of cards) {
            let card_name = await card.$eval('div.Card_name__1MYwa', el => el.innerHTML);
            let card_label = (await card.$eval('div.Card_label__2D5PR', el => el.innerHTML)).split('\n');
            let percent = parseInt(card_label[0].match(/\d+/g)[0]);
            let syn = parseInt(card_label[1]);
            category_scrape.push(
                {
                    name: card_name,
                    usage_percent: percent,
                    synergy: syn
                }
            );
        }
        rec_scrape.push(
            {
                category: category_name,
                cards: category_scrape
            }
        );
    }
    console.log(JSON.stringify(rec_scrape));
    await browser.close();
}

scrape();