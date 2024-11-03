import express from 'express';
import http from 'http';
import fs from 'node:fs';

const app = express();
const port = 80;
const hostname = '0.0.0.0';

// const data = fs.readFileSync('./instance_ips.txt', 'utf8');
// const lines = data.split('\n');

// let tgtGroup1 = lines[0].split(' ');
// let tgtGroup2 = lines[1].split(' ');

let bestSlaveInstance = ''

const getBestGroupInstance = async (tgtGroup) => {
    let bestInstance = '';
    let bestResponseTime = Number.MAX_SAFE_INTEGER;
    for (let instanceIp of tgtGroup) {
        let startTime = performance.now();
        await sendHealthCheck(instanceIp);
        let responseTime = performance.now() - startTime;

        console.log(`${instanceIp} response time: ${responseTime}`);

        if (responseTime < bestResponseTime) {
            bestResponseTime = responseTime;
            bestInstance = instanceIp
        }
    }

    console.log(`The best instance is ${bestInstance}`);
    return bestInstance;
};

const sendHealthCheck = async (instanceIp) => {
    return await new Promise((resolve, reject) => {
        console.log(`http://${instanceIp}:80/`);
        http.get(`http://${instanceIp}:80/`, (res) => {
            res.on('data', (chunk) => {

            });

            res.on('end', () => {
                resolve();
            });
        }).on('error', (err) => {
            console.error(err);
        });
    });
};

const loopBestSlaveInstances = async () => {
    bestSlaveInstance = await getBestGroupInstance(tgtGroup1);
    
    setInterval(async () => {
        bestSlaveInstance = await getBestGroupInstance(tgtGroup1);
    }, 100);
}


loopBestSlaveInstances();

app.post('/write', (req, res, next) => {
    // Send write request to master
});

app.get('/read/customized', (req, res, next) => {
    // Send read request to best slave instance
});

app.get('/read/random', (req, res, next) => {
    // Send read request to random slave instance
});

app.get('/read/direct-hit', (req, res, next) => {
    // Send read request to master
});

app.listen(port, hostname, () => {
    console.log(`App listening on ${hostname}:${port}`);
});
