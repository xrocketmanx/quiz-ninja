var ProgressBar = (function () {
    "use strict";

    function ProgressBar(container) {
        var COEF = 1000;

        var bar = container.querySelector('.bar');
        var counter = container.querySelector('.counter');

        this.show = function(value, ms) {
            value = Math.abs(value) % 101;

            var step = COEF / ms;
            var timeDelta = ms * step / 100;

            var width = 0;
            bar.style.width = width;
            counter.innerHTML = width;

            var interval = setInterval(function() {
                if (width < value - step) {
                    width += step;

                    bar.style.width = width + '%';
                    counter.innerHTML = Math.floor(width) + '%';
                } else {
                    clearInterval(interval);
                    bar.style.width = value + '%';
                    counter.innerHTML = +value.toFixed(2) + '%';
                }
            }, timeDelta);
        };
    }

    ProgressBar.render = function() {
        var barContainer = document.createElement('div');
        barContainer.classList.add('progress-bar');

        var counter = document.createElement('span');
        counter.classList.add('counter');
        barContainer.appendChild(counter);

        var progress = document.createElement('div');
        progress.classList.add('bar');
        barContainer.appendChild(progress);

        return barContainer;
    };

    return ProgressBar;
})();
