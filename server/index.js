const handle = require('./requestHandler.js');
const http = require('http')

let server = http.createServer(function (req, res) {
    if (req.url == '/ranking') {
        if (req.method != 'POST') return handle.unknownRequest(req, res);
        handle.ranking(res);

    } else if (req.url == '/register'){
        if (req.method != 'POST') return handle.unknownRequest(req, res);

        req.on('data', chunk => {
            handle.register(res, chunk);
        });

    } else if (req.url == '/join') {

        if (req.method != 'POST') return handle.unknownRequest(req, res);

        req.on('data', chunk => {
            handle.join(res, chunk);
        });

    } else if (req.url == '/leave') {

        handle.unknownRequest(req, res);

    } else if (req.url == '/notify') {

        handle.unknownRequest(req, res);

    } else if (req.url == '/update') {

        handle.unknownRequest(req, res);

    } else handle.unknownRequest(req, res);
});

server.listen(5000);

console.log('Node.js web server at port 5000 is running..')