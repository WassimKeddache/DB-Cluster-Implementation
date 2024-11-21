const http = require('http');
const fs = require('fs');
const express = require('express');
const mysql = require('mysql2');
const app = express();
const port = 80;
const hostname = '0.0.0.0';


const data = fs.readFileSync('./dns_dict.json', 'utf8');
const dnsDict = JSON.parse(data);
const trustedHost = dnsDict['trusted_host'];
const AUTH_TOKEN = "HelloWorld";

app.post('/write', async (req, res, next) => {
    try {
        const clientToken = req.headers['authorization'];
        if (clientToken !== `Bearer ${AUTH_TOKEN}`) {
            return res.status(403).send({ message: "Unauthorized" });
        }

        const response = await fetch(`http://${trustedHost}/write`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });

        if (!response.ok) {
            throw new Error(`Erreur du serveur distant: ${response.statusText}`);
        }
        const data = await response.json();
        res.json(data);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: "Server error", error: e.message });
    }
});
app.get('/read/customized', async (req, res, next) => {
    try {
        const clientToken = req.headers['authorization'];
        if (clientToken !== `Bearer ${AUTH_TOKEN}`) {
            return res.status(403).send({ message: "Unauthorized" });
        }

        const response = await fetch(`http://${trustedHost}/read/customized`);

        if (!response.ok) {
            throw new Error(`Erreur du serveur distant: ${response.statusText}`);
        }
        const data = await response.json();
        res.json(data);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: "Server error", error: e.message });
    }
});

app.get('/read/random', async (req, res, next) => {
    try {
        const clientToken = req.headers['authorization'];
        if (clientToken !== `Bearer ${AUTH_TOKEN}`) {
            return res.status(403).send({ message: "Unauthorized" });
        }

        const response = await fetch(`http://${trustedHost}/read/random`);

        if (!response.ok) {
            throw new Error(`Erreur du serveur distant: ${response.statusText}`);
        }
        const data = await response.json();
        res.json(data);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: "Server error", error: e.message });
    }
});

app.get('/read/direct-hit', async (req, res, next) => {
    try {
        const clientToken = req.headers['authorization'];
        if (clientToken !== `Bearer ${AUTH_TOKEN}`) {
            return res.status(403).send({ message: "Unauthorized" });
        }

        const response = await fetch(`http://${trustedHost}/read/direct-hit`);

        if (!response.ok) {
            throw new Error(`Erreur du serveur distant: ${response.statusText}`);
        }
        const data = await response.json();
        res.json(data);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: "Server error", error: e.message });
    }
});

app.listen(port, hostname, () => {
    console.log(`App listening on ${hostname}:${port}`);
});
