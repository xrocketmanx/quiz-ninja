var Paginator = (function(){
    "use strict";

    function Paginator(items, itemsPageCount) {
        var length = items.length;
        var page = 1;
        var pagesCount = Math.ceil(length / itemsPageCount);

        this.getPagesCount = function() {
            return pagesCount;
        };

        this.getItems = function() {
            var offset = (page - 1) * itemsPageCount;
            return items.slice(offset, offset + itemsPageCount);
        };

        this.getPagination = function(onClick) {
            var pagination = renderPagination();

            var pages = pagination.children;
            for (var i = 0; i < pages.length; i++) {
                pages[i].addEventListener('click', function(event) {
                    event = event || window.event;
                    if (event.preventDefault) {
                        event.preventDefault();
                    } else {
                        event.returnValue = false;
                    }
                    page = +this.children[0].getAttribute('href').slice(1);
                    onClick();
                });
            }

            return pagination;
        };

        function renderPagination() {
            var pagination = document.createElement('ol');
            pagination.className = 'pagination';
            if (pagesCount <= 1) return pagination;

            appendLink(pagination, '«', 1);

            var first = page - 2 > 0 ? page - 2 : 1;
            var last = page + 2 <= pagesCount ? page + 2 : pagesCount;

            for (var i = first; i < page; i++) {
                appendLink(pagination, i);
            }
            appendLink(pagination, page, page, 'active');
            for (i = page + 1; i <= last; i++) {
                appendLink(pagination, i);
            }

            appendLink(pagination, '»', pagesCount);
            return pagination;
        }

        function appendLink(pagination, text, href, className) {
            href = href || text;

            var li = document.createElement('li');
            var link = document.createElement('a');
            link.appendChild(document.createTextNode(text));
            if (className) {
                link.className = className;
            }
            link.setAttribute('href', '#' + href);
            li.appendChild(link);
            pagination.appendChild(li);
        }
    }

    return Paginator;
})();
