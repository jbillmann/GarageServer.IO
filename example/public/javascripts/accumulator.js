var Accumulator = (function () {
    var _currentTime = new Date().getTime(),
        _accumulator = 0.0,
        
        reset = function () {
            _currentTime = new Date().getTime();
            _accumulator = 0.0;
        },

        tick = function () {
            var newTime = new Date().getTime(), frameTime = newTime - _currentTime;
            if (frameTime  > 250) {
                frameTime = 250;
            }
            _currentTime = newTime;
            _accumulator += frameTime;
        },
        
        time = function () {
            return _accumulator;
        },
        
        reduceTime = function (time) {
            _accumulator -= time;
        };

    return {
        tick: tick,
        reset: reset,
        time: time,
        reduceTime: reduceTime
    };

}) ();