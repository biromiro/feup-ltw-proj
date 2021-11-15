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
