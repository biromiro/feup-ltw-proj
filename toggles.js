let gameType = document.getElementById('game-type');
gameType.addEventListener('change', function() {
    let elements = Array.from(document.getElementsByName('game-option'));
    let gameCode = document.getElementById('game-code');
    let AILevel = document.getElementById('ai-level');
    if(elements[0].checked) {
        gameCode.style.display = "block";
        AILevel.style.display = "none";
    } else {
        gameCode.style.display = "none";
        AILevel.style.display = "block";
    }
});