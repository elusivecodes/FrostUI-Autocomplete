import $ from '@fr0st/query';

/**
 * Initialize preloaded get data.
 */
export function _getDataInit() {
    this._getData = ({ term = null }) => {
        this._activeItems = [];
        $.empty(this._menuNode);
        $.setAttribute(this._node, { 'aria-activedescendent': '' });

        // check for minimum search length
        if (this._options.minSearch && (!term || term.length < this._options.minSearch)) {
            $.hide(this._menuNode);
            this.update();
            return;
        }

        $.show(this._menuNode);

        const isMatch = this._options.isMatch.bind(this);
        const sortResults = this._options.sortResults.bind(this);

        // filter results
        const results = this._data.filter((value) => isMatch(value, term))
            .sort((a, b) => sortResults(a, b, term));

        this._renderResults(results);
        this.update();
    };
};

/**
 * Initialize get data from callback.
 */
export function _getResultsInit() {
    const load = $._debounce(({ offset, term }) => {
        const options = { offset };

        if (term) {
            options.term = term;
        }

        const request = Promise.resolve(this._options.getResults(options));

        request.then((response) => {
            if (this._request !== request) {
                return;
            }

            const newData = response.results;

            if (!offset) {
                this._data = newData;
                $.empty(this._menuNode);
            } else {
                this._data.push(...newData);
                $.detach(this._loader);
            }

            this._showMore = response.showMore;

            this._renderResults(newData);

            this._request = null;
        }).catch((_) => {
            if (this._request !== request) {
                return;
            }

            $.detach(this._loader);
            $.append(this._menuNode, this._error);

            this._request = null;
        }).finally((_) => {
            this._loadingScroll = false;
            this.update();
        });

        this._request = request;
    }, this._options.debounce);

    this._getData = ({ offset = 0, term = null }) => {
        // cancel last request
        if (this._request && this._request.cancel) {
            this._request.cancel();
        }

        this._request = null;

        if (!offset) {
            this._activeItems = [];
            $.setAttribute(this._node, { 'aria-activedescendent': '' });

            const children = $.children(this._menuNode, (node) => !$.isSame(node, this._loader));
            $.detach(children);
        } else {
            $.detach(this._error);
        }

        // check for minimum search length
        if (this._options.minSearch && (!term || term.length < this._options.minSearch)) {
            $.hide(this._menuNode);
            this.update();
            return;
        }

        $.show(this._menuNode);

        const lastChild = $.child(this._menuNode, ':last-child');
        if (!lastChild || !$.isSame(lastChild, this._loader)) {
            $.append(this._menuNode, this._loader);
        }

        load({ offset, term });
    };
};
