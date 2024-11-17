const http = require('http');
const fs = require('fs');
const express = require('express');
const mysql = require('mysql2');
const app = express();
const port = 80;
const hostname = '0.0.0.0';


const data = fs.readFileSync('./dns_dict.json', 'utf8');
const dnsDict = JSON.parse(data);


let workers = dnsDict['workers'];
let master = dnsDict['master'];


let workerDict = {};
for (let worker of workers) {
    console.log(`Connecting to ${worker}`);
    const connection = mysql.createConnection({
        host: worker,       // Adresse de l'hôte MySQL (localhost si local)
        user: 'root',            // Nom d'utilisateur MySQL
        password: 'root_password', // Le mot de passe MySQL
        database: 'sakila',      // Nom de la base de données (par exemple, 'sakila')
      });

      workerDict[worker] = connection;
}

let bestWorkerInstance = '';

// const masterConnection = mysql.createConnection({
//     host: master,       // Adresse de l'hôte MySQL (localhost si local)
//     user: 'root',            // Nom d'utilisateur MySQL
//     password: 'root_password', // Le mot de passe MySQL
//     database: 'sakila',      // Nom de la base de données (par exemple, 'sakila')
// });


const getBestWorker = async (workers) => {
    let bestInstance = '';
    let bestResponseTime = Number.MAX_SAFE_INTEGER;
    for (let worker of workers) {
        let startTime = performance.now();
        await sendHealthCheck(worker);
        let responseTime = performance.now() - startTime;
        
        console.log(`${worker} response time: ${responseTime}`);
        
        if (responseTime < bestResponseTime) {
            bestResponseTime = responseTime;
            bestInstance = worker
        }
    }
    
    console.log(`The best worker is ${bestInstance} with a response time of ${bestResponseTime}`);
    return bestInstance;
};

const sendHealthCheck = async (worker) => {
    return new Promise((resolve, reject) => {
        console.log(`http://${worker}}/`);
        const startTime = Date.now();
        const connection = workerDict[worker];

        connection.query('SELECT 1', (err) => {
            if (err) {
                console.error(`Erreur sur ${worker}:`, err);
                reject(err);
            } else {
                const endTime = Date.now();
                const responseTime = endTime - startTime;
                console.log(`Temps de réponse pour ${worker}: ${responseTime} ms`);
                resolve(responseTime);
            }
        });
    });
};
    
const loopBestWorker = async () => {
    bestWorkerInstance = await getBestWorker(workers);
        
    setInterval(async () => {
        bestWorkerInstance = await getBestWorker(workers);
    }, 100);
}
    
loopBestWorker();

// app.post('/write', (req, res, next) => {
//     const actor = req.body;
//     const connection = masterConnection;
//     connection.query('INSERT INTO actor SET ?', actor, (err, result) => {
//         if (err) {
//             console.error(err);
//             res.status(500).send
//         }
//         res.send(result);
//         for (let worker of workers) {
//             const connection = workerDict[worker];
//             connection.query('INSERT INTO actor SET ?', actor, (err, result) => {
//                 if (err) {
//                     console.error(err);
//                     res.status(500).send
//                 }
//             });
//         }
//     });
// });

app.get('/read/customized', (req, res, next) => {
    // Send read request to best slave instance
    console.log(`Sending read request to ${bestWorkerInstance}`);
    const connection = workerDict[bestWorkerInstance];
    connection.query('SELECT * FROM actor', (err, rows) => {
        if (err) {
            console.error(err);
            res.status(500).send
        }
        res.send(rows);
    });
});

app.get('/read/random', (req, res, next) => {
    // Send read request to random slave instance
    const randomWorker = workers[Math.floor(Math.random() * workers.length)];
    console.log(`Sending read request to ${randomWorker}`);

    const connection = workerDict[randomWorker];

    connection.query('SELECT * FROM actor', (err, rows) => {
        if (err) {
            console.error(err);
            res.status(500).send
        }
        res.send(rows);
    });
});

// app.get('/read/direct-hit', (req, res, next) => {
//     // Send read request to master
//     console.log(`Sending read request to master at ip ${master}`);
//     const connection = masterConnection;

//     connection.query('SELECT * FROM actor', (err, rows) => {
//         if (err) {
//             console.error(err);
//             res.status(500).send
//         }
//         res.send(rows);
//     });
    
// });

app.listen(port, hostname, () => {
    console.log(`App listening on ${hostname}:${port}`);
});
