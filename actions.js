import * as req from './requests.js';
import * as aux from './auxiliar.js';
import * as game from './game.js'

let activeSession = {
    'valid' : false,
    'nick' : "",
    'password' : ""
}

let currentGameCode = '';
let currentGroupCode = 0;
let currentBoard = undefined;
let messages = document.getElementById('messages');
let getUpdates = undefined;

export function handleError(data, container) {
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

    tag.innerText = text;

    messages.appendChild(tag);
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
        if(data.error) return act.handleError(data, loginErrorMessage);
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
        if(data.error) return act.handleError(data, signupErrorMessage);

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
        currentGameCode = data.game;
        currentGroupCode = groupCode;
        
        startGame(params);
        getUpdates = req.setServerSentUpdates(activeSession.nick, currentGameCode);
        setUpdateResponse();

        console.log(`${activeSession.nick} joined the game ${currentGameCode}, which has ${gameStartForm.size} cavities, with ${gameStartForm.initial} cavities each.`);
    });
}

function setUpdateResponse() {
    getUpdates.onmessage = (event) => {
        let data = JSON.parse(event.data);
        console.log(data.board);
        currentBoard.update(data.board, activeSession.nick);
    }

    getUpdates.onerror = (error) => {
        console.log(error);
    }
}

export function startGame(params) {
    preGameContainer.style.display = 'none';
    inGameContainer.style.display = 'flex';

    const gameArea = document.getElementsByClassName('board-area')[0];
    aux.clearInnerContent(gameArea);
    console.log(`New Board with: ${params.size} cavities per side and ${params.initial} seeds per cavity.`)
    currentBoard = new game.Board(gameArea, parseInt(params.size), parseInt(params.initial), params.AILevel);

    currentBoard.genDisplay();
}

export async function leave(gameLeaveErrorMessage) {

    if(!activeSession.valid) return handleError({error: 'You should be logged in - please reload the page.'}, gameLeaveErrorMessage);

    let params = {
        'nick' : activeSession.nick,
        'password' : activeSession.password,
        'game': currentGameCode,
        'group': currentGroupCode
    }

    const join = req.POSTRequest(params, 'leave');
    join.then(function(data) {
        if(data.error) return handleError(data, gameLeaveErrorMessage);

        currentGameCode = '';
        currentGroupCode = 0;

        console.log("left the game");

        endGame();
        stopUpdates();
    });
}

function stopUpdates() {
    getUpdates.close();
}

export function returnWinner(isAI, winner) {
    preGameContainer.style.display = 'flex';
    preGameContainer.style += "flex-direction: column;"
    inGameContainer.style.display = 'none';

    const gameArea = document.getElementsByClassName('board-area')[0];
    aux.clearInnerContent(gameArea);
    if (isAI) {
        if(winner == activeSession.nick) gameArea.innerHTML = `<h1>You won! Congratulations, ${winner}!</h1>`
        else gameArea.innerHTML = `<h1>You lost! Bots are tough, aren't they?</h1>`
    } else {
        if(winner == null) gameArea.innerHTML = "<h1>There was a tie!</h1>"
        else if(winner == activeSession.nick) gameArea.innerHTML = `<h1>You won! Congratulations, ${winner}!</h1>`
        else gameArea.innerHTML = `<h1>You lost. ${winner} wins!</h1>`
    }

}

export function endGame() {
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
        'game': currentGameCode,
        'move': cavityNumber
    }

    const notify = req.POSTRequest(params, 'notify');
    notify.then(function(data) {
        if(data.error) return newMessage(data);
    });
}