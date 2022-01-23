let particleArray = [];

function animateCanvas(message) {
    class Particle {
        constructor(moveRadius, step, position, size) {
            this.moveRadius = moveRadius;
            this.step = step;
            this.position = position;
            this.size = size;
            this.curStep = this.step;
            this.accelerate = false;
        }
    
        draw(ctx, canvas) {
            ctx.beginPath();
            ctx.arc(Math.cos(this.position)*this.moveRadius + canvas.width/2,
            Math.sin(this.position)*this.moveRadius + canvas.height/2,
            this.size, 0, Math.PI*2);
            ctx.closePath();
            ctx.fillStyle = `rgb(241, 222, 222)`;
            ctx.fill();
        }
    
        update(ctx, canvas) {
            this.position += this.curStep;
            this.draw(ctx, canvas);
            if(!this.accelerate && this.curStep > this.step) {
                this.curStep -= 0.05*this.curStep;
            }
            if(this.curStep < this.step) this.curStep = this.step;
        }
    }
    
    const canvas = document.getElementById('loadingAnim');
    const ctx = canvas.getContext("2d");
    if(innerWidth/2 > 500)
        canvas.width = innerWidth/2;
    else canvas.width = innerWidth - 50;
    canvas.height = innerHeight/2;
    
    function init(windowChange) {
        
        if(windowChange || particleArray.length == 0) {

            particleArray = [];

            for(let i=0; i < 500; i++) {
                let moveRadius = Math.random() * canvas.width;
                let step = (Math.random()*0.002) + 0.002;
                let position = Math.random() * (Math.PI*2);
                let size = (Math.random() * 12) + 0.5;
        
                particleArray.push(new Particle(moveRadius, step, position, size));
            }
        }
    }
    
    function animate() {
        requestAnimationFrame(animate);
        ctx.fillStyle = `rgba(152,199,161)`;
        ctx.fillRect(0,0,innerWidth, innerHeight);
        for(let i = 0; i < particleArray.length; i++) {
            particleArray[i].update(ctx, canvas);
        }
        ctx.font = "2em Alegreya";
        ctx.fillStyle = `rgb(79, 56, 36)`;
        if(canvas.width < 500) {
            ctx.fillText(message.substring(0, message.length/2), parseInt(canvas.width/2), parseInt(innerHeight/4));
            ctx.fillText(message.substring(message.length/2), parseInt(canvas.width/2), parseInt(innerHeight/4) + 50);
        } else ctx.fillText(message, parseInt(canvas.width/2), parseInt(innerHeight/4));
        ctx.textAlign = "center"; 
    }
    
    function handleMouseUp() {
        particleArray.forEach(particle => {
            particle.size -= 0.5;
        });
    }
    
    function handleMouseDown() {
        particleArray.forEach(particle => {
            particle.size += 0.8;
        });
    }
    
    function handleMouseMove() {
        particleArray.forEach(particle => {
            particle.curStep += 0.0005;
        });
    }
    
    function handleMouseEnter() {
        particleArray.forEach(particle => {
            particle.moveRadius += 5;
        });
    }
    
    function handleMouseLeave() {
        particleArray.forEach(particle => {
            particle.moveRadius -= 5;
        });
    }
    
    function handleAcceleration(accelerate) {
        particleArray.forEach(particle => {
            particle.accelerate = accelerate;
        });
    }


    init();
    animate();
    
    window.addEventListener("resize", () => {
        if(canvas) {
            if(innerWidth/2 > 500)
                canvas.width = innerWidth/2;
            else canvas.width = innerWidth - 50;
            canvas.height = innerHeight/2;
            console.log('canvas width:', canvas.width)
            init(true);
        }
    })
    
    
    canvas.addEventListener("mouseup", () => {
        handleMouseUp();
    })
    
    canvas.addEventListener("mousedown", () => {
        handleMouseDown();
    })
    
    canvas.addEventListener("mousemove", () => {
        handleMouseMove();
        handleAcceleration(true);
    })
    
    canvas.addEventListener("mouseenter", ()  => {
        handleMouseEnter();
    })
    
    canvas.addEventListener("mouseleave", ()  => {
        handleMouseLeave();
        handleAcceleration(false);
    })
}

animateCanvas("No game is currently being played.");