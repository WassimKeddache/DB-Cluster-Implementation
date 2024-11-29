const http = require('http');
const fs = require('fs');
const express = require('express');
const mysql = require('mysql2');
const app = express();

app.use(express.json());
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
        host: worker,
        user: 'root',           
        password: 'root_password',
        database: 'sakila',
      });

      workerDict[worker] = connection;
}

let bestWorkerInstance = '';

const masterConnection = mysql.createConnection({
    host: master,
    user: 'root',
    password: 'root_password',
    database: 'sakila',
});


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
        console.log(`http://${worker}/`);
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

function retryQuery(connection, query, data, retries = 3, delay = 1000) {
    return new Promise((resolve, reject) => {
        const attempt = (retryCount) => {
            connection.query(query, data, (err, result) => {
                if (err) {
                    if (retryCount > 0) {
                        console.error(`Retrying... Attempts left: ${retryCount}. Error:`, err);
                        setTimeout(() => attempt(retryCount - 1), delay);
                    } else {
                        reject(err);
                    }
                } else {
                    resolve(result);
                }
            });
        };
        attempt(retries);
    });
}


app.post('/', async (req, res) => {
    const actor = req.body;
    console.log('Inserting actor:', req.body);
    const mainQuery = 'INSERT INTO actor SET ?';

    try {
        const mainResult = await retryQuery(masterConnection, mainQuery, actor);

        const workerPromises = workers.map(worker => {
            const workerConnection = workerDict[worker];

            return retryQuery(workerConnection, mainQuery, actor)
                .then(result => {
                    console.log(`Worker ${worker} insertion successful:`, result);
                    return { worker, success: true };
                })
                .catch(err => {
                    console.error(`Worker ${worker} insertion failed:`, err);
                    return { worker, success: false, error: err.message };
                });
        });

        const workerResults = await Promise.all(workerPromises);

        res.status(200).json({
            message: 'Insertion complete',
            main: mainResult,
            workers: workerResults,
        });
    } catch (err) {
        console.error('Failed to insert into the main database:', err);
        res.status(500).json({ message: 'Insertion failed', error: err.message });
    }
});

app.get('/customized', (req, res, next) => {
    // Send read request to best slave instance
    console.log(`Sending read request to ${bestWorkerInstance}`);
    const connection = workerDict[bestWorkerInstance];
    connection.query('SELECT * FROM actor', (err, rows) => {
        if (err) {
            console.error(err);
            res.status(500).send
        }
        res.status(200).json({
            source: "Worker: " + bestWorkerInstance,
            data: rows,
        });
    });
});

app.get('/random', (req, res, next) => {
    // Send read request to random slave instance
    const randomWorker = workers[Math.floor(Math.random() * workers.length)];
    console.log(`Sending read request to ${randomWorker}`);
    
    const connection = workerDict[randomWorker];
    
    connection.query('SELECT * FROM actor', (err, rows) => {
        if (err) {
            console.error(err);
            res.status(500).send
        }

        res.status(200).json({
            source: "Worker: " + randomWorker,
            data: rows,
        });
    });
});

app.get('/direct-hit', (req, res, next) => {
    // Send read request to master
    console.log(`Sending read request to master at ip ${master}`);
    const connection = masterConnection;
    
    connection.query('SELECT * FROM actor', (err, rows) => {
        if (err) {
            console.error(err);
            res.status(500).send
        }

        res.status(200).json({
            source: "Master: " + master,
            data: rows,
        });
    });
    
});

loopBestWorker();

app.listen(port, hostname, () => {
    console.log(`App listening on ${hostname}:${port}`);
});
