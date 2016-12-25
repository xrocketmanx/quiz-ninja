var ProgressBar = (function () {
    "use strict";

    function ProgressBar(container) {
        var COEF = 1000;

        var bar = container.querySelector('.bar');
        var counter = container.querySelector('.counter');

        this.show = function(value, ms, colors) {
            colors = colors.map(Color.parse);
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
                    bar.style.backgroundColor = Color.interpolate(colors, width / 100);
                } else {
                    clearInterval(interval);
                    bar.style.width = value + '%';
                    counter.innerHTML = +value.toFixed(2) + '%';
                    bar.style.backgroundColor = Color.interpolate(colors, value / 100);
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


    function Color(red, green, blue) {
        this.red = red;
        this.green = green;
        this.blue = blue;

        this.interpolate = function(color, t) {
            if (!color) return this;
            return new Color(
                Math.floor(interpolate(this.red, color.red, t)),
                Math.floor(interpolate(this.green, color.green, t)),
                Math.floor(interpolate(this.blue, color.blue, t))
            );
        };

        this.toString = function() {
            return 'rgb(' + this.red + ',' + this.green + ',' + this.blue + ')';
        };

        function interpolate(a, b, t) {
            return (1 - t) * a + t * b;
        }
    }

    Color.parse = function(str) {
        var parts = str.match(/\((.*)\)/)[1].split(/,\s*/).map(function(part) { return + part; });
        return new Color(parts[0], parts[1], parts[2]);
    };

    Color.interpolate = function(colors, t) {
        var intervalSize = 1 / (colors.length - 1);
        var i = Math.floor(t / intervalSize);
        t = (t % intervalSize) / intervalSize;
        return colors[i].interpolate(colors[i + 1], t);
    };

    return ProgressBar;
})();
