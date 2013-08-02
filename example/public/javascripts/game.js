$(function () {

    "use strict";

    var canvas = document.getElementById('gameCanvas'), ctxCanvas = canvas.getContext('2d'), keyboard = new THREEx.KeyboardState(),
        playerSize = 0, entitySize = 0;

    window.addEventListener('resize', resizeCanvas, false);

    GarageServerIO.initializeGarageServer('http://garageserver_io.jbillmann.c9.io', {
        logging: true,
        onReady: startGame,
        onUpdatePlayerPrediction: GamePhysics.getNewPlayerState,
        onInterpolation: GamePhysics.getInterpolatedState,
        onWorldState: function (state) {
            playerSize = state.playerSize;
            entitySize = state.entitySize;
        }
    });

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    resizeCanvas();
    function startGame() {
        GameLoop.start(
            //Render Loop
            function () {
                ctxCanvas.clearRect(0, 0, canvas.width, canvas.height);
                ctxCanvas.fillStyle = 'white';
                var playerStates = GarageServerIO.getPlayerStates(),
                    entityStates = GarageServerIO.getEntityStates();
                playerStates.forEach(function (player) {
                    ctxCanvas.fillRect(player.state.x, player.state.y, playerSize, playerSize);
                });
                entityStates.forEach(function (entity) {
                    ctxCanvas.fillRect(entity.state.x, entity.state.y, entitySize, entitySize);
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
    }
});