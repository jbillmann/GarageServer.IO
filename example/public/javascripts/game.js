$(function () {
    GarageServerIO.connectToGarageServer('http://garageserver_io.jbillmann.c9.io', { logging: true });
    
    var gameCanvas = document.getElementById('gameCanvas'),
    
    keyboard = new THREEx.KeyboardState(),
    
    ctxGameCanvas = gameCanvas.getContext('2d'),
    
    x = 0, y =0, fps = 0, now, lastUpdate = (new Date)*1 - 1, fpsFilter = 50,
    
    requestAnimFrame = (function(){
        return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (callback) { window.setTimeout(callback, 1000/60); };
    })(),

    handleInput = function (){
        if(keyboard.pressed('left')) {
            x -= 1;
            GarageServerIO.addPlayerInput('left');
        }
        if(keyboard.pressed('right')) {
            x += 1;
            GarageServerIO.addPlayerInput('right');
        }
        if(keyboard.pressed('down')) {
            y += 1;
            GarageServerIO.addPlayerInput('down');
        }
        if(keyboard.pressed('up')) {
            y -= 1;
            GarageServerIO.addPlayerInput('up');
        }
    },
    
    update = function () {
        requestAnimFrame(update);
        handleInput();
        ctxGameCanvas.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
        ctxGameCanvas.fillRect(x, y, 10, 10);
        
        var thisFrameFPS = 1000 / ((now=new Date) - lastUpdate);
        fps += (thisFrameFPS - fps) / fpsFilter;
        lastUpdate = now;
        
        $('#fps').html('FPS: ' + Math.round(fps));
    };
    
    update();
    
});