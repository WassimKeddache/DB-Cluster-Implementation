const http = require('http');
const fs = require('fs');
const express = require('express');
const mysql = require('mysql2');
const app = express();
const port = 80;
const hostname = '0.0.0.0';


const data = fs.readFileSync('./dns_dict.json', 'utf8');
const dnsDict = JSON.parse(data);
const proxy = dnsDict['proxy'];


app.post('/write', async (req, res, next) => {
    try {
        const response = await fetch(`http://${proxy}/write`, {
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

app.get('/read/customized', async (req, res, next) => {
    try {
        const response = await fetch(`http://${proxy}/read/customized`);
        const data = await response.json();
        res.json(data);
    }
    catch (e) {
        console.log(e);
    }
});

app.get('/read/random', async (req, res, next) => {
    try {
        const response = await fetch(`http://${proxy}/read/random`);
        const data = await response.json();
        res.json(data);
    }
    catch (e) {
        console.log(e);
    }
});

app.get('/read/direct-hit', async (req, res, next) => {
    try {
        const response = await fetch(`http://${proxy}/read/direct-hit`);
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
