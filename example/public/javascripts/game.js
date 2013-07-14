$(function () {

    "use strict";

    var canvas = document.getElementById('gameCanvas'), ctxCanvas = canvas.getContext('2d'), keyboard = new THREEx.KeyboardState(),
        playerSize = 0, entitySize = 0;

    GarageServerIO.initializeGarageServer('http://garageserver_io.jbillmann.c9.io', {
        logging: true,
        onUpdatePlayerPhysics: GamePhysics.getNewPlayerState,
        onInterpolation: GamePhysics.getInterpolatedState,
        onWorldState: function (state) {
            document.getElementById('gameCanvas').style.width = state.width + 'px';
            document.getElementById('gameCanvas').style.height = state.height + 'px';
            playerSize = state.playerSize;
            entitySize = state.entitySize;
        }
    });

    GameLoop.start(
        //Render Loop
        function () {
            ctxCanvas.clearRect(0, 0, canvas.width, canvas.height);
            GarageServerIO.getStates(function (playerStates, entityStates) {
                playerStates.forEach(function (player) {
                    ctxCanvas.fillRect(player.state.x, player.state.y, playerSize, playerSize);
                });

                entityStates.forEach(function (entity) {
                    ctxCanvas.fillRect(entity.state.x, entity.state.y, entitySize, entitySize);
                });
            });
        },
        //Update Loop
        function () {
            if (keyboard.pressed('left')) {
                GarageServerIO.addInput('left');
            }
            if (keyboard.pressed('right')) {
                GarageServerIO.addInput('right');
            }
            if (keyboard.pressed('down')) {
                GarageServerIO.addInput('down');
            }
            if (keyboard.pressed('up')) {
                GarageServerIO.addInput('up');
            }
            if (keyboard.pressed('space')) {
                GarageServerIO.addInput('space');
            }
        }
    );
});