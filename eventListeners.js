import * as req from './requests.js';
import * as aux from './auxiliar.js';

const toggleButton = document.getElementsByClassName('toggle-button')[0]
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
    const ranking = req.POSTRequest({}, 'ranking');
    ranking.then(function(data) {

        let header = `<tr>
                        <th>Username</th>
                        <th>Games</th>
                        <th>Victories</th>
                      </tr>`

        ldbContent.innerHTML = header;

        let ranking = data.ranking;

        for (let [index, player] of ranking.entries()) {

            let style = "";

            switch(index) {
                case 0: style = "gold"; break;
                case 1: style = "silver"; break;
                case 2: style = "#CD7F32";
            }

            ldbContent.innerHTML += `<tr>
                                        <td>${player.nick}</td>
                                        <td>${player.games}</td>
                                        <td style="background-color:${style};">${player.victories}</td>
                                     </tr>`
        }

        console.log(data);

        ldbContainer.classList.toggle('active')
        ldb.classList.toggle('active')
    })
    
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