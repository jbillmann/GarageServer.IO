$(function () {

    "use strict";

    var canvas = document.getElementById('gameCanvas'), ctxCanvas = canvas.getContext('2d'), keyboard = new THREEx.KeyboardState();

    GarageServerIO.initializeGarageServer('http://garageserver_io.jbillmann.c9.io', {
        logging: true,
        onUpdatePlayerPhysics: GamePhysics.getNewState,
        onInterpolation: GamePhysics.getInterpolatedState
    });
    GarageServerIO.setState({ x: 0, y: 0 });

    GameLoop.start(
        //Render Loop
        function () {
            ctxCanvas.clearRect(0, 0, canvas.width, canvas.height);
            GarageServerIO.getStates(function (playerStates, entityStates) {
                playerStates.forEach(function (player) {
                    ctxCanvas.fillRect(player.state.x, player.state.y, 15, 15);
                });

                entityStates.forEach(function (entity) {
                    ctxCanvas.fillRect(entity.state.x, entity.state.y, 15, 15);
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