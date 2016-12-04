var Carousel = (function(typeCheck) {
    "use strict";

    function Carousel(carousel) {
        var self = this;
        var ACTIVE_CLASS = 'active';
        var LEFT_CLASS = 'left';
        var RIGHT_CLASS = 'right';
        var BOX_CLASS = 'box';
        var NEXT_CONTROL_CLASS = 'control-next';
        var PREV_CONTROL_CLASS = 'control-prev';

        var boxes = Array.prototype.filter.call(carousel.children, function(box) {
            return box.classList.contains(BOX_CLASS);
        });
        var pos;
        var animation = null;

        this.moveNext = function() {
            move(getNext);
        };

        this.movePrev = function() {
            move(getPrev);
        };

        this.start = function(interval, direction) {
            interval = interval || 2000;
            direction = direction || 'forward';
            typeCheck('interval', interval, 'number');
            typeCheck('direction', direction, 'string');

            var func;

            if (direction === 'forward') func = this.moveNext.bind(this);
            else if (direction === 'backward') func = this.movePrev.bind(this);

            animation = setInterval(func, interval);
        };

        this.stop = function() {
            clearInterval(animation);
        };

        function initPosition() {
            for (var i = 0; i < boxes.length; i++) {
                if (boxes[i].classList.contains(ACTIVE_CLASS)) {
                    pos = i;
                    break;
                }
            }
            boxes[getPrev(pos)].classList.add(LEFT_CLASS);
            boxes[getNext(pos)].classList.add(RIGHT_CLASS);
        }

        function attachEvents() {
            var nextControl = carousel.querySelector('.' + NEXT_CONTROL_CLASS);
            var prevControl = carousel.querySelector('.' + PREV_CONTROL_CLASS);
            nextControl.addEventListener('click', self.moveNext.bind(self));
            prevControl.addEventListener('click', self.movePrev.bind(self));
        }

        var move = delay(function(changePos) {
            boxes[getPrev(pos)].classList.remove(LEFT_CLASS);
            boxes[pos].classList.remove(ACTIVE_CLASS);
            boxes[getNext(pos)].classList.remove(RIGHT_CLASS);

            pos = changePos(pos);

            boxes[getPrev(pos)].classList.add(LEFT_CLASS);
            boxes[pos].classList.add(ACTIVE_CLASS);
            boxes[getNext(pos)].classList.add(RIGHT_CLASS);
        }, 1000);

        function getPrev(pos) {
            return pos - 1 >= 0 ? pos - 1 : boxes.length - 1;
        }

        function getNext(pos) {
            return (pos + 1) % boxes.length;
        }

        function delay(func, ms) {
            var block = false;
            return function() {
                if (block) return;
                block = true;
                func.apply(this, arguments);
                setTimeout(function() {
                    block = false
                }, ms);
            };
        }

        initPosition();
        attachEvents();
    }
    return Carousel;
})(typeCheck);
