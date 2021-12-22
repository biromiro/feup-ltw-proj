
let serverURL = 'http://twserver.alunos.dcc.fc.up.pt:8008/'

export function POSTRequest(body, path) {
    let options = {
        method : 'POST',
        body : JSON.stringify( body )
    }

    let request = new Request(serverURL + path, options);

    return fetch(request).then(response => { return response.json(); })
}

