$(function () {
    GarageServerIO.connectToGarageServer('http://garageserver_io.jbillmann.c9.io', { 
        logging: true,
        clientSidePrediction: true,
        //interpolation: true,
        onUpdatePlayerPhysics: function (state, inputs) {
            var i = 0;
            if (!state.x && !state.y) {
                state.x = 0;
                state.y = 0;
            }
            for (i = 0; i < inputs.length; i ++) {
                if (inputs[i].input === 'left') {
                    state.x -= 1;
                } else if (inputs[i].input === 'right') {
                    state.x += 1;
                } else if (inputs[i].input === 'down') {
                    state.y += 1;
                } else if (inputs[i].input === 'up') {
                    state.y -= 1;
                }
            }
            return state;
        }
    });

    var gameCanvas = document.getElementById('gameCanvas'),

        keyboard = new THREEx.KeyboardState(),

        ctxGameCanvas = gameCanvas.getContext('2d'),

        fps = 0,

        now,

        lastUpdate = (new Date()) * 1 - 1,

        fpsFilter = 50,

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
                ctxGameCanvas.fillRect(state.x, state.y, 10, 10);
            });
        },

        update = function () {
            requestAnimFrame(update);

            processClientInput();

            draw();

            var thisFrameFPS = 1000 / ((now = new Date()) - lastUpdate);
            fps += (thisFrameFPS - fps) / fpsFilter;
            lastUpdate = now;

            $('#fps').html('FPS: ' + Math.round(fps));
        };

    update();
});