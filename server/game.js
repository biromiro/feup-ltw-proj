const Player = {
    Player1 : 'Player1',
    Player2 : 'Player2',
}

const SowOutcome = {
    InvalidSourceCavity: 'InvalidSourceCavity',
    EmptySourceCavity: 'EmptySourceCavity',
    PlayAgain: 'PlayAgain',
};

function range(start, end) {
    return Array(end - start + 1).fill().map((_, idx) => start + idx)
}

class Board
{
    constructor(nCavities, nSeeds)
    {
        this.cavities = [];
        
        this.nCavities = nCavities;

        for (let i = 0; i < this.nCavities; i++)
            this.cavities.push(new Cavity(this, nSeeds));
        
        this.cavities.push(new Cavity(this, 0));
        
        for (let i = 0; i < this.nCavities; i++)
            this.cavities.push(new Cavity(this, nSeeds));

        this.cavities.push(new Cavity(this, 0));

        this.cavitiesIndices = [];
        let invertedIndices = range(nCavities + 2, nCavities * 2 + 1);
        this.cavitiesIndices = this.cavitiesIndices.concat(invertedIndices.reverse());
        this.cavitiesIndices.push(nCavities + 1);
        this.cavitiesIndices.push(0);
        this.cavitiesIndices = this.cavitiesIndices.concat(range(1, nCavities));
    }

    constructor(board) {

        this.cavities = [];
        
        this.nCavities = nCavities;
        
        for (let i = 0; i < this.nCavities; i++)
            this.cavities.push(new Cavity(this, nSeeds));
        
        this.cavities.push(new Cavity(this, 0));
        
        for (let i = 0; i < this.nCavities; i++)
            this.cavities.push(new Cavity(this, nSeeds));

        this.cavities.push(new Cavity(this, 0));
    }

    getPoints(player)
    {
        let storageIdx = player == Player.Player1 ? this.nCavities : 2 * this.nCavities + 1;
        return this.cavities[storageIdx].seeds.length;
    }

    getSowableCavities(player)
    {
        let sowableCavities = [];

        this.cavities.forEach(cavity => {
            if (cavity.sowable(player))
                sowableCavities.push(cavity);
        })

        return sowableCavities;
    }

    move(n, from, to)
    {
        for (let i = 0; i < n; i++)
        {
            let movedSeed = from.seeds.pop();
            movedSeed.cavity = to;
            to.seeds.push(movedSeed);

            movedSeed.wasChanged = true;
        }
    }

    take(n, cavity) {
        let arr = [];
        for (let i = 0; i < n; i++)
            arr.push(cavity.seeds.pop());
        return arr;
    }

    put(n, seeds, cavity) {
        for (let i = 0; i < n; i++)
        {
            cavity.seeds.push(seeds[i]);
            seeds[i].cavity = cavity;
            seeds[i].wasChanged = true;
        }
        seeds.splice(0, n);
    }

    sow(sourceCavity, player)
    {
        //mustn't sow from enemy cavitites
        if (sourceCavity.player() != player)
        {
            return SowOutcome.InvalidSourceCavity;
        }

        //mustn't sow from storage cavities
        if (sourceCavity.isStorage())
        {
            return SowOutcome.InvalidSourceCavity;
        }

        //mustn't sow from empty cavities
        if (sourceCavity.empty())
        {
            return SowOutcome.EmptySourceCavity;
        }

        const targetCavities = [...this.cavities];

        for (let i = 0; i < targetCavities.length; i++) {
            const cavity = targetCavities[i];
            //mustn't sow on the adversary's storage cavity
            if(cavity.isStorage() && cavity.player() != sourceCavity.player()) {
                targetCavities.splice(i, 1);
                break;
            }
        }
        //sow
        let targetCavity;
        let targetCavityIdx = targetCavities.indexOf(sourceCavity);

        while (sourceCavity.seeds.length)
        {
            targetCavityIdx = (targetCavityIdx + 1) % targetCavities.length;
            targetCavity = targetCavities[targetCavityIdx];
            this.move(1, sourceCavity, targetCavity);
        }

        if (targetCavity.player() == sourceCavity.player() && targetCavity.isStorage())
            return SowOutcome.PlayAgain;
        
        if (targetCavity.player() == sourceCavity.player() && targetCavity.seeds.length == 1)
        {
            const storageIdx = player == Player.Player1 ? this.nCavities : 2 * this.nCavities + 1;
            let storage = this.cavities[storageIdx];

            this.move(1, targetCavity, storage);

            const cavityIdx = this.cavities.indexOf(targetCavity);
            let toMove = this.cavities[this.nCavities*2 - cavityIdx];
            this.move(toMove.seeds.length, toMove, storage);
        }
    }

    turn(sourceCavity)
    {
        let result = this.sow(sourceCavity, Player.Player1);

        if (result == SowOutcome.EmptySourceCavity || result == SowOutcome.InvalidSourceCavity || result == SowOutcome.PlayAgain)
            return this.checkEndGame();
        
        alert('Other player is playing...');
    }

    checkEndGame(player) {
        let sowableCavitiesP1 = this.getSowableCavities(Player.Player1);
        let sowableCavitiesP2 = this.getSowableCavities(Player.Player2);

        if(sowableCavitiesP1.length == 0 || sowableCavitiesP2.length == 0) {
               this.collectSeeds(sowableCavitiesP1, sowableCavitiesP2);
               //act.returnWinner(true, player == Player.Player1);
               return true;
        }

        return false;
    }

    collectSeeds(sowableCavitiesP1, sowableCavitiesP2) {
        sowableCavitiesP1.forEach(cavity => {
            this.move(cavity.length, cavity, this.cavities.at(this.nCavities));
        });

        sowableCavitiesP2.forEach(cavity => {
            this.move(cavity.length, cavity, this.cavities.at(this.nCavities * 2 + 1));
        });
    }
}

class Cavity
{   
    player()
    {
        const idx = this.board.cavities.indexOf(this);
        return idx <= this.board.nCavities ? Player.Player1 : Player.Player2;
    }

    sowable(player)
    {
        return this.player() == player && !this.isStorage() && !this.empty();
    }

    isStorage()
    {
        return this.specifier != null;
    }

    empty()
    {
        return !this.seeds.length;
    }

    deleteChildren()
    {
        let child = this.element.lastElementChild; 
        
        while (child) {
            this.element.removeChild(child);
            child = this.element.lastElementChild;
        }
    }

    constructor(board, nSeeds)
    {
        this.board = board;

        this.seeds = [];

        for (let i = 0; i < nSeeds; i++)
        {
            let seed = new Seed(this);
            this.seeds.push(seed);
        }     
    }
}

class Seed
{
    constructor(cavity)
    {
        this.cavity = cavity;
    }
}

module.exports = {Board}