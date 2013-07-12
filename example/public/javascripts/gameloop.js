var GameLoop = (function (window) {
    "use strict";

    var requestAnimFrame = (function () {
            return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (callback) { window.setTimeout(callback, 1000/60); };
        }()),
        _currentTime = new Date().getTime(),
        _accumulator = 0.0,

        start = function (renderCallback, updateCallback) {
            function loop() {
                requestAnimFrame(loop);

                var newTime = new Date().getTime(), frameTime = newTime - _currentTime;
                if (frameTime  > 250) {
                    frameTime = 250;
                }
                _currentTime = newTime;
                _accumulator += frameTime;

                while (_accumulator >= 15) {
                    updateCallback();
                    _accumulator -= 15;
                }

                renderCallback();
            }
            loop();
        };

    return {
        start: start
    };
}(window));