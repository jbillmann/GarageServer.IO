$(function () {

    "use strict";

    var canvas = document.getElementById('gameCanvas'), ctxCanvas = canvas.getContext('2d'), keyboard = new THREEx.KeyboardState(),
        playerSize = 0, entitySize = 0, 
        image = new Image(),
        shipNumber = Math.floor(Math.random() * 9) + 1;
        image.src = '../images/' + shipNumber + '.png';

    window.addEventListener('resize', resizeCanvas, false);

    GarageServerIO.initializeGarageServer('http://garageserver_io.jbillmann.c9.io', {
        logging: true,
        onReady: startGame,
        onUpdatePlayerPrediction: GamePhysics.getNewPlayerState,
        onInterpolation: GamePhysics.getInterpolatedState,
        onWorldState: function (state) {
            //CHANGE THIS FOR DEMO AND DOCUMENTATION
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
                    drawRotatedImage(player.state.ang, player.state.x, player.state.y, image);
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
    
    function drawRotatedImage(angle, x, y, img) {
        ctxCanvas.save();
        ctxCanvas.translate(x + img.width / 2, y + img.height / 2);
        ctxCanvas.rotate(angle * (Math.PI / 180));
        ctxCanvas.drawImage(img, 0, 0, img.width, img.height, -img.width / 2, -img.height / 2, img.width, img.height);
        ctxCanvas.restore();
    }
});