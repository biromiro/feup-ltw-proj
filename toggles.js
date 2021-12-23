let computer = document.getElementById('computer-check');
let person = document.getElementById('person-check');

function turnHandler() {
    let gameCode = document.getElementById('game-code');
    let AILevel = document.getElementById('ai-level');
    if(computer.checked) {
        gameCode.style.display = "none";
        AILevel.style.display = "block";
    } else if(person.checked){
        gameCode.style.display = "block";
        AILevel.style.display = "none";
    }
}

document.querySelectorAll("input[name='game-type']").forEach((input) => {
    input.addEventListener('change', turnHandler);
});

export function isAIGameType() {
    return computer.checked;
}

export function isPVPGameType() {
    return person.checked;
}
