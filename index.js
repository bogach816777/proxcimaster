const express = require('express');
const request = require('request');
const cors = require('cors');
const mcache = require('memory-cache');
const app = express();

app.use(cors());

const cache = (duration) => {
    return (req, res, next) => {
        let key = '__express__' + (req.originalUrl || req.url);
        let cachedBody = mcache.get(key);
        if (cachedBody) {
            res.send(cachedBody);
        } else {
            res.sendResponse = res.send;
            res.send = (body) => {
                mcache.put(key, body, duration * 1000);
                res.sendResponse(body);
            };
            next();
        }
    };
};

app.get('/proxy', cache(30), (req, res) => {
    const url = decodeURIComponent(req.query.url); // Декодування URL
    if (!url) {
        return res.status(400).send('URL is required');
    }
    request(
        { url: url, headers: { 'X-Requested-With': 'XMLHttpRequest' } },
        (error, response, body) => {
            if (error) {
                return res.status(500).send(error.message);
            }
            res.send(body);
        }
    );
});

const PORT = process.env.PORT || 3000; // Використовуємо змінну середовища для порту
app.listen(PORT, () => {
    console.log(`Proxy server is running on port ${PORT}`);
});
