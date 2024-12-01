const http = require('http');
const fs = require('fs');
const express = require('express');
const axios = require('axios'); // Importing axios
const app = express();
app.use(express.json());
const port = 80;
const hostname = '0.0.0.0';

const data = fs.readFileSync('./dns_dict.json', 'utf8');
const dnsDict = JSON.parse(data);
const proxy = dnsDict['proxy'];

app.post('/', async (req, res, next) => {
    try {
        const response = await axios.post(`http://${proxy}/`, req.body, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        res.json(response.data);
    }
    catch (e) {
        console.log(e);
        res.status(500).send({ message: "Error while processing request" });
    }
});

app.get('/customized', async (req, res, next) => {
    try {
        const response = await axios.get(`http://${proxy}/customized`);
        res.json(response.data);
    }
    catch (e) {
        console.log(e);
        res.status(500).send({ message: "Error while processing request" });
    }
});

app.get('/random', async (req, res, next) => {
    try {
        const response = await axios.get(`http://${proxy}/random`);
        res.json(response.data);
    }
    catch (e) {
        console.log(e);
        res.status(500).send({ message: "Error while processing request" });
    }
});

app.get('/direct-hit', async (req, res, next) => {
    try {
        const response = await axios.get(`http://${proxy}/direct-hit`);
        res.json(response.data);
    }
    catch (e) {
        console.log(e);
        res.status(500).send({ message: "Error while processing request" });
    }
});

app.listen(port, hostname, () => {
    console.log(`App listening on ${hostname}:${port}`);
});
