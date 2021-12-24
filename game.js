const Player = {
    Player1 : 'Player1',
    Player2 : 'Player2',
}

const TurnOutcome = {
    InvalidSourceCavity: 'InvalidSourceCavity',
    SwapPlayer: 'SwapPlayer',
    SamePlayer: 'SamePlayer',
}

const SowOutcome = {
    PlayAgain: 'PlayAgain',
    TakeSeeds: 'TakeSeeds',
    InvalidSourceCavity: 'InvalidSourceCavity',
    EmptySourceCavity: 'EmptySourceCavity',
};

function range(start, end) {
    return Array(end - start + 1).fill().map((_, idx) => start + idx)
}

let curInd = 0;

class Board
{
    constructor(body, nCavities, nSeeds)
    {
        this.body = body;

        this.cavities = [];
        
        this.nCavities = nCavities;

        for (let i = 0; i < this.nCavities; i++)
            this.cavities.push(new Cavity(this, nSeeds));

        this.cavities.push(new Cavity(this, 0, 'c-big c-right'));
        
        for (let i = 0; i < this.nCavities; i++)
            this.cavities.push(new Cavity(this, nSeeds));

        this.cavities.push(new Cavity(this, 0, 'c-big c-left'));

        console.log(this.cavities);

        this.cavitiesIndices = [];
        let invertedIndices = range(nCavities + 2, nCavities * 2 + 1);
        this.cavitiesIndices = this.cavitiesIndices.concat(invertedIndices.reverse());
        this.cavitiesIndices.push(nCavities + 1);
        this.cavitiesIndices.push(0);
        this.cavitiesIndices = this.cavitiesIndices.concat(range(1, nCavities))


    }

    genDisplay()
    {
        this.element = document.createElement('div');
        this.element.className = 'board';
        this.body.appendChild(this.element);

        const root = document.querySelector(':root');
        root.style.setProperty('--nCavities', this.nCavities);
        
        console.log(this.cavitiesIndices);

        this.cavitiesIndices.forEach(index => {
            this.cavities[index].genDisplay();
            this.cavities[index].hookOnClick();
        });
    }

    updateDisplay()
    {
        this.cavities.forEach(cavity => {
            if(cavity.wasChanged)
            {
                cavity.updateDisplay();
                cavity.wasChanged = false;
            }
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

    sow(sourceCavity)
    {
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

        sourceCavity.wasChanged = true;

        const sowableCavities = [...this.cavities];

        for (let i = 0; i < sowableCavities.length; i++) {
            const cavity = sowableCavities[i];
            console.log(`On cavity ${cavity.index}: storage(${cavity.isStorage()}, player(${cavity.player()}))`)
            //mustn't sow on the adversary's storage cavity
            if(cavity.isStorage() && cavity.player() != sourceCavity.player()) {
                sowableCavities.splice(i, 1);
                break;
            }
        }

        console.log(sowableCavities);

        //sow
        let targetCavity;
        let targetCavityIdx = sowableCavities.indexOf(sourceCavity);

        while (sourceCavity.seeds.length)
        {
            targetCavityIdx = (targetCavityIdx + 1) % sowableCavities.length;
            targetCavity = sowableCavities[targetCavityIdx];
            this.take(1, sourceCavity, targetCavity);
            targetCavity.wasChanged = true;
        }

        if (targetCavity.player() == sourceCavity.player() && targetCavity.isStorage())
            return {outcome : SowOutcome.PlayAgain};
        
        if (targetCavity.player() == sourceCavity.player() && targetCavity.empty())
            return {outcome : SowOutcome.TakeSeeds, cavity : targetCavityIdx};
    }

    turn(player, sourceCavity)
    {
        if (sourceCavity.player() != player)
            return TurnOutcome.InvalidSourceCavity;
        
        const result = this.sow(sourceCavity);

        if (result == null)
            return TurnOutcome.SwapPlayer;

        if (result.outcome == SowOutcome.PlayAgain)
            return TurnOutcome.SamePlayer;
        
        if(result.outcome == SowOutcome.TakeSeeds)
        {
            const storageIdx = player == Player.Player1 ? 0 : this.nCavities + 1;
            let storage = this.cavities[storageIdx];

            this.take(1, result.cavity, storage);

            const cavityIdx = this.cavities.indexOf(result.cavity);
            let toTake = this.cavities[this.cavities.length - cavityIdx];
            this.take(toTake.seeds.length, toTake, storage);

            return TurnOutcome.SwapPlayer;
        }
    }
}

class Cavity
{   
    genDisplay()
    {
        this.element = document.createElement('div');
        this.element.className = this.specifier ? 'cavity ' + this.specifier : 'cavity';
        this.element.innerText = this.index;
        this.element.style = "color: white;"
        this.board.element.appendChild(this.element);

        this.seeds.forEach(seed => {
            seed.genDisplay();
        });

        this.wasChanged = false;
    }
    
    hookOnClick()
    {
        if (this.isStorage())
            return;

        this.element.addEventListener('click', function() {
            board.sow(this);
            board.updateDisplay();
        }.bind(this)); //needs fixin'
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
        return idx <= this.board.nCavities ? Player.Player1 : Player.Player2;
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

        this.index = curInd++;
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
        this.x = undefined;
        this.y = undefined;
        this.prevX = undefined;
        this.prevY = undefined;
    }
}

const gameArea = document.getElementsByClassName('board-area')[0];
const board = new Board(gameArea, 6, 2);
board.genDisplay();