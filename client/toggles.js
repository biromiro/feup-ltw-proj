let computer = document.getElementById('computer-check');
let person = document.getElementById('person-check');

let isAI = false, isPvP = false;

function turnHandler() {
    let gameCode = document.getElementById('game-code');
    let AILevel = document.getElementById('ai-level');
    if(computer.checked) {
        gameCode.style.display = "none";
        AILevel.style.display = "block";
        isAI = true;
        isPvP = false;
    } else if(person.checked){
        gameCode.style.display = "block";
        AILevel.style.display = "none";
        isAI = false;
        isPvP = true;
    }
}

document.querySelectorAll("input[name='game-type']").forEach((input) => {
    input.addEventListener('change', turnHandler);
});

function isAIGameType() {
    return isAI;
}

function isPVPGameType() {
    return isPvP;
}
