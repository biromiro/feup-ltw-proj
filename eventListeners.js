import * as req from './requests.js';
import * as act from './actions.js';
import * as tog from './toggles.js';

const toggleButton = document.getElementById('toggle-button')
const navbarLinks = document.getElementsByClassName('navbar-links')[0]

toggleButton.addEventListener('click', () => {
    navbarLinks.classList.toggle('active');
});

const rulesButton = document.getElementsByClassName('rules-button')[0]
const backgroundRules = document.getElementsByClassName('background-rules')[0]
const closeRules = document.getElementsByClassName('close-rules')[0]
const rulesContainer = document.getElementsByClassName('rules-container')[0]
const rules = document.getElementsByClassName('rules')[0]

rulesButton.addEventListener('click', () => {
    rulesContainer.classList.toggle('active')
    rules.classList.toggle('active')
});

closeRules.addEventListener('click', () => {
    rulesContainer.classList.toggle('active')
    rules.classList.toggle('active')
});


backgroundRules.addEventListener('click', () => {
    rulesContainer.classList.toggle('active')
    rules.classList.toggle('active');
});

const ldbButton = document.getElementsByClassName('ldb-button')[0]
const backgroundLdb = document.getElementsByClassName('background-ldb')[0]
const closeLdb = document.getElementsByClassName('close-ldb')[0]
const ldbContainer = document.getElementsByClassName('ldb-container')[0]
const ldbContent = document.getElementsByClassName('ldb-content')[0]
const ldb = document.getElementsByClassName('ldb')[0]

ldbButton.addEventListener('click', () => {

    act.getLeaderboard(ldbContent).then(() => {
        ldbContainer.classList.toggle('active')
        ldb.classList.toggle('active')
    });
});


closeLdb.addEventListener('click', () => {
    ldbContainer.classList.toggle('active')
    ldb.classList.toggle('active')
});


backgroundLdb.addEventListener('click', () => {
    ldbContainer.classList.toggle('active')
    ldb.classList.toggle('active')
});

const signinButton = document.getElementsByClassName('signin-button')[0]
const backgroundSignin = document.getElementsByClassName('background-signin')[0]
const closeSignin = document.getElementsByClassName('close-signin')[0]
const signinContainer = document.getElementsByClassName('signin-container')[0]
const signin = document.getElementsByClassName('signin')[0]

signinButton.addEventListener('click', () => {
    signinContainer.classList.toggle('active')
    signin.classList.toggle('active')
});

closeSignin.addEventListener('click', () => {
    signinContainer.classList.toggle('active')
    signin.classList.toggle('active')
});


backgroundSignin.addEventListener('click', () => {
    signinContainer.classList.toggle('active')
    signin.classList.toggle('active')
});

const loginForm = document.getElementById('login-form');
const loginErrorMessage = document.getElementById('wrong-password-login');

loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    act.login(loginForm, loginErrorMessage).then(() => {
        loginForm.reset();
    });
});

const signupForm = document.getElementById('signup-form');
const signupErrorMessage = document.getElementById('wrong-password-signup');

signupForm.addEventListener('submit', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    act.register(signupForm, signupErrorMessage).then(() => {
        signupForm.reset();
    });
});

const logoutButton = document.getElementById('logout-button');

logoutButton.addEventListener('click', () => {
    act.logout();
});

const gameStartForm = document.getElementById('game-start-form');
const gameStartErrorMessage = document.getElementById('wrong-form-params');

gameStartForm.addEventListener('submit', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    if(tog.isAIGameType()) console.log("computer game undefined");
    else if(tog.isPVPGameType()) {
        act.join(gameStartForm, gameStartErrorMessage).then(() => {
            gameStartForm.reset();
        });
    } else act.handleError({'error': 'Game Type is still not defined.'}, gameStartErrorMessage);
});

const gameLeaveButton = document.getElementById('game-leave-button');
const gameLeaveErrorMessage = document.getElementById('wrong-form-params-summary');

gameLeaveButton.addEventListener('click', () => {
    act.leave(gameLeaveErrorMessage);
});