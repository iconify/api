/**
 * Run this file instead of app.js if you want to enable SSL support
 */
"use strict";

const https = require('https'),
    fs = require('fs');

let app = require('./app');

try {
    let ssl = {
        secureProtocol: 'SSLv23_method',
        secureOptions: require('constants').SSL_OP_NO_SSLv3,
        key: fs.readFileSync('.ssl/ssl.key'),
        cert: fs.readFileSync('.ssl/ssl.crt'),
        ca: fs.readFileSync('.ssl/ssl.ca-bundle'),
    };
    let port = process.env.SSLPORT || 443;
    https.createServer(ssl, app).listen(port);
    console.log('Listening on port ' + port);
} catch (err) {
    console.log('SSL certificates are missing');
}

module.exports = app;
