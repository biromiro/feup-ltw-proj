const fs = require('fs');
const crypto = require('crypto');

function error(error) {
    return JSON.stringify({'error': error});
} 

function sendResponse(res, code, content) {
    res.writeHead(code, { 'Content-Type': 'application/json' }); 
    res.end(content);
}

function unknownRequest(req, res) {
    if(req.method == 'POST'){
        json = JSON.stringify({
            'error': 'unknown POST request'
        });
        sendResponse(res, 400, json);
    } else if(req.method == 'GET') {
        json = JSON.stringify({
            'error': 'unknown GET request'
        });
        sendResponse(res, 400, json);
    } else {
        json = JSON.stringify({
            'error': 'unknown request'
        });
        sendResponse(res, 500, json);
    }
}

function ranking(res) {
    fs.readFile('db/ranking.json', (err, file) => {
        if(err){
            return sendResponse(res, 500, error('could not fetch rankings'));
        } 
        const student = JSON.parse(file);
        sendResponse(res, 200, JSON.stringify(student));
    });
}

function register(req, res, data) {

    const info = JSON.parse(data);
    
    const nickname = info['nickname'];
    const password = info['password'];

    if(!nickname || !password){

        const json = JSON.stringify({
            'error': 'unexpected request body'
        });

        return sendResponse(res, 400, json);
    }

    fs.readFile('db/users.json', (err, file) => {
        if(err){
            return sendResponse(res, 500, error('could not fetch rankings'));
        } 
        const users = JSON.parse(file);

        let savedPassword = users[nickname];

        const hashPassword = crypto
                                .createHash('md5')
                                .update(password)
                                .digest('hex');

        if(savedPassword && savedPassword != hashPassword) {
            const json = JSON.stringify({
                'error': 'Password does not match.'
            });

            return sendResponse(res, 401, json);
        }

        users[nickname] = hashPassword;
    
        fs.writeFile("db/users.json", JSON.stringify(users), 'utf8', err => {
            if (err) return sendResponse(res, 500, error('could not save to user db'));
            sendResponse(res, 200, JSON.stringify({}));
          });
    });
}

module.exports ={
    unknownRequest, ranking, register
}