const http = require('http');

const benchmarkHttpRequests = async (host, port, endpoint, requestCount) => {
    let totalResponseTime = 0;

    for (let i = 0; i < requestCount; i++) {
        const startTime = Date.now();

        await new Promise((resolve, reject) => {
            const req = http.get(`http://${host}:${port}${endpoint}`, (res) => {
                res.on('data', () => {}); // Consomme les données pour éviter la mise en mémoire tampon
                res.on('end', () => {
                    const endTime = Date.now();
                    const responseTime = endTime - startTime;
                    totalResponseTime += responseTime;
                    console.log(`Temps de réponse pour la requête ${i + 1}: ${responseTime} ms`);
                    resolve();
                });
            });

            req.on('error', (err) => {
                console.error(`Erreur pour la requête ${i + 1}:`, err.message);
                resolve(); // Continue le benchmark même en cas d'erreur
            });

            req.end();
        });
    }

    const averageResponseTime = totalResponseTime / requestCount;
    console.log(`\nTemps de réponse moyen après ${requestCount} requêtes: ${averageResponseTime.toFixed(2)} ms`);
};

const host = 'localhost';
const port = 80;
const endpoint = '/read/customized'; 
const requestCount = 1000; 

benchmarkHttpRequests(host, port, endpoint, requestCount);