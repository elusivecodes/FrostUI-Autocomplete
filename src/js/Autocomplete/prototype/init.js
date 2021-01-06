/**
 * Autocomplete Init
 */

Object.assign(Autocomplete.prototype, {

    /**
     * Initialize preloaded get data.
     */
    _getDataInit() {
        this._getData = ({ term = null }) => {
            // check for minimum search length
            if (this._settings.minSearch && (!term || term.length < this._settings.minSearch)) {
                return this.update();
            }

            // filter results
            const results = this._settings.sortResults(
                this._data,
                term
            ).filter(item => this._settings.isMatch(item, term));

            this._renderResults(results);
            this.update();
        };
    },

    /**
     * Initialize get data from callback.
     */
    _getResultsInit() {
        this._getData = ({ offset = 0, term = null }) => {

            // cancel last request
            if (this._request && this._request.cancel) {
                this._request.cancel();
                this._request = null;
            }

            if (!offset) {
                dom.empty(this._itemsList);
            }

            // check for minimum search length
            if (this._settings.minSearch && (!term || term.length < this._settings.minSearch)) {
                return this.update();
            }

            dom.hide(this._menuNode);
            const request = this._getResults({ offset, term });

            request.then(response => {
                this._renderResults(response.results);
            }).catch(_ => {
                // error
            }).finally(_ => {
                this.update();

                if (this._request === request) {
                    this._request = null;
                }
            });
        };
    },

    /**
     * Initialize get data callback.
     */
    _getResultsCallbackInit() {
        this._getResults = options => {
            // reset data for starting offset
            if (!options.offset) {
                this._data = [];
            }

            const request = this._settings.getResults(options);
            this._request = Promise.resolve(request);

            this._request.then(response => {
                const newData = this.constructor._parseData(response.results);
                this._data.push(...newData);
                this._showMore = response.showMore;

                // update lookup
                Object.assign(
                    this._lookup,
                    this.constructor._parseDataLookup(this._data)
                );

                return response;
            });

            return this._request;
        };
    }

});
