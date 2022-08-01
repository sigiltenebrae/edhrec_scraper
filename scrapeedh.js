const puppeteer = require('puppeteer');
const commander_url = 'https://edhrec.com/commanders/';
const themes_url = 'https://edhrec.com/themes/';
const tribes_url = 'https://edhrec.com/tribes/';
const top_week_url = "https://edhrec.com/commanders/week";
const top_year_url = "https://edhrec.com/commanders/year";

async function scrape_top(type) {
    let top_cards = [];
    let cur_url = type === 'week' ? top_week_url : top_year_url;

    const browser = await puppeteer.launch({});
    const context = await browser.createIncognitoBrowserContext();
    const page = await context.newPage();
    try {
        await page.goto(cur_url);

        let cards = await page.$$('div.CardView_card__2vJOP');
        for (let card of cards) {
            let card_name = await card.$eval('div.Card_name__1MYwa', el => el.innerHTML);
            top_cards.push(card_name);
        }

    }
    catch (e) {
        if (e instanceof puppeteer.errors.TimeoutError) {
            top_cards = [];
        }
    }
    await context.close();
    console.log(top_cards);
    return top_cards;
}

async function scrape_commander(commander) {

    let commander_data = {}
    commander_data.commander = commander;

    const browser = await puppeteer.launch({});
    const context = await browser.createIncognitoBrowserContext();
    const page = await context.newPage();
    const card = commander.toLowerCase().replace(/[`~!@#$%^&*()_|+=?;:'",.<>\{\}\[\]\\\/]/gi, '').replaceAll(' ', '-');
    try {
        await page.goto(commander_url + card);

        let rec_scrape_theme = [];
        const theme_list = await page.$('div.NavigationPanel_theme__3k48W');
        const themes = await theme_list.$$('option');
        for (let theme of themes) {
            const temp_theme = await theme.evaluate(el => el.innerText.match(/([A-Z])\w*/g));
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

    }
    catch (e) {
        if (e instanceof puppeteer.errors.TimeoutError) {
            commander_data = {themes: []}
        }
    }
    await context.close();
    return commander_data;
}

async function scrape_themes() {
    let theme_data = []

    const browser = await puppeteer.launch({});
    const page = await browser.newPage();
    await page.goto(themes_url);
    await page.waitForSelector('span.CardView_loadMore__3786B');
    await page.click('span.CardView_loadMore__3786B.button');
    await sleep(2000);
    const theme_divs = await page.$$('div.CardView_card__2vJOP');
    for (let theme_obj of theme_divs) {
        let theme_name = await theme_obj.$eval('div.Card_name__1MYwa', el => el.innerHTML);
        let theme_count = await theme_obj.$eval('div.Card_label__2D5PR', el => el.innerHTML.split(" ")[0]);
        theme_data.push(
            {
                theme: theme_name,
                count: parseInt(theme_count)
            }
        );
    }
    await browser.close();
    return theme_data;
}

async function scrape_themes_as_list() {
    let theme_data = []

    const browser = await puppeteer.launch({});
    const page = await browser.newPage();
    await page.goto(themes_url);
    await page.waitForSelector('.CardView_loadMore__3786B button');
    await page.click('.CardView_loadMore__3786B button');
    await sleep(2000);
    const theme_divs = await page.$$('div.CardView_card__2vJOP');
    for (let theme_obj of theme_divs) {
        let theme_name = await theme_obj.$eval('div.Card_name__1MYwa', el => el.innerHTML);
        theme_data.push(theme_name);
    }
    await browser.close();
    return theme_data;
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function scrape_tribes_as_list() {
    let theme_data = []

    const browser = await puppeteer.launch({});
    const page = await browser.newPage();
    await page.goto(tribes_url);
    await page.waitForSelector('.CardView_loadMore__3786B button');
    await page.click('.CardView_loadMore__3786B button');
    await sleep(2000);
    const theme_divs = await page.$$('div.CardView_card__2vJOP');
    for (let theme_obj of theme_divs) {
        let theme_name = await theme_obj.$eval('div.Card_name__1MYwa', el => el.innerHTML);
        theme_data.push(theme_name);
    }
    await browser.close();
    return theme_data;
}

async function scrape_theme(theme, type) {
    let theme_data = {};
    theme_data.theme = theme;
    let modded_theme = '';
    if (theme === '+1/+1 Counters') {
        modded_theme = 'p1-p1-counters';
    }
    else if (theme === '-1/-1 Counters') {
        modded_theme = 'm1-m1-counters';
    }
    else {
        modded_theme = theme.toLowerCase().replaceAll(" ", "-");
    }
    const browser = await puppeteer.launch({});
    const page = await browser.newPage();
    let data_url = '';
    if (type === 'theme') {
        data_url = themes_url;
    }
    else if (type === 'tribe') {
        data_url = tribes_url;
    }
    await page.goto(data_url + modded_theme);


    const categories = await page.$$('div.CardView_cardlist__1CcNe');
    let rec_scrape_card = [];
    for (let cat of categories) {
        let category_scrape = []
        let category_name = await cat.$eval('h3', el => el.innerText.match(/([A-Z])\w+/g).join(" "));
        let cards = await cat.$$('div.CardView_card__2vJOP');
        for (let card of cards) {
            let card_name = await card.$eval('div.Card_name__1MYwa', el => el.innerHTML);
            let card_label = (await card.$eval('div.Card_label__2D5PR', el => el.innerHTML)).split('\n');
            let card_count = parseInt(card_label[0].match(/\d+/g)[0]);
            category_scrape.push(
                {
                    name: card_name,
                    deck_count: card_count
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
    theme_data.categories = rec_scrape_card;

    await browser.close();
    return theme_data;
}

//scrape_commander('Nath of the Gilt-Leaf');


module.exports = {
    scrape_top,
    scrape_commander,
    scrape_themes,
    scrape_themes_as_list,
    scrape_tribes_as_list,
    scrape_theme
}