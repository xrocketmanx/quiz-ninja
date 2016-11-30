"use strict";
var modal = (function() {
    return {
        bindImages: function(selector) {
            var images = document.querySelectorAll(selector);
            var modalImage = document.querySelector('.modal-image');

            Array.prototype.forEach.call(images, function(image) {
                image.addEventListener('click', imageClick);
            });

            modalImage.addEventListener('click', function() {
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
