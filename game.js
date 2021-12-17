const Player = {
    Player1 : 'Player1',
    Player2 : 'Player2',
}

const TurnOutcome = {
    InvalidSourceCavity: 'InvalidSourceCavity',
}

const SowOutcome = {
    PlayAgain: 'PlayAgain',
    TakeSeeds: 'TakeSeeds',
    InvalidSourceCavity: 'InvalidSourceCavity',
    EmptySourceCavity: 'EmptySourceCavity',
};

class Board
{
    constructor(body, nCavities, nSeeds)
    {
        this.body = body;

        this.cavities = [];

        this.cavities.push(new Cavity(this, 0, 'c-big c-left'));

        this.nCavities = nCavities;

        for (let i = 0; i < this.nCavities; i++)
            this.cavities.push(new Cavity(this, nSeeds));

        this.cavities.push(new Cavity(this, 0, 'c-big c-right'));

        for (let i = 0; i < this.nCavities; i++)
            this.cavities.push(new Cavity(this, nSeeds));
    }

    genDisplay()
    {
        this.element = document.createElement('div');
        this.element.className = 'board';
        this.body.appendChild(this.element);

        const root = document.querySelector(':root');
        root.style.setProperty('--nCavities', this.nCavities);

        this.cavities.forEach(cavity => {
            cavity.genDisplay();
        });
    }

    updateDisplay()
    {
        this.cavities.forEach(cavity => {
            cavity.updateDisplay();
        });
    }

    take(n, from, to)
    {
        for (let i = 0; i < n; i++)
        {
            let movedSeed = from.seeds.pop();
            movedSeed.cavity = to;
            to.seeds.push(movedSeed);
        }
    }

    sow(cavityIdx)
    {
        let sourceCavity = this.cavities[cavityIdx];

        //mustn't sow from storage cavities
        if (sourceCavity.isStorage())
        {
            alert('oopsie!');
            return {outcome : SowOutcome.InvalidSourceCavity};
        }

        //mustn't sow from empty cavities
        if (sourceCavity.empty())
        {
            alert('oopsie daisy!');
            return {outcome : SowOutcome.EmptySourceCavity};
        }

        const sowableCavities = [...this.cavities];

        for (let i = 0; i < sowableCavities.length; i++) {
            const cavity = sowableCavities[i];
            //mustn't sow on the adversary's storage cavity
            if(cavity.isStorage() && cavity.player() != sourceCavity.player()) {
                sowableCavities.pop(cavity);
                break;
            }
        }

        //sow
        let targetCavity;
        let targetCavityIdx = cavityIdx;

        while (sourceCavity.seeds.length)
        {
            targetCavityIdx = (targetCavityIdx + 1) % sowableCavities.length;
            targetCavity = sowableCavities[targetCavityIdx];
            this.take(1, sourceCavity, targetCavity);
        }

        if (targetCavity.player() == sourceCavity.player() && targetCavity.isStorage())
            return {outcome : SowOutcome.PlayAgain};
        
        if (targetCavity.player() == sourceCavity.player() && targetCavity.empty())
            return {outcome : SowOutcome.TakeSeeds, cavity : cavityIdx};
    }

    turn(player, cavityIdx)
    {
        const sourceCavity = this.cavities[cavityIdx];
        
        if (sourceCavity.player() != player)
            return TurnOutcome.InvalidSourceCavity;
        
        const result = this.sow(cavityIdx);

        if (result.outcome == SowOutcome.PlayAgain)
            return result.outcome;
        
        if(result.outcome == SowOutcome.TakeSeeds)
        {
            let toTake = this.cavities[this.cavities.length - cavityIdx];
            this.take(toTake.seeds.length, toTake) //finish
        }
    }
}

class Cavity
{
    genDisplay()
    {
        this.element = document.createElement('div');
        this.element.className = this.specifier ? 'cavity ' + this.specifier : 'cavity';
        this.board.element.appendChild(this.element);

        this.seeds.forEach(seed => {
            seed.genDisplay();
        });
    }

    updateDisplay()
    {
        this.deleteChildren();

        this.seeds.forEach(cavity => {
            cavity.genDisplay();
        });
    }

    player()
    {
        const idx = this.board.cavities.indexOf(this);
        return idx < this.board.nCavities + 1 ? Player.Player1 : Player.Player2;
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

    constructor(board, nSeeds, specifier)
    {
        this.board = board;

        this.specifier = specifier;

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
    genDisplay()
    {
        const width = this.cavity.element.offsetWidth;
        const height = this.cavity.element.offsetHeight;

        const proportionsElement = this.cavity.board.element.querySelector('.cavity:not(.c-big)');
        const xProportion = proportionsElement.offsetWidth;
        const yProportion = proportionsElement.offsetHeight;
        
        const xOffset = width / 8;
        const yOffset = height / 8;
        const x = Math.random() * width*1.5 + xOffset;
        const y = Math.random() * height*1.5 + yOffset;
        const degs = Math.random() * 360;
        const scaleX = 0.005 * xProportion;
        const scaleY = 0.006 * yProportion;

        this.element = document.createElement('div');
        this.element.className = 'seed';
        this.element.style.transform = `translate(${x}%, ${y}%) rotate(${degs}deg) scaleY(${scaleY}) scaleX(${scaleX})`;
        this.cavity.element.appendChild(this.element);
    }

    constructor(cavity)
    {
        this.cavity = cavity;
    }
}

const gameArea = document.getElementsByClassName('board-area')[0];
const board = new Board(gameArea, 6, 2);
board.genDisplay();