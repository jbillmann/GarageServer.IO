$(function () {
    var canvas = document.getElementById('gameCanvas'), ctxCanvas = canvas.getContext('2d'), keyboard = new THREEx.KeyboardState();

    GarageServerIO.initializeGarageServer('http://garageserver_io.jbillmann.c9.io', { 
        logging: true,
        onUpdatePlayerPhysics: GamePhysics.getNewState,
        onInterpolation: GamePhysics.getInterpolatedState
    });
    GarageServerIO.setPlayerState({ x: 0, y: 0 });

    GameLoop.start(
        //Render Loop
        function () {
            ctxCanvas.clearRect(0, 0, canvas.width, canvas.height);

            GarageServerIO.getStates(function (selfState, playerStates, entityStates) {
                playerStates.forEach(function (player) {
                    ctxCanvas.fillRect(player.state.x, player.state.y, 15, 15);
                });

                entityStates.forEach(function (entity) {
                    ctxCanvas.fillRect(entity.state.x, entity.state.y, 15, 15);
                });

                ctxCanvas.fillRect(selfState.x, selfState.y, 15, 15);
            });
        },
        //Update Loop
        function () {
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
    );
});