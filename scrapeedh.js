const puppeteer = require('puppeteer');
const url = 'https://edhrec.com/commanders/'

async function scrape_commander(commander) {
    let commander_data = {}
    commander_data.commander = commander;

    const browser = await puppeteer.launch({});
    const page = await browser.newPage();
    const card = commander.toLowerCase().replace(/[`~!@#$%^&*()_|+=?;:'",.<>\{\}\[\]\\\/]/gi, '').replaceAll(' ', '-');
    await page.goto(url + card);

    let rec_scrape_theme = [];
    const theme_list = await page.$('div.NavigationPanel_theme__3k48W');
    const themes = await theme_list.$$('option');
    for (let theme of themes) {
        const temp_theme = await theme.evaluate(el => el.innerText.match(/([A-Z])\w+/g));
        if (temp_theme) {
            rec_scrape_theme.push(temp_theme.join(" "));
        }
    }
    commander_data.themes = rec_scrape_theme;

    const categories = await page.$$('div.CardView_cardlist__1CcNe');
    let rec_scrape_card = [];
    for (let cat of categories) {
        let category_scrape = []
        let category_name = await cat.$eval('h3', el => el.innerText.match(/([A-Z])\w+/g).join(" "));
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
        rec_scrape_card.push(
            {
                category: category_name,
                cards: category_scrape
            }
        );
    }
    commander_data.categories = rec_scrape_card;
    //console.log(JSON.stringify(commander_data));
    await browser.close();
}

async function scrape_themes() {

}

//scrape_commander('Nath of the Gilt-Leaf');