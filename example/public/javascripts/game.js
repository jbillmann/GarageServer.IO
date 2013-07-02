$(function () {
    GarageServerIO.connectToGarageServer('http://garageserver_io.jbillmann.c9.io', { 
        logging: true,
        clientSidePrediction: true,
        clientSmoothing: true,
        interpolation: true,
        onUpdatePlayerPhysics: OnProcessGamePhysics,
        onInterpolation: function (currentState, previousState, targetState, amount) {
            var interpolationState = {};
            interpolationState.x = (previousState.x + amount * (targetState.x - previousState.x));
            interpolationState.y = (previousState.y + amount * (targetState.y - previousState.y));
            return interpolationState;
        }
    });

    var gameCanvas = document.getElementById('gameCanvas'),
        keyboard = new THREEx.KeyboardState(),
        ctxGameCanvas = gameCanvas.getContext('2d'),

        requestAnimFrame = (function () {
            return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (callback) { window.setTimeout(callback, 1000/60); };
        })(),

        processClientInput = function () {
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
        },

        draw = function () {
            ctxGameCanvas.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

            GarageServerIO.getPlayerStates(function (state) {
                ctxGameCanvas.fillRect(state.x, state.y, 15, 15);
            });
        },

        update = function () {
            requestAnimFrame(update);
            processClientInput();
            draw();
            $('#fps').html('FPS: ' + GarageServerIO.getFPS());
        };

    update();
});