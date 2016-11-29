//requires jQuery
var modal = {
    bindImage: function(selector) {
        var $images = $(selector);
        var $modalImage = $('.modal-image');

        $images.on('click', function() {
            $modalImage.find('img').attr('src', $(this).attr('src'));
            $modalImage.find('.caption').text($(this).siblings('.caption').text());
            $modalImage.show();
        });
        $modalImage.on('click', function() {
            $(this).fadeOut(50);
        });
    }
};
