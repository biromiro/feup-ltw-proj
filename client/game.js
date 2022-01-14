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
    constructor(body, nCavities, nSeeds, AILevel)
    {
        this.body = body;

        this.cavities = [];
        
        this.nCavities = nCavities;

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

        if(boardInfo.turn == player) newMessage({message: `It's your turn.`})
        else newMessage({message: `It's ${boardInfo.turn} turn.`})

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

        if(this.body) this.updateDisplay();

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
        if(this.body) this.updateDisplay();
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
        let bestOutcome = this.getAIBestOutcome(Player.Player2);

        console.log(bestOutcome);

        let result = this.sow(this.cavities.at(bestOutcome.cavity), Player.Player2);

        if (result == SowOutcome.PlayAgain)
        {
            console.log('Playing again!');
            if(this.checkEndGame(Player.Player2)) return;
            this.turnAI();
        }
        
        return this.checkEndGame(Player.Player2);
    }

    turn(sourceCavity)
    {
        let result = this.sow(sourceCavity, Player.Player1);

        if (result == SowOutcome.PlayAgain)
            return this.checkEndGame(Player.Player1);
        else this.checkEndGame(Player.Player2);

        if (this.AIDepth != null){
            this.turnAI();
        }
        else
            alert('Other player is playing...');
    }

    checkEndGame(player) {
        let sowableCavitiesP1 = this.getSowableCavities(Player.Player1);
        let sowableCavitiesP2 = this.getSowableCavities(Player.Player2);

        if((sowableCavitiesP1.length == 0 && player == Player.Player1) || 
           (sowableCavitiesP2.length == 0 && player == Player.Player2)) {
               this.collectSeeds(sowableCavitiesP1, sowableCavitiesP2);
               const p1 = this.getPoints(Player.Player1), p2 = this.getPoints(Player.Player2);
               returnWinner(true, p1 == p2 ? null : (p1 > p2 ? Player.Player1 : Player.Player2));
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
                seed.element.remove();
                seed.calcDisplay();
                setTimeout( () => {
                    seed.genDisplay();
                    animationCounter -= 500;
                }, animationCounter);
                animationCounter += 500;
            }
        });
        this.updateScore();
    }

    updateScore() {
        if(this.isStorage() && this.player() == Player.Player1) {
            console.log(this.element);
            document.getElementById('p1-points').innerText = this.element.childElementCount;
        } else if (this.isStorage() && this.player() == Player.Player2) {
            console.log(this.element);
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
        const y = Math.random() * height*1.5 + yOffset;
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

async function getLeaderboard(container) {

    const ranking = POSTRequest({}, 'ranking');
    ranking.then(function (data) {
        if (data.error) return handleError(data);
        let header = `<tr>
                        <th>Username</th>
                        <th>Games</th>
                        <th>Victories</th>
                      </tr>`

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

            container.innerHTML += `<tr>
                                        <td>${player.nick}</td>
                                        <td>${player.games}</td>
                                        <td style="background-color:${style};">${player.victories}</td>
                                        </tr>`
        }
    })

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

        console.log(`${activeSession.nick} joined the game ${currentGame.gameCode}, which has ${gameStartForm.size} cavities, with ${gameStartForm.initial} cavities each.`);
    });
}

function returnWinner(isAI, winner) {
    preGameContainer.style.display = 'flex';
    preGameContainer.style += "flex-direction: column;"
    inGameContainer.style.display = 'none';

    const gameArea = document.getElementsByClassName('board-area')[0];
    clearInnerContent(gameArea);
    if (isAI) {
        if (winner == null) gameArea.innerHTML = "<h1>There was a tie!</h1>"
        else if (winner == activeSession.nick) gameArea.innerHTML = `<h1>You won! Congratulations${activeSession.nick ? ', ' + activeSession.nick : ''}!</h1>`
        else gameArea.innerHTML = `<h1>You lost! Bots are tough, aren't they?</h1>`
    } else {
        if (winner == null) gameArea.innerHTML = "<h1>There was a tie!</h1>"
        else if (winner == activeSession.nick) gameArea.innerHTML = `<h1>You won! Congratulations, ${winner}!</h1>`
        else gameArea.innerHTML = `<h1>You lost. ${winner} wins!</h1>`
    }

    currentGame = {};
    if(!isAI) stopUpdates();
    setTimeout(() => {
        endGame();
    }, 5000);
}

function setUpdateResponse(params) {
    getUpdates.onmessage = (event) => {
        console.log(event.data);

        let data = JSON.parse(event.data);

        if (!currentGame.board) startGame(params);
        if (data.winner || data.winner === null) return returnWinner(false, data.winner);

        currentGame.board.update(data.board, activeSession.nick);

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
    preGameContainer.style.display = 'flex';
    preGameContainer.style += "flex-direction: column;"
    inGameContainer.style.display = 'none';

    const gameArea = document.getElementsByClassName('board-area')[0];
    clearInnerContent(gameArea);
    gameArea.innerHTML = "<h1>Waiting for another player to join...</h1>"
}

function startGame(params) {
    preGameContainer.style.display = 'none';
    inGameContainer.style.display = 'flex';

    const gameArea = document.getElementsByClassName('board-area')[0];
    clearInnerContent(gameArea);
    console.log(`New Board with: ${params.size} cavities per side and ${params.initial} seeds per cavity.`)
    currentGame.board = new Board(gameArea, parseInt(params.size), parseInt(params.initial), params.AILevel);

    currentGame.board.genDisplay();
}

async function leave(gameLeaveErrorMessage) {

    if (!activeSession.valid) return handleError({
        error: 'You should be logged in - please reload the page.'
    }, gameLeaveErrorMessage);
    console.log("left the game");

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

        console.log("left the game");

        endGame();
    });
}

function stopUpdates() {
    console.log("closed");
    getUpdates.close();
}

function endGame() {
    console.log("game end");

    preGameContainer.style.display = 'flex';
    preGameContainer.style += "flex-direction: column;"
    inGameContainer.style.display = 'none';

    const gameArea = document.getElementsByClassName('board-area')[0];
    clearInnerContent(gameArea);
    gameArea.innerHTML = "<h1>No game is currently being played.</h1>"

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