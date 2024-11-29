const http = require('http');
const fs = require('fs');
const express = require('express');
const app = express();
app.use(express.json());
const port = 80;
const hostname = '0.0.0.0';


const data = fs.readFileSync('./dns_dict.json', 'utf8');
const dnsDict = JSON.parse(data);
const proxy = dnsDict['proxy'];


app.post('/', async (req, res, next) => {
    try {
        const response = await fetch(`http://${proxy}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.json(data);
    }
    catch (e) {
        console.log(e);
    }
});

app.get('/customized', async (req, res, next) => {
    try {
        const response = await fetch(`http://${proxy}/customized`);
        const data = await response.json();
        res.json(data);
    }
    catch (e) {
        console.log(e);
    }
});

app.get('/random', async (req, res, next) => {
    try {
        const response = await fetch(`http://${proxy}/random`);
        const data = await response.json();
        res.json(data);
    }
    catch (e) {
        console.log(e);
    }
});

app.get('/direct-hit', async (req, res, next) => {
    try {
        const response = await fetch(`http://${proxy}/direct-hit`);
        const data = await response.json();
        res.json(data);
    }
    catch (e) {
        console.log(e);
    }
});

app.listen(port, hostname, () => {
    console.log(`App listening on ${hostname}:${port}`);
});
