const handle = require('./requestHandler.js');
const http = require('http')
const url = require('url')

let server = http.createServer(function (req, res) {

    let receivedURL = url.parse(req.url, true);

    if (receivedURL.pathname == '/ranking') {
        if (req.method != 'POST') return handle.unknownRequest(req, res);
        handle.ranking(res);

    } else if (receivedURL.pathname == '/register'){
        if (req.method != 'POST') return handle.unknownRequest(req, res);

        req.on('data', chunk => {
            handle.register(res, chunk);
        });

    } else if (receivedURL.pathname == '/join') {

        if (req.method != 'POST') return handle.unknownRequest(req, res);

        req.on('data', chunk => {
            handle.join(res, chunk);
        });

    } else if (receivedURL.pathname == '/leave') {

        if (req.method != 'POST') return handle.unknownRequest(req, res);

        req.on('data', chunk => {
            handle.leave(res, chunk);
        });

    } else if (receivedURL.pathname == '/notify') {

        if (req.method != 'POST') return handle.unknownRequest(req, res);

        req.on('data', chunk => {
            handle.notify(res, chunk);
        });

    } else if (receivedURL.pathname == '/update') {

        if (req.method != 'GET') return handle.unknownRequest(req, res);

        const info = {
            nick: receivedURL.query.nick,
            game: receivedURL.query.game
        }

        handle.update(res, info);

    } else handle.unknownRequest(req, res);
});

server.listen(8000);

console.log('Node.js web server at port 8961 is running..')