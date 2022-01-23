let audio = new Audio('./audio/background.mp3');

function clearInnerContent(element) {
    while(element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

function sleep(t) {
    const start = Date.now();
    while (Date.now() - start < t);
}

function playBackgroundMusic() {
    if (typeof audio.loop == 'boolean'){
        audio.loop = true;
    } else {
        audio.addEventListener('ended', function() {
            this.currentTime = 0;
            this.play();
        }, false);
    }
    audio.play();
}

function stopBackgroundMusic() {
    audio.pause();
}