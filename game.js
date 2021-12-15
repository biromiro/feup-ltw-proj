class Board
{
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
        
        const xOffset = width / 8;
        const yOffset = height / 8;
        const x = Math.random() * width*1.5 + xOffset;
        const y = Math.random() * height*1.5 + yOffset;
        const degs = Math.random() * 360;
        const scaleX = 0.005 * width;
        const scaleY = 0.006 * height;

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