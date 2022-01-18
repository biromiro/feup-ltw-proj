
let serverURL = 'http://localhost:8000/'

function POSTRequest(body, path) {
    let options = {
        method : 'POST',
        body : JSON.stringify( body )
    }

    let request = new Request(serverURL + path, options);

    return fetch(request).then(response => { return response.json(); }).catch((error) => {return {'error': error}; });
}

function setServerSentUpdates(nick, gameCode) {
    const getUpdate = new EventSource(serverURL + `update?nick=${nick}&game=${gameCode}`);

    return getUpdate;
}