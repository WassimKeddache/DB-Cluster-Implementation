const http = require('http');
const fs = require('fs');
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());
const port = 80;
const hostname = '0.0.0.0';

const data = fs.readFileSync('./dns_dict.json', 'utf8');
const dnsDict = JSON.parse(data);
const trustedHost = dnsDict['trusted_host'];
const AUTH_TOKEN = "HelloWorld";

app.post('/', async (req, res) => {
  try {
    const clientToken = req.headers['authorization'];
    if (clientToken !== `Bearer ${AUTH_TOKEN}`) {
      return res.status(403).send({ message: "Unauthorized" });
    }

    const response = await axios.post(`http://${trustedHost}/`, req.body, {
      headers: { 'Content-Type': 'application/json' }
    });
    res.json(response.data);
  } catch (e) {
    console.error(e);
    res.status(500).send({ message: "Server error", error: e.message });
  }
});

app.get('/customized', async (req, res) => {
  try {
    const clientToken = req.headers['authorization'];
    if (clientToken !== `Bearer ${AUTH_TOKEN}`) {
      return res.status(403).send({ message: "Unauthorized" });
    }

    const response = await axios.get(`http://${trustedHost}/customized`);
    res.json(response.data);
  } catch (e) {
    console.error(e);
    res.status(500).send({ message: "Server error", error: e.message });
  }
});

app.get('/random', async (req, res) => {
  try {
    const clientToken = req.headers['authorization'];
    if (clientToken !== `Bearer ${AUTH_TOKEN}`) {
      return res.status(403).send({ message: "Unauthorized" });
    }

    const response = await axios.get(`http://${trustedHost}/random`);
    res.json(response.data);
  } catch (e) {
    console.error(e);
    res.status(500).send({ message: "Server error", error: e.message });
  }
});

app.get('/direct-hit', async (req, res) => {
  try {
    const clientToken = req.headers['authorization'];
    if (clientToken !== `Bearer ${AUTH_TOKEN}`) {
      return res.status(403).send({ message: "Unauthorized" });
    }

    const response = await axios.get(`http://${trustedHost}/direct-hit`);
    res.json(response.data);
  } catch (e) {
    console.error(e);
    res.status(500).send({ message: "Server error", error: e.message });
  }
});

app.listen(port, hostname, () => {
  console.log(`App listening on ${hostname}:${port}`);
});
