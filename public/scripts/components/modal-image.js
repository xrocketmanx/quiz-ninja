var modal = (function() {
    function addEvent(element, type, handler) {
        if (element.addEventListener) {
            element.addEventListener(type, handler, false);
        } else {
            element.attachEvent('on' + type, function() {
                handler.apply(element, arguments);
            });
        }
    }

    return {
        bindImages: function(selector) {
            var images = document.querySelectorAll(selector);
            var modalImage = document.querySelector('.modal-image');

            Array.prototype.forEach.call(images, function(image) {
                addEvent(image, 'click', imageClick);
            });

            addEvent(modalImage, 'click', function() {
                this.style.display = 'none';
            });

            function imageClick() {
                modalImage.querySelector('img').setAttribute('src', this.getAttribute('src'));
                modalImage.querySelector('.caption').innerHTML = this.parentNode.querySelector('.caption').innerHTML;
                modalImage.style.display = 'block';
            }
        }
    };
})();
