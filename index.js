const express = require('express');
const bodyParser = require('body-parser');
const scrape = require('./scrapeedh');
const query = require('./queries');

const app = express();
const port = 2525;
const cors = require('cors');
app.use(cors({
    origin: '*'
}));

app.use(bodyParser.json())
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
)

app.get('/', (request, response) => {
    response.json({ info: 'Edh Web-Scraper API' });
});

app.get('/themes', function(req, res) {
    scrape.scrape_themes().then( scrape => {
        res.json(scrape);
    });
});

app.get('/themes/list', function(req, res) {
    scrape.scrape_themes_as_list().then( scrape => {
        res.json(scrape);
    });
});

app.get('/tribes/list', function(req, res) {
    scrape.scrape_tribes_as_list().then( scrape => {
        res.json(scrape);
    });
});

app.post('/commander', function(req, res) {
    if(req.body.commander) {
        console.log(req.body.commander);
        const commander = req.body.commander;
        try {
            scrape.scrape_commander(commander).then( scrape => {
                res.status(200).json(scrape);
            });
        }
        catch (err) {
            console.log(err);
            res.status(200).json({themes: []});
        }

    }
    else {
        res.json({error: "no commander"});
    }

});

app.listen(port, () => {
    console.log(`App running on port ${port}.`)
});