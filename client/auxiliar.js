function clearInnerContent(element) {
    while(element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

function sleep(t) {
    const start = Date.now();
    while (Date.now() - start < t);
}
  