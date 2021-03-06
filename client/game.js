let board = undefined;
let animationCounter = 0;

const Player = {
    Player1 : 'Player1',
    Player2 : 'Player2',
}

const SowOutcome = {
    InvalidSourceCavity: 'InvalidSourceCavity',
    EmptySourceCavity: 'EmptySourceCavity',
    PlayAgain: 'PlayAgain',
};

function range(start, end) {
    return Array(end - start + 1).fill().map((_, idx) => start + idx)
}

class Board
{
    constructor(body, nCavities, nSeeds, AILevel, turn)
    {
        this.body = body;

        this.cavities = [];
        
        this.nCavities = nCavities;

        this.playerTurn = turn;

        const depths = new Map();
        depths.set('very-easy', 0);
        depths.set('easy', 1);
        depths.set('medium', 2);
        depths.set('hard', 3);
        depths.set('very-hard', 4);
        depths.set('godlike', 5);
        
        if (AILevel != null && depths.has(AILevel))
        {
            this.AIDepth = depths.get(AILevel);
        }

        depths.clear();

        for (let i = 0; i < this.nCavities; i++)
            this.cavities.push(new Cavity(this, nSeeds));
        
        this.cavities.push(new Cavity(this, 0, 'c-big c-right'));
        
        for (let i = 0; i < this.nCavities; i++)
            this.cavities.push(new Cavity(this, nSeeds));

        this.cavities.push(new Cavity(this, 0, 'c-big c-left'));

        this.cavitiesIndices = [];
        let invertedIndices = range(nCavities + 2, nCavities * 2 + 1);
        this.cavitiesIndices = this.cavitiesIndices.concat(invertedIndices.reverse());
        this.cavitiesIndices.push(nCavities + 1);
        this.cavitiesIndices.push(0);
        this.cavitiesIndices = this.cavitiesIndices.concat(range(1, nCavities));
    }

    update(boardInfo, player) {
        let playerArr = [];
        let advArr = [];

        Object.entries(boardInfo.sides).forEach((entry) => {
            const [key, value] = entry;
            if(key == player) {
                playerArr = value.pits;
                playerArr.push(value.store);
            } else {
                advArr = value.pits;
                advArr.push(value.store);
            }
        });

        let seedVals = playerArr.concat(advArr);

        let movedSeeds = [];
        for(let i = 0; i < seedVals.length; i++) {
            let newSeedNum = seedVals.at(i);
            let cavity = this.cavities.at(i);
            if(newSeedNum < cavity.seeds.length)
                movedSeeds = movedSeeds.concat(this.take(cavity.seeds.length - newSeedNum, cavity));
        }

        for(let i=0; i < seedVals.length; i++) {
            let newSeedNum = seedVals.at(i);
            let cavity = this.cavities.at(i);
            if(newSeedNum > cavity.seeds.length)
                this.put(newSeedNum - cavity.seeds.length, movedSeeds, cavity);
        }

        if(boardInfo.turn == player) newMessage({"message": `It's your turn.`})
        else newMessage({"message": `It's ${boardInfo.turn} turn.`})

        this.updateDisplay();
    }

    fromBoard()
    {
        let newBoard = new Board(null, this.nCavities, 0);
        
        newBoard.cavities = [];
        this.cavities.forEach(cavity => {
            let cavityCopy = cavity.fromCavity(newBoard);
            newBoard.cavities.push(cavityCopy);
        });
        newBoard.nCavities = this.nCavities;
        newBoard.cavitiesIndices = [...this.cavitiesIndices];
        newBoard.AIDepth = this.AIDepth;

        return newBoard;
    }

    genDisplay()
    {
        this.element = document.createElement('div');
        this.element.className = 'board';
        this.body.appendChild(this.element);

        const root = document.querySelector(':root');
        root.style.setProperty('--nCavities', this.nCavities);
        
        this.cavitiesIndices.forEach(index => {
            this.cavities[index].genDisplay();
            this.cavities[index].hookOnClick();
        });

        board = this;
    }

    updateDisplay()
    {
        this.cavities.forEach(cavity => {
            cavity.updateDisplay();
        });
    }

    getPoints(player)
    {
        let storageIdx = player == Player.Player1 ? this.nCavities : 2 * this.nCavities + 1;
        return this.cavities[storageIdx].seeds.length;
    }

    getSowableCavities(player)
    {
        let sowableCavities = [];

        this.cavities.forEach(cavity => {
            if (cavity.sowable(player))
                sowableCavities.push(cavity);
        })

        return sowableCavities;
    }

    move(n, from, to)
    {
        for (let i = 0; i < n; i++)
        {
            let movedSeed = from.seeds.pop();
            movedSeed.cavity = to;
            to.seeds.push(movedSeed);

            movedSeed.wasChanged = true;
        }
    }

    take(n, cavity) {
        let arr = [];
        for (let i = 0; i < n; i++)
            arr.push(cavity.seeds.pop());
        return arr;
    }

    put(n, seeds, cavity) {
        for (let i = 0; i < n; i++)
        {
            cavity.seeds.push(seeds[i]);
            seeds[i].cavity = cavity;
            seeds[i].wasChanged = true;
        }
        seeds.splice(0, n);
    }

    sow(sourceCavity, player)
    {
        //mustn't sow from enemy cavitites
        if (sourceCavity.player() != player)
        {
            return SowOutcome.InvalidSourceCavity;
        }

        //mustn't sow from storage cavities
        if (sourceCavity.isStorage())
        {
            return SowOutcome.InvalidSourceCavity;
        }

        //mustn't sow from empty cavities
        if (sourceCavity.empty())
        {
            return SowOutcome.EmptySourceCavity;
        }

        const targetCavities = [...this.cavities];

        for (let i = 0; i < targetCavities.length; i++) {
            const cavity = targetCavities[i];
            //mustn't sow on the adversary's storage cavity
            if(cavity.isStorage() && cavity.player() != sourceCavity.player()) {
                targetCavities.splice(i, 1);
                break;
            }
        }
        //sow
        let targetCavity;
        let targetCavityIdx = targetCavities.indexOf(sourceCavity);

        while (sourceCavity.seeds.length)
        {
            targetCavityIdx = (targetCavityIdx + 1) % targetCavities.length;
            targetCavity = targetCavities[targetCavityIdx];
            this.move(1, sourceCavity, targetCavity);
        }

        if (targetCavity.player() == sourceCavity.player() && targetCavity.isStorage())
            return SowOutcome.PlayAgain;
        
        if (targetCavity.player() == sourceCavity.player() && targetCavity.seeds.length == 1)
        {
            const storageIdx = player == Player.Player1 ? this.nCavities : 2 * this.nCavities + 1;
            let storage = this.cavities[storageIdx];

            this.move(1, targetCavity, storage);

            const cavityIdx = this.cavities.indexOf(targetCavity);
            let toMove = this.cavities[this.nCavities*2 - cavityIdx];
            this.move(toMove.seeds.length, toMove, storage);
        }
    }

    getAIBestOutcome(player)
    {
        let sowableCavities = this.getSowableCavities(player);

        if(sowableCavities.length == 0) //no options base case
            return {p1: this.getPoints(Player.Player1), p2: this.getPoints(Player.Player2)};
        
        let outcomes = [];
        sowableCavities.forEach(sourceCavity => {
            let simBoard = this.fromBoard(); //generate a board
            let cavityIdx = this.cavities.indexOf(sourceCavity);
            let sourceCavitySim = simBoard.cavities.at(cavityIdx);
            let playAgain = simBoard.sow(sourceCavitySim, player); //simulate sowing
            let bestLocalOutcome = {cavity: cavityIdx, p1: simBoard.getPoints(Player.Player1), p2: simBoard.getPoints(Player.Player2)};
            if (simBoard.AIDepth != 0) //recursive structure
            {
                simBoard.AIDepth = simBoard.AIDepth - 1;
                let bestResult = simBoard.getAIBestOutcome(
                    playAgain != SowOutcome.PlayAgain ?
                    (player == Player.Player1 ? Player.Player2 : Player.Player1) : player
                ); //get best recursive result
                bestLocalOutcome.p1 = bestResult.p1; //best local outcome is determined by best next option
                bestLocalOutcome.p2 = bestResult.p2;
            }
            outcomes.push(bestLocalOutcome);
        });

        let bestOutcome = outcomes[0];
        outcomes.forEach(outcome => {
            if (player == Player.Player1 && outcome.p1 < bestOutcome.p1)
                bestOutcome = outcome;
                
            else if (player == Player.Player2 && outcome.p2 > bestOutcome.p2)
                bestOutcome = outcome;
        });

        return bestOutcome;
    }

    turnAI()
    {
        setTimeout(() => {
            let bestOutcome = this.getAIBestOutcome(Player.Player2);

            let result = this.sow(this.cavities.at(bestOutcome.cavity), Player.Player2);

            if (result == SowOutcome.PlayAgain)
            {
                if(this.checkEndGame(Player.Player2)) return;
                newMessage({"message": `It's the computer's turn.`})
                this.updateDisplay();
                return setTimeout(() => {
                    return this.turnAI();
                }, 1000);
            }

            this.playerTurn = true;

            this.updateDisplay();

            if(!this.checkEndGame(Player.Player1))
                newMessage({"message": `It's your turn.`})
                
        }, 1000);
        
    }

    turn(sourceCavity)
    {
        if(!this.playerTurn) {
            return newMessage({"error": `Wait it out! The bot is thinking...`})
        }

        let result = this.sow(sourceCavity, Player.Player1);
        
        if (result == SowOutcome.PlayAgain){
            if(!this.checkEndGame(Player.Player1))
                newMessage({"message": `It's your turn.`})
            return;
        }
        else if (this.checkEndGame(Player.Player2)) return;

        if(result == SowOutcome.InvalidSourceCavity || result == SowOutcome.EmptySourceCavity) {
            return newMessage({"error": `This cavity is empty/is invalid!`})
        }

        if (this.AIDepth != null){
            newMessage({"message": `It's the computer's turn.`})
            this.turnAI();
        }

        this.playerTurn = false;
    }

    checkEndGame(player) {
        let sowableCavitiesP1 = this.getSowableCavities(Player.Player1);
        let sowableCavitiesP2 = this.getSowableCavities(Player.Player2);

        if((sowableCavitiesP1.length == 0 && player == Player.Player1) || 
           (sowableCavitiesP2.length == 0 && player == Player.Player2)) {

               this.collectSeeds(sowableCavitiesP1, sowableCavitiesP2);
               const p1 = this.getPoints(Player.Player1), p2 = this.getPoints(Player.Player2);
               setTimeout(() => {
                returnWinner(true, p1 == p2 ? null : (p1 > p2 ? Player.Player1 : Player.Player2));
               }, 1000);
               return true;
        }

        return false;
    }

    collectSeeds(sowableCavitiesP1, sowableCavitiesP2) {
        sowableCavitiesP1.forEach(cavity => {
            this.move(cavity.seeds.length, cavity, this.cavities[this.nCavities]);
        });

        sowableCavitiesP2.forEach(cavity => {
            this.move(cavity.seeds.length, cavity, this.cavities[this.cavities.length - 1]);
        });
    }
}

class Cavity
{       
    genDisplay()
    {
        this.element = document.createElement('div');
        this.element.className = this.specifier ? 'cavity ' + this.specifier : 'cavity';
        this.board.element.appendChild(this.element);

        this.seeds.forEach(seed => {
            seed.calcDisplay();
            seed.genDisplay();
        });

        this.updateScore();
    }

    updateDisplay()
    {
        this.seeds.forEach( (seed) => {
            if (seed.wasChanged)
            {
                seed.element.remove(seed);
                seed.calcDisplay();
                seed.genDisplay();
            }
        });
        this.updateScore();
    }

    updateScore() {
        if(this.isStorage() && this.player() == Player.Player1) {
            document.getElementById('p1-points').innerText = this.element.childElementCount;
        } else if (this.isStorage() && this.player() == Player.Player2) {
            document.getElementById('p2-points').innerText = this.element.childElementCount;
        }
    }

    player()
    {
        const idx = this.board.cavities.indexOf(this);
        return idx <= this.board.nCavities ? Player.Player1 : Player.Player2;
    }

    hookOnClick()
    {
        if (this.player() == Player.Player2 || this.isStorage())
            return;

        this.element.addEventListener('click', () => {
        if(isAIGameType()) {
            board.turn(this);
            board.updateDisplay();
        } else {
            notify(board.cavities.indexOf(this));
        }});
    }

    sowable(player)
    {
        return this.player() == player && !this.isStorage() && !this.empty();
    }

    isStorage()
    {
        return this.specifier != null;
    }

    empty()
    {
        return !this.seeds.length;
    }

    deleteChildren()
    {
        let child = this.element.lastElementChild; 
        
        while (child) {
            this.element.removeChild(child);
            child = this.element.lastElementChild;
        }
    }

    fromCavity(newBoard)
    {
        return new Cavity(newBoard, this.seeds.length, this.specifier);
    }

    constructor(board, nSeeds, specifier)
    {
        this.board = board;

        this.specifier = specifier;

        this.seeds = [];

        for (let i = 0; i < nSeeds; i++)
        {
            let seed = new Seed(this);
            this.seeds.push(seed);
        }     
    }
}

class Seed
{
    calcDisplay() {
        this.wasChanged = false;
        const width = this.cavity.element.offsetWidth;
        const height = this.cavity.element.offsetHeight;

        const proportionsElement = this.cavity.board.element.querySelector('.cavity:not(.c-big)');
        const xProportion = proportionsElement.offsetWidth;
        const yProportion = proportionsElement.offsetHeight;
        
        const xOffset = width / 8;
        const yOffset = height / 8;
        const x = Math.random() * width*1.5 + xOffset;
        const y = Math.random() * height*1.3 + yOffset;
        const degs = Math.random() * 360;
        const scaleX = 0.005 * xProportion;
        const scaleY = 0.006 * yProportion;
        this.element = document.createElement('div');
        this.element.className = 'seed';
        this.element.style.transform = `translate(${x}%, ${y}%) rotate(${degs}deg) scaleY(${scaleY}) scaleX(${scaleX})`;
    }

    genDisplay()
    {
        this.cavity.element.appendChild(this.element);
    }

    constructor(cavity)
    {
        this.cavity = cavity;
        this.element = undefined;
    }
}

let activeSession = {
    'valid': false,
    'nick': "",
    'password': ""
}

let currentGame = {
    gameCode: '',
    groupCode: 0,
    board: undefined,
    adversary: undefined
}

function setCookie(name,value,days) {
    let expires = "";
    if (days) {
        let date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + encodeURI(value || "")  + expires + "; path=/";
}
function getCookie(name) {
    let nameEQ = name + "=";
    let ca = document.cookie.split(';');
    for(let i=0;i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

let messages = document.getElementById('messages');
let getUpdates = undefined;
let leaveTimeout = undefined;

let playerName = document.getElementById('p1-name');
let adversaryName = document.getElementById('p2-name');

function handleError(data, container) {
    if (!container) return;
    container.innerText = data.error;

    container.getAnimations().forEach((anim) => {
        anim.cancel();
        anim.play();
    });
}

function newMessage(data) {
    let tag = document.createElement("p");
    let text = data.error ? data.error : data.message;

    if (data.error) {
        tag.classList.add('error');
    }
    tag.style.padding = "3px";
    tag.style.border = "thin solid var(--main-text-color)";
    tag.style.borderRadius = "25px";
    setTimeout(() => {
        tag.style.border = "none";
        tag.style.padding = "0px";
    }, 1000);

    tag.innerText = text;

    messages.prepend(tag);
}

function changeNicknames(adversary) {
    playerName.innerText = activeSession.nick ? activeSession.nick : 'Player';
    adversaryName.innerText = adversary ? adversary : 'Computer';
}

async function getLeaderboard(localLdb, serverLdb) {

    const ranking = POSTRequest({}, 'ranking');
    ranking.then(function (data) {
        if (data.error) return handleError(data);
        processLeaderboard(serverLdb, data);
    })

    if (typeof(Storage) !== "undefined") {
        const data = JSON.parse(localStorage.getItem("leaderboard"));
        processLeaderboard(localLdb, data);
    } else {
        localLdb.innerHTML = `<h2 class="align-center">Your browser does not support WebStorage.</h2>`
    }

}

function processLeaderboard(container, data) {
    let header = `<tr>
                    <th>Username</th>
                    <th>Games</th>
                    <th>Victories</th>
                    </tr>`

    if(!data || !data.ranking) {
        container.innerHTML = `<h2 class="align-center">You haven't played any games.</h2>`
        return;
    }

    container.innerHTML = header;

    let ranking = data.ranking;

    for (let [index, player] of ranking.entries()) {

        let style = "";

        switch (index) {
            case 0:
                style = "gold";
                break;
            case 1:
                style = "silver";
                break;
            case 2:
                style = "#CD7F32";
        }

        if(index >= 10) break;

        container.innerHTML += `<tr>
                                    <td>${player.nick}</td>
                                    <td>${player.games}</td>
                                    <td style="background-color:${style};">${player.victories}</td>
                                    </tr>`
    }
}

let signInContainer = document.getElementById('signin');
let profileContainer = document.getElementById('profile');
let nicknameContainer = document.getElementById('profile-nickname');

window.onload = () => {
    let nick = getCookie('nick');
    let password = getCookie('password');
    
    if (nick && password) {
        activeSession.valid = true;
        activeSession.password = password;
        activeSession.nick = nick;

        signInContainer.style.display = "none";
        profileContainer.style.display = "flex";

        nicknameContainer.innerText = activeSession.nick;
    }
}

async function login(loginForm, loginErrorMessage) {
    let params = {
        'nick': loginForm['username-login'].value,
        'password': loginForm['password-login'].value
    }
    const login = POSTRequest(params, 'register');
    login.then(function (data) {
        if (data.error) return handleError(data, loginErrorMessage);
        activeSession.valid = true;
        activeSession.nick = params.nick;
        activeSession.password = params.password;

        signInContainer.style.display = "none";
        profileContainer.style.display = "flex";

        nicknameContainer.innerText = activeSession.nick;

        setCookie('nick', activeSession.nick, 30);
        setCookie('password', activeSession.password, 30);
    });

}

async function register(signupForm, signupErrorMessage) {
    let params = {
        'nick': signupForm['username-signup'].value,
        'password': signupForm['password-signup'].value
    }
    const signup = POSTRequest(params, 'register');
    signup.then(function (data) {
        if (data.error) return handleError(data, signupErrorMessage);

        activeSession.valid = true;
        activeSession.nick = params.nick;
        activeSession.password = params.password;

        signInContainer.style.display = "none";
        profileContainer.style.display = "flex";

        nicknameContainer.innerText = activeSession.nick;
        setCookie('nick', activeSession.nick, 30);
        setCookie('password', activeSession.password, 30);
    });

}

function logout() {
    activeSession.valid = false;
    activeSession.nick = "";
    activeSession.password = "";

    signInContainer.style.display = "flex";
    profileContainer.style.display = "none";
}

let preGameContainer = document.getElementById('pre-game-configs');
let inGameContainer = document.getElementById('in-game-summary');

async function join(gameStartForm, gameStartErrorMessage) {

    if (!activeSession.valid) return handleError({
        error: 'Please login first.'
    }, gameStartErrorMessage);

    let params = {
        'nick': activeSession.nick,
        'password': activeSession.password,
        'size': gameStartForm.size,
        'initial': gameStartForm.initial
    }
    const groupCode = gameStartForm.group;
    if (groupCode) params['group'] = groupCode;

    const join = POSTRequest(params, 'join');
    join.then(function (data) {
        if (data.error) return handleError(data, gameStartErrorMessage);
        currentGame.gameCode = data.game;
        currentGame.groupCode = groupCode;

        getUpdates = setServerSentUpdates(activeSession.nick, currentGame.gameCode);
        setUpdateResponse(params);

        waiting();
    });
}

function updateLocalLeaderboard(won) {
    if (typeof(Storage) !== "undefined") {
        let data = {}
        let leaderboard = localStorage.getItem("leaderboard");

        if(leaderboard) leaderboard = JSON.parse(leaderboard).data;
        else leaderboard = {};

        let nickname = activeSession.nick != "" ? activeSession.nick : "This PC";

        let score = {};
        if(leaderboard && leaderboard[nickname]) {
            score = leaderboard[nickname];

            if(won) score.victories += 1;

            score.games += 1;
        } else {
            score = {nick: nickname, games: 1, victories: won ? 1 : 0}
        }

        leaderboard[nickname] = score;

        data.data = leaderboard;
        data.ranking = [];
        
        for (const key in leaderboard) {
            data.ranking.push(leaderboard[key]);
        }

        data.ranking = data.ranking.sort((val1, val2) => {
            return val2.victories == val1.victories ?
            val1.games - val2.games :
            val2.victories - val1.victories
        });

        localStorage.setItem("leaderboard", JSON.stringify(data));
    }
}

function returnWinner(isAI, winner) {
    if(isAI) updateLocalLeaderboard(winner == Player.Player1); 
    else stopUpdates();

    currentGame.board.updateDisplay();
    
    currentGame = {};

    setTimeout( () => {
        const gameArea = document.getElementsByClassName('board-area')[0];
        clearInnerContent(gameArea);
        gameArea.innerHTML = "<canvas id=\"loadingAnim\"></canvas>";
        if (isAI) {
            if (winner == null) {
                const message = "There was a tie!";
                animateCanvas(message);
                newMessage({"message": message})
            }
            else if (winner == Player.Player1) {
                const message = `You won! Congratulations${activeSession.nick ? ', ' + activeSession.nick : ''}!`;
                animateCanvas(message);
                newMessage({"message": message})
            }
            else {
                const message = "You lost! Bots are tough, aren't they?";
                animateCanvas(message);
                newMessage({"message": message})
            } 
        } else {
            if (winner == null) {
                const message = "There was a tie!";
                animateCanvas(message);
                newMessage({"message": message})
            }
            else if (winner == activeSession.nick) {
                const message = `You won! Congratulations, ${winner}!`;
                animateCanvas(message);
                newMessage({"message": message})
            }
            else {
                const message = `You lost. ${winner} wins!`;
                animateCanvas(message);
                newMessage({"message": message})
            } 
        }

        leaveTimeout = setTimeout(function() {
            endGame();
        }, 4000);

    }, 1000);
}

function setUpdateResponse(params) {
    getUpdates.onmessage = (event) => {
        let data = JSON.parse(event.data);

        if(!data.board){
            endGame();
            return stopUpdates();
        }

        if (!currentGame.board) startGame(params);

        currentGame.board.update(data.board, activeSession.nick);

        if (data.winner || data.winner === null) return returnWinner(false, data.winner);

        if (!currentGame.adversary) {
            Object.keys(data.board.sides).forEach((key) => {
                if (key != activeSession.nick)
                    currentGame.adversary = key;
            });

            changeNicknames(currentGame.adversary);
        }
    }

    getUpdates.onerror = (error) => {
        console.log(error);
    }
}


function waiting() {
    preGameContainer.style.display = 'none';
    inGameContainer.style.display = 'flex';

    const gameArea = document.getElementsByClassName('board-area')[0];
    clearInnerContent(gameArea);
    gameArea.innerHTML = "<canvas id=\"loadingAnim\"></canvas>";
    animateCanvas("Waiting for another player to join");

    document.getElementById('p1-points').innerText = 0;
    document.getElementById('p2-points').innerText = 0;

    changeNicknames('Opponent');
}

function startGame(params) {
    preGameContainer.style.display = 'none';
    inGameContainer.style.display = 'flex';

    const gameArea = document.getElementsByClassName('board-area')[0];
    clearInnerContent(gameArea);
    currentGame.board = new Board(gameArea, parseInt(params.size), parseInt(params.initial), params.AILevel, params.turn);

    if(params.AILevel) setupFirstTurn(params.turn);

    currentGame.board.genDisplay();
}

function setupFirstTurn(turn) {
    if(turn)
        newMessage({"message": `It's your turn.`});
    else {
        newMessage({"message": `It's the Computer's turn.`});
        currentGame.board.turnAI();
    }
}

async function leave(gameLeaveErrorMessage) {

    if (!activeSession.valid) return handleError({
        error: 'You should be logged in - please reload the page.'
    }, gameLeaveErrorMessage);

    if(leaveTimeout) endGame();

    let params = {
        'nick': activeSession.nick,
        'password': activeSession.password,
        'game': currentGame.gameCode,
        'group': currentGame.groupCode
    }

    const join = POSTRequest(params, 'leave');
    join.then(function (data) {
        if (data.error) return handleError(data, gameLeaveErrorMessage);

        currentGame = {};

        endGame();
    });
}

function stopUpdates() {
    getUpdates.close();
}

function endGame() {

    if(leaveTimeout) {
        clearTimeout(leaveTimeout);
        leaveTimeout = undefined;
    }
    
    const gameArea = document.getElementsByClassName('board-area')[0];
    clearInnerContent(gameArea);

    gameArea.innerHTML = "<canvas id=\"loadingAnim\"></canvas>";
    animateCanvas("No game is currently being played");


    preGameContainer.style.display = 'flex';
    preGameContainer.style += "flex-direction: column;"
    inGameContainer.style.display = 'none';

    clearInnerContent(messages);
}

async function notify(cavityNumber) {
    if (!activeSession.valid) return handleError({
        error: 'You should be logged in - please reload the page.'
    }, gameLeaveErrorMessage);

    let params = {
        'nick': activeSession.nick,
        'password': activeSession.password,
        'game': currentGame.gameCode,
        'move': cavityNumber
    }

    const notify = POSTRequest(params, 'notify');
    notify.then(function (data) {
        if (data.error) return newMessage(data);
    });
}