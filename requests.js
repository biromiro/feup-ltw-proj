
let serverURL = 'http://twserver.alunos.dcc.fc.up.pt:8008/'

export function POSTRequest(body, path) {
    let options = {
        method : 'POST',
        body : JSON.stringify( body )
    }
    
    return fetch(serverURL + path, options).then(response => { return response.json(); })
}

