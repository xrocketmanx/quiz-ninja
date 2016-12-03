function Paginator(items, itemsPageCount) {
    var length = items.length;
    var page = 1;

    this.getPagesCount = function() {
        return Math.ceil(length / itemsPageCount);
    };

    this.getItems = function() {
        var offset = (page - 1) * itemsPageCount;
        return items.slice(offset, offset + itemsPageCount);
    };

    this.setPage = function(_page) {
        page = _page;
    };

    this.renderPagination = function() {
        var pagination = document.createElement('ol');
        pagination.className = 'pagination';
        appendLink(pagination, '«');

        var first = page - 2 > 0 ? page - 2 : 1;
        var last = (page + 2) % length;
        for (var i = first; i < page; i++) {
            appendLink(pagination, i);
        }
        appendLink(pagination, page, 'active');
        for (i = page + 1; i < last; i++) {
            appendLink(pagination, i);
        }

        appendLink(pagination, '»');
        return pagination;
    };
    
    function appendLink(pagination, text, className) {
        var li = document.createElement('li');
        if (className) {
            li.className = className;
        }
        var link = document.createElement('a');
        link.appendChild(document.createTextNode(text));
        li.appendChild(link);
        pagination.appendChild(li);
    }
}
