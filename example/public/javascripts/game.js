$(function () {

    "use strict";

    var canvas = document.getElementById('gameCanvas'), ctxCanvas = canvas.getContext('2d'), keyboard = new THREEx.KeyboardState(), ships = preloadShips(), entityImage = new Image();
    entityImage.src = '../images/entity.png';

    window.addEventListener('resize', resizeCanvas, false);

    GarageServerIO.initializeGarageServer('https://garageserver_io-c9-jbillmann.c9.io', {
        logging: true,
        onReady: startGame,
        onUpdatePlayerPrediction: GamePhysics.getNewPlayerState,
        onInterpolation: GamePhysics.getInterpolatedState
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
                ctxCanvas.font = "40pt Helvetica";
                ctxCanvas.fillText('GarageServer.IO Demo', 10, canvas.height - 50);

                ctxCanvas.fillStyle = 'white';
                var playerStates = GarageServerIO.getPlayerStates(),
                    entityStates = GarageServerIO.getEntityStates();
                entityStates.forEach(function (entity) {
                    drawRotatedImage(entity.state.ang, entity.state.x, entity.state.y, entityImage);
                });
                playerStates.forEach(function (player) {
                    if (player.state.ship) {
                        drawRotatedImage(player.state.ang, player.state.x, player.state.y, ships[player.state.ship]);
                    }
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
                if (keyboard.pressed('up')) {
                    GarageServerIO.addInput('up');
                }
                if (keyboard.pressed('space')) {
                    GarageServerIO.addInput('space');
                }
            }
        );
    }

    function drawRotatedImage(angle, x, y, img) {
        ctxCanvas.save();
        ctxCanvas.translate(x + img.width / 2, y + img.height / 2);
        ctxCanvas.rotate(angle * (Math.PI / 180));
        ctxCanvas.drawImage(img, 0, 0, img.width, img.height, -img.width / 2, -img.height / 2, img.width, img.height);
        ctxCanvas.restore();
    }

    function preloadShips() {
        var ships = [];
        for(var i = 0; i < 10; i ++) {
            var img = new Image();
            img.src = '../images/' + i + '.png';
            ships.push(img);
        }
        return ships;
    }
});