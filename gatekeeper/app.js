const http = require('http');
const fs = require('fs');
const express = require('express');
const app = express();
app.use(express.json());
const port = 80;
const hostname = '0.0.0.0';


const data = fs.readFileSync('./dns_dict.json', 'utf8');
const dnsDict = JSON.parse(data);
const trustedHost = dnsDict['trusted_host'];
const AUTH_TOKEN = "HelloWorld";

app.post('/', async (req, res, next) => {
    try {
        const clientToken = req.headers['authorization'];
        if (clientToken !== `Bearer ${AUTH_TOKEN}`) {
            return res.status(403).send({ message: "Unauthorized" });
        }

        const response = await fetch(`http://${trustedHost}/`, {
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
app.get('/customized', async (req, res, next) => {
    try {
        const clientToken = req.headers['authorization'];
        if (clientToken !== `Bearer ${AUTH_TOKEN}`) {
            return res.status(403).send({ message: "Unauthorized" });
        }

        const response = await fetch(`http://${trustedHost}/customized`);

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

app.get('/random', async (req, res, next) => {
    try {
        const clientToken = req.headers['authorization'];
        if (clientToken !== `Bearer ${AUTH_TOKEN}`) {
            return res.status(403).send({ message: "Unauthorized" });
        }

        const response = await fetch(`http://${trustedHost}/random`);

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

app.get('/direct-hit', async (req, res, next) => {
    try {
        const clientToken = req.headers['authorization'];
        if (clientToken !== `Bearer ${AUTH_TOKEN}`) {
            return res.status(403).send({ message: "Unauthorized" });
        }

        const response = await fetch(`http://${trustedHost}/direct-hit`);

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
