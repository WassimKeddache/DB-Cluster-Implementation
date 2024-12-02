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

let workerPools = {};

for (let worker of workers) {
    console.log(`Connecting to ${worker}`);
    const pool = mysql.createPool({
        connectionLimit: 10,
        host: worker,
        user: 'root',
        password: 'root_password',
        database: 'sakila',
    });
    workerPools[worker] = pool;
}

const masterPool = mysql.createPool({
    connectionLimit: 10,
    host: master,
    user: 'root',
    password: 'root_password',
    database: 'sakila',
});

let bestWorkerInstance = '';

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
            bestInstance = worker;
        }
    }

    console.log(`The best worker is ${bestInstance} with a response time of ${bestResponseTime}`);
    return bestInstance;
};

const sendHealthCheck = async (worker) => {
    return new Promise((resolve, reject) => {
        console.log(`http://${worker}/`);
        const startTime = Date.now();
        const pool = workerPools[worker];

        pool.query('SELECT 1', (err) => {
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
};


const query = `
    SELECT 
        f.title AS movie_title,
        a.first_name AS actor_first_name,
        a.last_name AS actor_last_name,
        f.release_year,
        c.name AS category
    FROM
        film f
    JOIN
        film_actor fa ON f.film_id = fa.film_id
    JOIN
        actor a ON fa.actor_id = a.actor_id
    JOIN
        film_category fc ON f.film_id = fc.film_id
    JOIN
        category c ON fc.category_id = c.category_id
    WHERE
        c.name = 'Action'
        AND f.release_year > 2000
    ORDER BY
        f.release_year DESC
    LIMIT 50;
`;

function retryQuery(pool, query, data, retries = 3, delay = 1000) {
    return new Promise((resolve, reject) => {
        const attempt = (retryCount) => {
            pool.query(query, data, (err, result) => {
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
        const mainResult = await retryQuery(masterPool, mainQuery, actor);

        const workerPromises = workers.map(worker => {
            const workerPool = workerPools[worker];

            return retryQuery(workerPool, mainQuery, actor)
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

app.get('/customized', async (req, res, next) => {

    console.log(`Sending customized read request to ${bestWorkerInstance}`);
    
    const pool = workerPools[bestWorkerInstance];
    
    pool.query(query, (err, rows) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error during query execution');
        } else {
            res.status(200).json({
                source: "Worker: " + bestWorkerInstance,
                data: rows,
            });
        }
    });
});

app.get('/random', (req, res, next) => {
    const randomWorker = workers[Math.floor(Math.random() * workers.length)];
    console.log(`Sending customized read request to ${randomWorker}`);
    
    const pool = workerPools[randomWorker];
    
    pool.query(query, (err, rows) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error during query execution');
        } else {
            res.status(200).json({
                source: "Worker: " + randomWorker,
                data: rows,
            });
        }
    });
});

app.get('/direct-hit', (req, res, next) => {
    console.log(`Sending customized read request to master at IP ${master}`);
    
    masterPool.query(query, (err, rows) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error during query execution');
        } else {
            res.status(200).json({
                source: "Master: " + master,
                data: rows,
            });
        }
    });
});

loopBestWorker();

app.listen(port, hostname, () => {
    console.log(`App listening on ${hostname}:${port}`);
});
