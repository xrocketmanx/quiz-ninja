function ErrorNotifier(container, timeout) {
    "use strict";

    var messageElement = container.querySelector('message');
    if (!messageElement) {
        messageElement = document.createElement('strong');
        messageElement.classList.add('message');
        container.appendChild(messageElement);
    }

    this.show = function(errorMessage) {
        container.style.display = 'block';
        messageElement.innerHTML = 'Error: ' + errorMessage;
        setTimeout(hide, timeout);
    };

    function hide() {
        container.style.display = 'none';
    }
}

ErrorNotifier.LOADING_ERROR = 'Failed to load';
