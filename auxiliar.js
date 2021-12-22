export function clearInnerContent(element) {
    while(element.firstChild) {
        element.removeChild(element.firstChild);
    }
}