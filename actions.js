import * as req from './requests.js';
import * as aux from './auxiliar.js';
import * as game from './game.js'

let activeSession = {
    'valid' : false,
    'nick' : "",
    'password' : ""
}

let currentGame = {
    gameCode: '',
    groupCode: 0,
    board: undefined,
    adversary: undefined
}

let messages = document.getElementById('messages');
let getUpdates = undefined;

let playerName = document.getElementById('p1-name');
let adversaryName = document.getElementById('p2-name');

export function handleError(data, container) {
    console.log(container);
    if(!container) return;
    container.innerText = data.error;

    container.getAnimations().forEach((anim) => {
        anim.cancel();
        anim.play();
      });
}

export function newMessage(data) {
    let tag = document.createElement("p");
    let text = data.error ? data.error : data.message;

    if(data.error) {
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

export function changeNicknames(adversary) {
    playerName.innerText = activeSession.nick ? activeSession.nick : 'Player';
    adversaryName.innerText = adversary ? adversary : 'Computer';
}

export async function getLeaderboard(container) {

    const ranking = req.POSTRequest({}, 'ranking');
    ranking.then(function(data) {
        if(data.error) return act.handleError(data);
        let header = `<tr>
                        <th>Username</th>
                        <th>Games</th>
                        <th>Victories</th>
                      </tr>`

        container.innerHTML = header;

        let ranking = data.ranking;

        for (let [index, player] of ranking.entries()) {

            let style = "";

            switch(index) {
                case 0: style = "gold"; break;
                case 1: style = "silver"; break;
                case 2: style = "#CD7F32";
            }

            container.innerHTML += `<tr>
                                        <td>${player.nick}</td>
                                        <td>${player.games}</td>
                                        <td style="background-color:${style};">${player.victories}</td>
                                        </tr>`
        }
    })
    
}

let signinContainer = document.getElementById('signin');
let profileContainer = document.getElementById('profile');
let nicknameContainer = document.getElementById('profile-nickname');

export async function login(loginForm, loginErrorMessage) {
    let params = {
        'nick' : loginForm['username-login'].value,
        'password' : loginForm['password-login'].value
    }
    const login = req.POSTRequest(params, 'register');
    login.then(function(data) {
        if(data.error) return handleError(data, loginErrorMessage);
        activeSession.valid = true;
        activeSession.nick = params.nick;
        activeSession.password = params.password;

        signinContainer.style.display = "none";
        profileContainer.style.display = "flex";

        nicknameContainer.innerText = activeSession.nick;
    });
    
}

export async function register(signupForm, signupErrorMessage) {
    let params = {
        'nick' : signupForm['username-signup'].value,
        'password' : signupForm['password-signup'].value
    }
    const signup = req.POSTRequest(params, 'register');
    signup.then(function(data) {
        if(data.error) return handleError(data, signupErrorMessage);

        activeSession.valid = true;
        activeSession.nick = params.nick;
        activeSession.password = params.password;

        signinContainer.style.display = "none";
        profileContainer.style.display = "flex";

        nicknameContainer.innerText = activeSession.nick;
    });
    
}

export function logout() {
    activeSession.valid = false;
    activeSession.nick = "";
    activeSession.password = "";

    signinContainer.style.display = "flex";
    profileContainer.style.display = "none";
}

let preGameContainer = document.getElementById('pre-game-configs');
let inGameContainer = document.getElementById('in-game-summary');

export async function join(gameStartForm, gameStartErrorMessage) {

    if(!activeSession.valid) return handleError({error: 'Please login first.'}, gameStartErrorMessage);

    let params = {
        'nick' : activeSession.nick,
        'password' : activeSession.password,
        'size': gameStartForm.size,
        'initial': gameStartForm.initial
    }
    const groupCode = gameStartForm.group;
    if(groupCode) params['group'] = groupCode;

    const join = req.POSTRequest(params, 'join');
    join.then(function(data) {
        if(data.error) return handleError(data, gameStartErrorMessage);
        currentGame.gameCode = data.game;
        currentGame.groupCode = groupCode;
        
        getUpdates = req.setServerSentUpdates(activeSession.nick, currentGame.gameCode);
        setUpdateResponse(params);

        waiting();

        console.log(`${activeSession.nick} joined the game ${currentGame.gameCode}, which has ${gameStartForm.size} cavities, with ${gameStartForm.initial} cavities each.`);
    });
}

export function returnWinner(isAI, winner) {
    preGameContainer.style.display = 'flex';
    preGameContainer.style += "flex-direction: column;"
    inGameContainer.style.display = 'none';

    const gameArea = document.getElementsByClassName('board-area')[0];
    aux.clearInnerContent(gameArea);
    if (isAI) {
        if(winner) gameArea.innerHTML = `<h1>You won! Congratulations${activeSession.nick ? ', ' + activeSession.nick : ''}!</h1>`
        else gameArea.innerHTML = `<h1>You lost! Bots are tough, aren't they?</h1>`
    } else {
        if(winner == null) gameArea.innerHTML = "<h1>There was a tie!</h1>"
        else if(winner == activeSession.nick) gameArea.innerHTML = `<h1>You won! Congratulations, ${winner}!</h1>`
        else gameArea.innerHTML = `<h1>You lost. ${winner} wins!</h1>`
    }

    currentGame = {};
    stopUpdates();
    setTimeout( () => {endGame();}, 5000);
}

function setUpdateResponse(params) {
    getUpdates.onmessage = (event) => {
        console.log(event.data);

        let data = JSON.parse(event.data);

        if(!currentGame.board) startGame(params);
        if(data.winner) return returnWinner(false, data.winner);

        currentGame.board.update(data.board, activeSession.nick);

        if(!currentGame.adversary) {
            Object.keys(data.board.sides).forEach((key) => {
                if(key != activeSession.nick)
                    currentGame.adversary = key;
            });

            changeNicknames(currentGame.adversary);
        }
    }

    getUpdates.onerror = (error) => {
        console.log(error);
    }
}


export function waiting() {
    preGameContainer.style.display = 'flex';
    preGameContainer.style += "flex-direction: column;"
    inGameContainer.style.display = 'none';

    const gameArea = document.getElementsByClassName('board-area')[0];
    aux.clearInnerContent(gameArea);
    gameArea.innerHTML = "<h1>Waiting for another player to join...</h1>"
}

export function startGame(params) {
    preGameContainer.style.display = 'none';
    inGameContainer.style.display = 'flex';

    const gameArea = document.getElementsByClassName('board-area')[0];
    aux.clearInnerContent(gameArea);
    console.log(`New Board with: ${params.size} cavities per side and ${params.initial} seeds per cavity.`)
    currentGame.board = new game.Board(gameArea, parseInt(params.size), parseInt(params.initial), params.AILevel);

    currentGame.board.genDisplay();
}

export async function leave(gameLeaveErrorMessage) {

    if(!activeSession.valid) return handleError({error: 'You should be logged in - please reload the page.'}, gameLeaveErrorMessage);
    console.log("left the game");

    let params = {
        'nick' : activeSession.nick,
        'password' : activeSession.password,
        'game': currentGame.gameCode,
        'group': currentGame.groupCode
    }

    const join = req.POSTRequest(params, 'leave');
    join.then(function(data) {
        if(data.error) return handleError(data, gameLeaveErrorMessage);
        
        currentGame = {};

        console.log("left the game");

        endGame();
    });
}

function stopUpdates() {
    console.log("closed");
    getUpdates.close();
}

export function endGame() {
    console.log("game end");

    preGameContainer.style.display = 'flex';
    preGameContainer.style += "flex-direction: column;"
    inGameContainer.style.display = 'none';

    const gameArea = document.getElementsByClassName('board-area')[0];
    aux.clearInnerContent(gameArea);
    gameArea.innerHTML = "<h1>No game is currently being played.</h1>"

    aux.clearInnerContent(messages);
}

export async function notify(cavityNumber) {
    if(!activeSession.valid) return handleError({error: 'You should be logged in - please reload the page.'}, gameLeaveErrorMessage);

    let params = {
        'nick' : activeSession.nick,
        'password' : activeSession.password,
        'game': currentGame.gameCode,
        'move': cavityNumber
    }

    const notify = req.POSTRequest(params, 'notify');
    notify.then(function(data) {
        if(data.error) return newMessage(data);
    });
}