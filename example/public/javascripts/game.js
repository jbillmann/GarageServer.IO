$(function () {
    var canvas = document.getElementById('gameCanvas'), ctxCanvas = canvas.getContext('2d'), keyboard = new THREEx.KeyboardState(),
        requestAnimFrame = (function () {
            return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (callback) { window.setTimeout(callback, 1000/60); };
        })();

    GarageServerIO.initializeGarageServer('http://garageserver_io.jbillmann.c9.io', { 
        logging: true,
        clientSidePrediction: true,
        interpolation: true,
        onUpdatePlayerPhysics: onUpdatePlayerPhysics,
        onInterpolation: function (previousState, targetState, amount) {
            var interpolationState = {};
            interpolationState.x = (previousState.x + amount * (targetState.x - previousState.x));
            interpolationState.y = (previousState.y + amount * (targetState.y - previousState.y));
            return interpolationState;
        },
        onUpdate: function () {
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

    GarageServerIO.start();
    GarageServerIO.setPlayerState({ x: 0, y: 0 });
    render();

    function render () {
        requestAnimFrame(render);

        ctxCanvas.clearRect(0, 0, canvas.width, canvas.height);

        GarageServerIO.getPlayerStates(function (state) {
            ctxCanvas.fillRect(state.x, state.y, 15, 15);
        });
    }
});