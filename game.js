import * as tog from './toggles.js';
import * as act from './actions.js';
import * as aux from './auxiliar.js';

let board = undefined;

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

export class Board
{
    constructor(body, nCavities, nSeeds, AILevel)
    {
        this.body = body;

        this.cavities = [];
        
        this.nCavities = nCavities;

        const depths = new Map();
        depths.set('very-easy', 0);
        depths.set('easy', 1);
        depths.set('medium', 2);
        depths.set('hard', 3);
        depths.set('very-hard', 4);
        depths.set('godlike', 5);
        
        if (AILevel != null && depths.has(AILevel))
        {
            this.AIDepth = depths.get(AILevel);
        }

        depths.clear();

        for (let i = 0; i < this.nCavities; i++)
            this.cavities.push(new Cavity(this, nSeeds));
        
        this.cavities.push(new Cavity(this, 0, 'c-big c-right'));
        
        for (let i = 0; i < this.nCavities; i++)
            this.cavities.push(new Cavity(this, nSeeds));

        this.cavities.push(new Cavity(this, 0, 'c-big c-left'));

        this.cavitiesIndices = [];
        let invertedIndices = range(nCavities + 2, nCavities * 2 + 1);
        this.cavitiesIndices = this.cavitiesIndices.concat(invertedIndices.reverse());
        this.cavitiesIndices.push(nCavities + 1);
        this.cavitiesIndices.push(0);
        this.cavitiesIndices = this.cavitiesIndices.concat(range(1, nCavities));
    }

    update(boardInfo, player) {
        let playerArr = [];
        let advArr = [];

        Object.entries(boardInfo.sides).forEach((entry) => {
            const [key, value] = entry;
            if(key == player) {
                playerArr = value.pits;
                playerArr.push(value.store);
            } else {
                advArr = value.pits;
                advArr.push(value.store);
            }
        });

        let seedVals = playerArr.concat(advArr);

        let movedSeeds = [];
        for(let i = 0; i < seedVals.length; i++) {
            let newSeedNum = seedVals.at(i);
            let cavity = this.cavities.at(i);
            if(newSeedNum < cavity.seeds.length)
                movedSeeds = movedSeeds.concat(this.take(cavity.seeds.length - newSeedNum, cavity));
        }

        for(let i=0; i < seedVals.length; i++) {
            let newSeedNum = seedVals.at(i);
            let cavity = this.cavities.at(i);
            if(newSeedNum > cavity.seeds.length)
                this.put(newSeedNum - cavity.seeds.length, movedSeeds, cavity);
        }

        if(boardInfo.turn == player) act.newMessage({message: `It's your turn.`})
        else act.newMessage({message: `It's ${boardInfo.turn} turn.`})

        this.updateDisplay();
    }

    fromBoard()
    {
        let newBoard = new Board(null, this.nCavities, 0);
        
        newBoard.cavities = [];
        this.cavities.forEach(cavity => {
            let cavityCopy = cavity.fromCavity(newBoard);
            newBoard.cavities.push(cavityCopy);
        });
        newBoard.nCavities = this.nCavities;
        newBoard.cavitiesIndices = [...this.cavitiesIndices];
        newBoard.AIDepth = this.AIDepth;

        return newBoard;
    }

    genDisplay()
    {
        this.element = document.createElement('div');
        this.element.className = 'board';
        this.body.appendChild(this.element);

        const root = document.querySelector(':root');
        root.style.setProperty('--nCavities', this.nCavities);
        
        this.cavitiesIndices.forEach(index => {
            this.cavities[index].genDisplay();
            this.cavities[index].hookOnClick();
        });

        board = this;
    }

    updateDisplay()
    {
        this.cavities.forEach(cavity => {
            cavity.updateDisplay();
        });
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

    getAIBestOutcome(player)
    {
        let sowableCavities = this.getSowableCavities(player);

        if(sowableCavities.length == 0) //no options base case
            return {p1: this.getPoints(Player.Player1), p2: this.getPoints(Player.Player2)};
        
        let outcomes = [];
        sowableCavities.forEach(sourceCavity => {
            let simBoard = this.fromBoard(); //generate a board
            let cavityIdx = this.cavities.indexOf(sourceCavity);
            let sourceCavitySim = simBoard.cavities.at(cavityIdx);
            let playAgain = simBoard.sow(sourceCavitySim, player); //simulate sowing
            let bestLocalOutcome = {cavity: cavityIdx, p1: simBoard.getPoints(Player.Player1), p2: simBoard.getPoints(Player.Player2)};
            if (simBoard.AIDepth != 0) //recursive structure
            {
                simBoard.AIDepth = simBoard.AIDepth - 1;
                if (playAgain != SowOutcome.PlayAgain) //swap players if adequate
                    player = player == Player.Player1 ? Player.Player2 : Player.Player1;
                let bestResult = simBoard.getAIBestOutcome(player); //get best recursive result
                bestLocalOutcome.p1 = bestResult.p1; //best local outcome is determined by best next option
                bestLocalOutcome.p2 = bestResult.p2;
            }
            outcomes.push(bestLocalOutcome);
        });

        let bestOutcome = outcomes[0];
        outcomes.forEach(outcome => {
            if (player == Player.Player1 && outcome.p1 > bestOutcome.p1)
                bestOutcome = outcome;
                
            else if (player == Player.Player2 && outcome.p2 > bestOutcome.p2)
                bestOutcome = outcome;
        });

        return bestOutcome;
    }

    turnAI()
    {
        let sowableCavities = this.getSowableCavities(Player.Player2);

        if(sowableCavities.length == 0)
        {
            alert(`The AI can't sow, so the game is over! You got: ${this.getPoints(Player.Player1)} points!`);
            return;
        }

        let bestOutcome = this.getAIBestOutcome(Player.Player2);

        console.log(bestOutcome);

        let result = this.sow(this.cavities.at(bestOutcome.cavity), Player.Player2);

        if (result == SowOutcome.PlayAgain)
        {
            console.log('Playing again!');
            this.turnAI();
        }       
    }

    turn(sourceCavity)
    {
        let result = this.sow(sourceCavity, Player.Player1);

        if (result == SowOutcome.EmptySourceCavity || result == SowOutcome.InvalidSourceCavity || result == SowOutcome.PlayAgain)
            return;
        
        if (this.AIDepth != null)
            this.turnAI();

        else
            alert('Other player is playing...');
        
        let sowableCavities = this.getSowableCavities(Player.Player1);

        if (sowableCavities.length == 0)
            alert(`You can't sow, so the game is over! You got: ${this.getPoints(Player.Player1)} points!`);
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

        this.updateScore();
    }
    
    hookOnClick()
    {
        if (this.player() == Player.Player2 || this.isStorage())
            return;

        this.element.addEventListener('click', () => {
            if(tog.isAIGameType()) {
                board.turn(this);
                board.updateDisplay();
            } else {
                act.notify(board.cavities.indexOf(this));
            }
        });
    }

    updateDisplay()
    {
        this.seeds.forEach(seed => {
            if (seed.wasChanged)
            {
                seed.element.remove();
                seed.genDisplay();
            }
        });

        this.updateScore();
    }

    updateScore() {
        if(this.isStorage() && this.player() == Player.Player1) {
            document.getElementById('p1-points').innerText = this.element.childElementCount;
        } else if (this.isStorage() && this.player() == Player.Player2) {
            document.getElementById('p2-points').innerText = this.element.childElementCount;
        }
    }

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

    fromCavity(newBoard)
    {
        return new Cavity(newBoard, this.seeds.length, this.specifier);
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

        this.wasChanged = false;
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