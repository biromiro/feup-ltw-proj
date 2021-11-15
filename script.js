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
const ldb = document.getElementsByClassName('ldb')[0]

ldbButton.addEventListener('click', () => {
    ldbContainer.classList.toggle('active')
    ldb.classList.toggle('active')
});

closeLdb.addEventListener('click', () => {
    ldbContainer.classList.toggle('active')
    ldb.classList.toggle('active')
});


backgroundLdb.addEventListener('click', () => {
    ldbContainer.classList.toggle('active')
    ldb.classList.toggle('active')
});