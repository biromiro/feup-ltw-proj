const fs = require('fs');
const crypto = require('crypto');
const {
    Board,
    Player,
    SowOutcome
} = require('./game');

let waitingGames = {}
let runningGames = {}

function sendResponse(res, code, content) {
    res.writeHead(code, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Headers': 'Access-Control-Allow-Origin',
        'Access-Control-Allow-Origin': '*',
    });
    res.end(content);
}

function unknownRequest(req, res) {
    if (req.method == 'POST') {
        json = JSON.stringify({
            'error': 'unknown POST request'
        });
        sendResponse(res, 400, json);
    } else if (req.method == 'GET') {
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

function error(res, code, mes) {
    const json = JSON.stringify({
        'error': mes,
    });

    return sendResponse(res, code, json);
}

function errorInBody(res) {
    return error(res, 400, 'unexpected request body');
}


function checkPassword(res, nickname, password) {

    if (!fs.existsSync('db/users.json')) {
        error(res, 500, 'could not fetch users');
        return false;
    }

    let file = fs.readFileSync('db/users.json');

    const users = JSON.parse(file);

    let savedPassword = users[nickname];

    const hashPassword = crypto
        .createHash('md5')
        .update(password)
        .digest('hex');

    if (!savedPassword) {
        let json = JSON.stringify({
            'error': 'User not registered.'
        });

        sendResponse(res, 401, json);
        return false;

    }

    if (savedPassword != hashPassword) {
        let json = JSON.stringify({
            'error': 'Password does not match.'
        });

        sendResponse(res, 401, json);
        return false;
    }

    return true;
}

function genBoardResponseJSON(game, endGame) {
    const res = {
        'board': {
            'turn': '',
            'sides': {}
        },
        'stores': {}
    };
    const cavitySeeds = []

    for (let i = 0; i < game.numCavities; i++)
        cavitySeeds.push(game.board.cavities[i].seeds.length);

    cavitySeeds.push(game.board.cavities[game.numCavities].seeds.length);

    for (let i = game.numCavities + 1; i < 2 * game.numCavities + 1; i++)
        cavitySeeds.push(game.board.cavities[i].seeds.length);

    cavitySeeds.push(game.board.cavities[2 * game.numCavities + 1].seeds.length);

    const p1 = {
        'store': cavitySeeds[game.numCavities],
        'pits': cavitySeeds.slice(0, game.numCavities)
    }
    const p2 = {
        'store': cavitySeeds[cavitySeeds.length - 1],
        'pits': cavitySeeds.slice(game.numCavities + 1, -1)
    };

    res['board']['sides'][game.players[0]] = p1;
    res['board']['sides'][game.players[1]] = p2;
    res['board']['turn'] = game.turn;

    res['stores'][game.players[0]] = p1.store;
    res['stores'][game.players[1]] = p2.store;

    if (endGame.finished) {
        res['winner'] = p1.store == p2.store ? null :
                 (p1.store > p2.store ? game.players[0] : game.players[1]);
    }
    else if (endGame.left) 
        res['winner'] = endGame.left == game.players[0] ? game.players[1] : game.players[0];
    
    return res;
}

function sendUpdateEvent(game, endGame) {
    for(let key in game.responses){
        game.responses[key].write(`data: ${JSON.stringify(genBoardResponseJSON(game, endGame))}\n\n`);
    }
}

function ranking(res) {
    fs.readFile('db/ranking.json', (err, file) => {
        if (err) {
            return error(res, 500, 'could not fetch rankings');
        }
        const student = JSON.parse(file);
        sendResponse(res, 200, JSON.stringify(student));
    });
}

function register(res, data) {

    const info = JSON.parse(data);

    const nickname = info['nick'];
    const password = info['password'];

    if (!nickname || !password) return errorInBody(res);

    fs.readFile('db/users.json', (err, file) => {
        if (err) {
            return error(res, 500, 'could not fetch users');
        }
        const users = JSON.parse(file);

        let savedPassword = users[nickname];

        const hashPassword = crypto
            .createHash('md5')
            .update(password)
            .digest('hex');

        if (savedPassword && savedPassword != hashPassword) {
            const json = JSON.stringify({
                'error': 'Password does not match.'
            });

            return sendResponse(res, 401, json);
        }

        users[nickname] = hashPassword;

        fs.writeFile("db/users.json", JSON.stringify(users), 'utf8', err => {
            if (err) return error(res, 500, 'could not save to user db');
            sendResponse(res, 200, JSON.stringify({}));
        });
    });
}

function join(res, data) {
    const info = JSON.parse(data);
    
    const group = info['group'];
    const nickname = info['nick'];
    const password = info['password'];
    let size = info['size'];
    let initial = info['initial'];

    if (!nickname || !password || isNaN(size) || isNaN(initial) || (isNaN(group) && group))
        return errorInBody(res);

    if (!checkPassword(res, nickname, password)) return;

    const gameString = group + "-" + size + "-" + initial;

    let savedGame = waitingGames[gameString];

    if (savedGame) {
        const savedGameHash = savedGame['hash'];

        if (savedGame['nickname'] != nickname) {
            const board = new Board(parseInt(size), parseInt(initial));
            board.setPlayers(savedGame.nickname, nickname);

            const gameBoard = {
                'board': board,
                'players': [savedGame.nickname, nickname],
                'turn': savedGame.nickname,
                'numCavities': parseInt(size),
                'responses': {}
            }

            gameBoard.responses[savedGame.nickname] = savedGame.response;

            runningGames[savedGameHash] = gameBoard;

            delete waitingGames[gameString];

            let timeout = setInterval(() => {
                if (runningGames[savedGameHash].responses[savedGame.nickname] &&
                    runningGames[savedGameHash].responses[nickname]) {
                    clearInterval(timeout);
                    sendUpdateEvent(runningGames[savedGameHash], {});
                }
            }, 100);


        }

        const json = JSON.stringify({
            'game': savedGameHash,
        });

        return sendResponse(res, 200, json);
    }

    const savedGameHash = crypto.randomBytes(20).toString('hex');

    waitingGames[gameString] = {
        "hash": savedGameHash,
        "nickname": nickname
    };

    let json = JSON.stringify({
        'game': savedGameHash
    });

    sendResponse(res, 200, json);

}

function leave(res, data) {
    const info = JSON.parse(data);

    const game = info['game'];
    const nickname = info['nick'];
    const password = info['password'];

    if (!game || !nickname || !password)
        return errorInBody(res);

    if (!checkPassword(res, nickname, password)) return;

    for (let key in waitingGames) {
        if (key['hash'] == game) {
            delete waitingGames[key];
            return sendResponse(res, 200, JSON.stringify({}));
        }
    }

    let runningGame = runningGames[game];

    if (runningGame) {
        sendUpdateEvent(runningGame,  {"left" : nickname});
        delete runningGames[game];
        return sendResponse(res, 200, JSON.stringify({}));
    }

    error(res, 400, 'Not a valid game');
}

function notify(res, data) {
    const info = JSON.parse(data);

    const game = info['game'];
    const nickname = info['nick'];
    const password = info['password'];
    let cavity = info['move'];

    if (!game || !nickname || !password || isNaN(cavity))
        return errorInBody(res);

    cavity = parseInt(cavity);

    if (!checkPassword(res, nickname, password)) return;

    const runningGame = runningGames[game];

    if (runningGame && runningGame.players.includes(nickname)) {
        if (runningGame.turn != nickname) return error(res, 400, 'Not your turn to play');

        if (runningGame.players[1] == nickname) cavity += runningGame.numCavities + 1;

        if (cavity >= runningGame.board.cavities.length) return error(res, 400, 'No such cavity')

        const cavityToPlay = runningGame.board.cavities[cavity];

        const result = runningGame.board.turn(cavityToPlay, nickname);

        if (result == 'EmptySourceCavity') return error(res, 400, 'Cavity is currently empty')
        else if (result == 'InvalidSourceCavity') return error(res, 400, 'No such cavity');

        if (result == 'GameOver') {
            sendUpdateEvent(runningGame, {"finished": true});
            delete runningGames[game];
            return sendResponse(res, 200, JSON.stringify({}));
        }

        if (result != 'PlayAgain') runningGame.turn = runningGame.board.getOppositePlayer(nickname);

        sendUpdateEvent(runningGame, {});

        return sendResponse(res, 200, JSON.stringify({}));
    }

    error(res, 400, 'Not a valid game');
}

function update(res, info) {
    const game = info.game;
    const nickname = info.nick;

    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Headers': 'Access-Control-Allow-Origin',
        'Access-Control-Allow-Origin': '*',
    };

    for (let games in waitingGames) {

        const key = waitingGames[games];

        if (key['hash'] == game) {
            res.writeHead(200, headers);
            key['response'] = res;
            return;
        }
    }

    if(runningGames[game]){
        res.writeHead(200, headers);
        runningGames[game].responses[nickname] = res;
        return;
    }

    error(res, 400, 'Invalid game reference');
}

module.exports = {
    unknownRequest,
    ranking,
    register,
    join,
    leave,
    notify,
    update
}