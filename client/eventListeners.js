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
const ldb = document.getElementsByClassName('ldb')[0]
const swapLdb = document.getElementById('switch-ldb');
const localLdb = document.getElementById('local-leaderboard');
const serverLdb = document.getElementById('sv-leaderboard');

ldbButton.addEventListener('click', () => {

    getLeaderboard(localLdb, serverLdb).then(() => {
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

swapLdb.addEventListener('click', () => {

    console.log(localLdb.style.display, serverLdb.style.display);

    if(serverLdb.style.display === "") {
        localLdb.style.display = ""
        serverLdb.style.display = "none"
        swapLdb.innerHTML = "Show Server Leaderboard"
    } else {
        serverLdb.style.display = ""
        localLdb.style.display = "none"
        swapLdb.innerHTML = "Show Local Leaderboard"
    }
})

const signinButton = document.getElementsByClassName('signin-button')[0]
const backgroundSignin = document.getElementsByClassName('background-signin')[0]
const closeSignin = document.getElementsByClassName('close-signin')[0]
const signinContainer = document.getElementsByClassName('signin-container')[0]
const signin = document.getElementsByClassName('signin')[0]

signinButton.addEventListener('click', (e) => {
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
    login(loginForm, loginErrorMessage).then(() => {
        loginForm.reset();
    });
});

const logoutButton = document.getElementById('logout-button');

logoutButton.addEventListener('click', () => {
    logout();
});

const gameStartForm = document.getElementById('game-start-form');
const gameStartErrorMessage = document.getElementById('wrong-form-params');

gameStartForm.addEventListener('submit', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();

    let formParams = {
        'size': gameStartForm['num-cavities'].value,
        'initial': gameStartForm['num-init-seeds'].value,
        'group': gameStartForm['game-code-val'].value,
        'AILevel': gameStartForm['ai-level-val'].value
    }

    if (isAIGameType()) {
        startGame({ turn: isPlayerTurn(), ...formParams });
        changeNicknames();
    } else if (isPVPGameType()) {
        join(formParams, gameStartErrorMessage);
    } else handleError({
        'error': 'Game Type is still not defined.'
    }, gameStartErrorMessage);

    gameStartForm.reset();
});

const gameLeaveButton = document.getElementById('game-leave-button');
const gameLeaveErrorMessage = document.getElementById('wrong-form-params-summary');

gameLeaveButton.addEventListener('click', () => {
    if (isPVPGameType()) leave(gameLeaveErrorMessage);
    else if (isAIGameType()) endGame();
});

const errorMessages = [].slice.call(document.getElementsByClassName('error-message'));

errorMessages.forEach(message => {
    message.addEventListener('DOMSubtreeModified', () => {
        setTimeout(function () {
            clearInnerContent(message);
        }, 5000);
    });
});