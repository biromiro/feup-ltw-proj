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

function errorInBody(res) {
    const json = JSON.stringify({
        'error': 'unexpected request body'
    });

    return sendResponse(res, 400, json);
}

function checkPassword(res, nickname, password) {

    if(!fs.existsSync('db/users.json')){
        sendResponse(res, 500, error('could not fetch users'));
        return false;
    }

    let file = fs.readFileSync('db/users.json');

    const users = JSON.parse(file);

    let savedPassword = users[nickname];

    const hashPassword = crypto
                            .createHash('md5')
                            .update(password)
                            .digest('hex');

    if(!savedPassword) {
        let json = JSON.stringify({
            'error': 'User not registered.'
        });

        sendResponse(res, 401, json);
        return false;

    }
    
    if(savedPassword != hashPassword) {
        let json = JSON.stringify({
            'error': 'Password does not match.'
        });

        sendResponse(res, 401, json);
        return false;
    }

    return true;
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

function register(res, data) {

    const info = JSON.parse(data);
    
    const nickname = info['nickname'];
    const password = info['password'];

    if(!nickname || !password) return errorInBody(res);

    fs.readFile('db/users.json', (err, file) => {
        if(err){
            return sendResponse(res, 500, error('could not fetch users'));
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

function join(res, data) {
    const info = JSON.parse(data);
    
    const group = info['group'];
    const nickname = info['nick'];
    const password = info['password'];
    const size = info['size'];
    const initial = info['initial'];

    if(!nickname || !password || typeof size != "number" || typeof initial != "number")
        return errorInBody(res);

    if(!checkPassword(res, nickname, password)) return;

    const gameString = (group ? group.toString() : "") + "-" + size.toString() + "-" + initial.toString();

    fs.readFile('db/waiting.json', (err, file) => {
        if(err){
            return sendResponse(res, 500, error('could not fetch waiting game list'));
        } 
        const games = JSON.parse(file);

        let savedGame = games[gameString];

        if(savedGame) {
            const savedGameHash = savedGame['hash'];

            if(savedGame['nickname'] != nickname){
                delete games[gameString];
                fs.writeFile("db/waiting.json", JSON.stringify(games), 'utf8', err => {
                    if (err) throw err;
                });
            } 
            
            const json = JSON.stringify({
                'game': savedGameHash,
            });

            return sendResponse(res, 200, json);
        }

        const savedGameHash = crypto.randomBytes(20).toString('hex');

        console.log(savedGameHash);

        games[gameString] = {
            "hash": savedGameHash,
            "nickname": nickname
        };
    
        fs.writeFile("db/waiting.json", JSON.stringify(games), 'utf8', err => {
            if (err) return sendResponse(res, 500, error('could not save to waiting games db'));
            let json = JSON.stringify({
                'game': savedGameHash
            });
            sendResponse(res, 200, json);
          });
    });
}

module.exports ={
    unknownRequest, ranking, register, join
}