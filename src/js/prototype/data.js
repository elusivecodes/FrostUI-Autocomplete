import $ from '@fr0st/query';

/**
 * Initialize preloaded get data.
 */
export function _getDataInit() {
    this._getData = ({ term = null }) => {
        $.empty(this._menuNode);
        $.setAttribute(this._node, { 'aria-activedescendent': '' });

        let results;

        // check for minimum search length
        if (this._options.minSearch && (!term || term.length < this._options.minSearch)) {
            results = [];
        } else {
            const isMatch = this._options.isMatch.bind(this);
            const sortResults = this._options.sortResults.bind(this);

            // filter results
            results = this._data.filter((data) => isMatch(data, term))
                .sort((a, b) => sortResults(a, b, term));
        }

        this._renderResults(results);
        this.update();
    };
};

/**
 * Initialize get data callback.
 */
export function _getResultsCallbackInit() {
    this._getResults = (options) => {
        // reset data for starting offset
        if (!options.offset) {
            this._data = [];
        }

        const request = Promise.resolve(this._options.getResults(options));

        request.then((response) => {
            this._data.push(...response.results);
            this._showMore = response.showMore;
        }).catch((_) => { });

        return request;
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

        const request = this._getResults(options);

        request.then((response) => {
            if (this._request !== request) {
                return;
            }

            if (!offset) {
                $.empty(this._menuNode);
            } else if (this._loader) {
                $.detach(this._loader);
            }

            this._renderResults(response.results);

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
    }, this._options.debounceInput);

    this._getData = ({ offset = 0, term = null }) => {
        // cancel last request
        if (this._request && this._request.cancel) {
            this._request.cancel();
        }

        this._request = null;

        if (!offset) {
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
