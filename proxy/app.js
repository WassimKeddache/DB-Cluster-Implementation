const http = require('http');
const fs = require('fs');
const express = require('express');

const app = express();
const port = 80;
const hostname = '0.0.0.0';


const data = fs.readFileSync('./dns_dict.json', 'utf8');
const dnsDict = JSON.parse(data);


let workers = dnsDict['workers'];
let master = dnsDict['master'];


let bestWorkerInstance = ''

const getBestWorker = async (workers) => {
    let bestInstance = '';
    let bestResponseTime = Number.MAX_SAFE_INTEGER;
    for (let instanceIp of workers) {
        let startTime = performance.now();
        await sendHealthCheck(instanceIp);
        let responseTime = performance.now() - startTime;
        
        console.log(`${instanceIp} response time: ${responseTime}`);
        
        if (responseTime < bestResponseTime) {
            bestResponseTime = responseTime;
            bestInstance = instanceIp
        }
    }
    
    console.log(`The best worker is ${bestInstance}`);
    return bestInstance;
};

const sendHealthCheck = async (instanceIp) => {
    return await new Promise((resolve, reject) => {
        console.log(`http://${instanceIp}/`);
        http.get(`http://${instanceIp}/`, (res) => {
            res.on('data', (chunk) => {});
            
            res.on('end', () => {
                resolve();
            });
        }).on('error', (err) => {
            console.error(err);
        });
    });
};


let workerDict = {};
for (let worker of workers) {
    const connection = mysql.createConnection({
        host: worker,       // Adresse de l'hôte MySQL (localhost si local)
        user: 'root',            // Nom d'utilisateur MySQL
        password: 'root_password', // Le mot de passe MySQL
        database: 'sakila',      // Nom de la base de données (par exemple, 'sakila')
      });

      workerDict[worker] = connection;
}

const masterConnection = mysql.createConnection({
    host: master,       // Adresse de l'hôte MySQL (localhost si local)
    user: 'root',            // Nom d'utilisateur MySQL
    password: 'root_password', // Le mot de passe MySQL
    database: 'sakila',      // Nom de la base de données (par exemple, 'sakila')
});

    
const loopBestWorker = async () => {
    bestWorkerInstance = await getBestWorker(workers);
        
    setInterval(async () => {
        bestWorkerInstance = await getBestWorker(workers);
    }, 100);
}
    
// loopBestWorker();

app.post('/write', (req, res, next) => {
    
});

app.get('/read/customized', (req, res, next) => {
    // Send read request to best slave instance
});

app.get('/read/random', (req, res, next) => {
    // Send read request to random slave instance
    const randomWorker = workers[Math.floor(Math.random() * workers.length)];
    const connection = workerDict[randomWorker];

    connection.query('SELECT * FROM actor', (err, rows) => {
        if (err) {
            console.error(err);
            res.status(500).send
        }
        res.send(rows);
    });
});

app.get('/read/direct-hit', (req, res, next) => {
    // Send read request to master
});

app.listen(port, hostname, () => {
    console.log(`App listening on ${hostname}:${port}`);
});
