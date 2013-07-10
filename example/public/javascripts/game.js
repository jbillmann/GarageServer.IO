$(function () {
    var canvas = document.getElementById('gameCanvas'), 
        ctxCanvas = canvas.getContext('2d'), 
        keyboard = new THREEx.KeyboardState(),
        requestAnimFrame = (function () {
            return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (callback) { window.setTimeout(callback, 1000/60); };
        })();

    GarageServerIO.initializeGarageServer('http://garageserver_io.jbillmann.c9.io', { 
        logging: true,
        onUpdatePlayerPhysics: onUpdatePlayerPhysics,
        onInterpolation: function (id, previousState, targetState, amount) {
            var interpolationState = {};
            interpolationState.x = (previousState.x + amount * (targetState.x - previousState.x));
            interpolationState.y = (previousState.y + amount * (targetState.y - previousState.y));
            return interpolationState;
        }
    });
    GarageServerIO.setPlayerState({ x: 0, y: 0 });

    Accumulator.reset();
    render();

    function render () {
        requestAnimFrame(render);

        ctxCanvas.clearRect(0, 0, canvas.width, canvas.height);

        Accumulator.tick();
        while (Accumulator.time() >= 15)
        {
            captureInput();
            Accumulator.reduceTime(15);
        }

        GarageServerIO.getStates(function (selfState, playerStates, entityStates) {
            playerStates.forEach(function (player) {
                ctxCanvas.fillRect(player.currentState.x, player.currentState.y, 15, 15);
            });

            entityStates.forEach(function (entity) {
                ctxCanvas.fillRect(entity.currentState.x, entity.currentState.y, 15, 15);
            });

            ctxCanvas.fillRect(selfState.x, selfState.y, 15, 15);
        });
    }
    
    function captureInput () {
        if (keyboard.pressed('left')) {
            GarageServerIO.addPlayerInput('left');
        }
        if (keyboard.pressed('right')) {
            GarageServerIO.addPlayerInput('right');
        }
        if (keyboard.pressed('down')) {
            GarageServerIO.addPlayerInput('down');
        }
        if (keyboard.pressed('up')) {
            GarageServerIO.addPlayerInput('up');
        }
    }
});