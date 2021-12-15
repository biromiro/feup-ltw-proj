class Board
{
    constructor(body, nCavities, nSeeds)
    {
        this.body = body

        this.element = document.createElement('div')
        this.element.className = 'board'
        this.body.appendChild(this.element)

        this.cavities = []

        this.cavities.push(new Cavity(this, 0, 'c-big c-left'))

        const root = document.querySelector(':root')
        root.style.setProperty('--nCavities', nCavities)

        for (let i = 0; i < nCavities; i++)
            this.cavities.push(new Cavity(this, nSeeds))

        this.cavities.push(new Cavity(this, 0,'c-big c-right'))

        for (let i = 0; i < nCavities; i++)
            this.cavities.push(new Cavity(this, nSeeds))
    }
}

class Cavity
{
    constructor(board, nSeeds, specifier)
    {
        this.board = board

        this.element = document.createElement('div')
        this.element.className = specifier ? 'cavity ' + specifier : 'cavity'
        this.board.element.appendChild(this.element)

        this.seeds = []

        for (let i = 0; i < nSeeds; i++)
        {
            let seed = new Seed(this)
            this.seeds.push(seed)
        }
    }
}

class Seed
{
    constructor(cavity)
    {
        this.cavity = cavity

        const width = this.cavity.element.offsetWidth
        const height = this.cavity.element.offsetHeight
        
        console.log(width)
        console.log(height)
        const xOffset = width / 8
        const yOffset = height / 8
        const x = Math.random() * width*1.5 + xOffset
        const y = Math.random() * height*1.5 + yOffset
        const degs = Math.random() * 360
        const scaleX = 0.005 * width 
        const scaleY = 0.006 * height

        this.element = document.createElement('div')
        this.element.className = 'seed'
        this.element.style.transform = `translate(${x}%, ${y}%) rotate(${degs}deg) scaleY(${scaleY}) scaleX(${scaleX})`
        this.cavity.element.appendChild(this.element)
    }
}

const body = document.getElementsByTagName('body')[0]
const board = new Board(body, 6, 2)