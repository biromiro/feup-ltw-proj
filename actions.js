let activeSession = {
    'valid' : false,
    'nick' : "",
    'password' : ""
}

export function handleError(data, container) {
    if(!container) return;

    container.innerText = data.error;

    container.getAnimations().forEach((anim) => {
        anim.cancel();
        anim.play();
      });
}

export function getLeaderboard(data, container) {
    let header = `<tr>
                        <th>Username</th>
                        <th>Games</th>
                        <th>Victories</th>
                      </tr>`

    container.innerHTML = header;

    console.log(data);

    let ranking = data.ranking;

    for (let [index, player] of ranking.entries()) {

        let style = "";

        switch(index) {
            case 0: style = "gold"; break;
            case 1: style = "silver"; break;
            case 2: style = "#CD7F32";
        }

        container.innerHTML += `<tr>
                                    <td>${player.nick}</td>
                                    <td>${player.games}</td>
                                    <td style="background-color:${style};">${player.victories}</td>
                                    </tr>`
    }
}

let signinContainer = document.getElementById('signin');
let profileContainer = document.getElementById('profile');

export function login(params) {
    activeSession.valid = true;
    activeSession.nick = params.nick;
    activeSession.password = params.password;

    signinContainer.style.display = "none";
    profileContainer.style.display = "flex";
}

export function logout() {
    activeSession.valid = false;
    activeSession.nick = "";
    activeSession.password = "";

    signinContainer.style.display = "flex";
    profileContainer.style.display = "none";
}