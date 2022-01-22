const fs = require('fs')
const path = require('path');

const requestHandler = (req, res, url) => {
    const filePath = `../client${url}`;
    const extname = String(path.extname(filePath)).toLowerCase();

    const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm',
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';
    staticFileHandler(req, res, filePath, contentType);
}

const staticFileHandler = (req, res, filePath, contentType) => {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end(`The file could not be read...  (Error Code: ${err.code})`)
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
}

module.exports = {requestHandler}