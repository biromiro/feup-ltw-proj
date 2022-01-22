let computer = document.getElementById('computer-check');
let person = document.getElementById('person-check');
let playerTurn = document.getElementById('you-turn');
let computerTurn = document.getElementById('adversary-turn');

let isAI = false, isPvP = false;
let isPlayersTurn = true;

function gameHandler() {
    let gameCode = document.getElementById('game-code');
    let AILevel = document.getElementById('ai-level');
    let turn = document.getElementById('game-bot-turn');
    if(computer.checked) {
        gameCode.style.display = "none";
        AILevel.style.display = "block";
        turn.style.display = "block";
        isAI = true;
        isPvP = false;
    } else if(person.checked){
        gameCode.style.display = "block";
        AILevel.style.display = "none";
        turn.style.display = "none";
        isAI = false;
        isPvP = true;
    }
}

document.querySelectorAll("input[name='game-type']").forEach((input) => {
    input.addEventListener('change', gameHandler);
});

document.querySelectorAll("input[name='game-turn']").forEach((input) => {
    input.addEventListener('change', () => { playerTurn.checked ? isPlayersTurn = true : isPlayersTurn = false });
});

function isAIGameType() {
    return isAI;
}

function isPVPGameType() {
    return isPvP;
}

function isPlayerTurn() {
    return isPlayersTurn;
}
