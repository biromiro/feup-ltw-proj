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

    sow(cavityIdx)
    {
        let sourceCavity = this.cavities[cavityIdx];

        if(sourceCavity.specifier)
        {
            alert('oopsie!');
            return;
        }

        if(!sourceCavity.seeds.length)
        {
            alert('oopsie daisy!');
            return;
        }

        const sowableCavities = [...this.cavities];

        for (let i = 0; i < sowableCavities.length; i++) {
            const cavity = sowableCavities[i];
            if(cavity.specifier && cavity.player() != sourceCavity.player()) {
                sowableCavities.pop(cavity);
                break;
            }
        }

        for (const [i, seed] of sourceCavity.seeds.entries())
        {
            const targetCavity = sowableCavities[cavityIdx + i + 1];

            seed.cavity = targetCavity;
            
            targetCavity.seeds.push(seed);
        }

        sourceCavity.seeds = [];
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
        return idx < this.board.nCavities + 1 ? 1 : 2;
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

const body = document.getElementsByTagName('body')[0];
const board = new Board(body, 6, 2);
board.genDisplay();