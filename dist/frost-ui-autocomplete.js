/**
 * FrostUI-Autocomplete v1.0.1
 * https://github.com/elusivecodes/FrostUI-Autocomplete
 */
(function(global, factory) {
    'use strict';

    if (typeof module === 'object' && typeof module.exports === 'object') {
        module.exports = factory;
    } else {
        factory(global);
    }

})(window, function(window) {
    'use strict';

    if (!window) {
        throw new Error('FrostUI-Autocomplete requires a Window.');
    }

    if (!('UI' in window)) {
        throw new Error('FrostUI-Autocomplete requires FrostUI.');
    }

    const Core = window.Core;
    const dom = window.dom;
    const QuerySet = window.QuerySet;
    const UI = window.UI;
    const document = window.document;

    /**
     * Autocomplete Class
     * @class
     */
    class Autocomplete extends UI.BaseComponent {

        /**
         * New Autocomplete constructor.
         * @param {HTMLElement} node The input node.
         * @param {object} [settings] The options to create the Autocomplete with.
         * @returns {Autocomplete} A new Autocomplete object.
         */
        constructor(node, settings) {
            super(node, settings);

            this._data = [];

            this._getData = null;
            this._getResults = null;

            let data;
            if (Core.isFunction(this._settings.getResults)) {
                this._getResultsCallbackInit();
                this._getResultsInit();
            } else if (Core.isArray(this._settings.data)) {
                data = this._settings.data;
            }

            if (data) {
                this._data = data;
                this._getDataInit();
            }

            this._render();
            this._events();
        }

        /**
         * Dispose the Autocomplete.
         */
        dispose() {
            if (this._popper) {
                this._popper.dispose();
                this._popper = null;
            }

            dom.removeEvent(this._node, 'focus.ui.autocomplete');
            dom.remove(this._menuNode);

            this._menuNode = null;
            this._itemsList = null;
            this._data = null;
            this._lookup = null;
            this._value = null;
            this._request = null;

            super.dispose();
        }

        /**
         * Hide the Autocomplete.
         * @returns {Autocomplete} The Autocomplete.
         */
        hide() {
            if (
                this._animating ||
                !dom.isConnected(this._menuNode) ||
                !dom.triggerOne(this._node, 'hide.ui.autocomplete')
            ) {
                return this;
            }

            this._animating = true;

            dom.fadeOut(this._menuNode, {
                duration: this._settings.duration
            }).then(_ => {
                dom.empty(this._itemsList);
                dom.detach(this._menuNode);
                dom.setAttribute(this._node, 'aria-expanded', false);
                dom.triggerEvent(this._node, 'hidden.ui.autocomplete');
            }).catch(_ => { }).finally(_ => {
                this._animating = false;
            });

            return this;
        }

        /**
         * Show the Autocomplete.
         * @returns {Autocomplete} The Autocomplete.
         */
        show() {
            if (
                this._animating ||
                dom.is(this._node, ':disabled') ||
                dom.hasAttribute(this._node, 'readonly') ||
                dom.isConnected(this._menuNode) ||
                !dom.triggerOne(this._node, 'show.ui.autocomplete')
            ) {
                return this;
            }

            const term = dom.getValue(this._node);
            this._getData({ term });

            this._animating = true;

            if (this._settings.appendTo) {
                dom.append(document.body, this._menuNode);
            } else {
                dom.after(this._node, this._menuNode);
            }

            this.update();

            dom.fadeIn(this._menuNode, {
                duration: this._settings.duration
            }).then(_ => {
                dom.setAttribute(this._node, 'aria-expanded', true);
                dom.triggerEvent(this._node, 'shown.ui.autocomplete');
            }).catch(_ => { }).finally(_ => {
                this._animating = false;
            });

            return this;
        }

        /**
         * Toggle the Autocomplete.
         * @returns {Autocomplete} The Autocomplete.
         */
        toggle() {
            return dom.isConnected(this._menuNode) ?
                this.hide() :
                this.show();
        }

        /**
         * Update the Autocomplete position.
         * @returns {Autocomplete} The Autocomplete.
         */
        update() {
            this._popper.update();

            return this;
        }

    }


    /**
     * Autocomplete Events
     */

    Object.assign(Autocomplete.prototype, {

        /**
         * Attach events for the Autocomplete.
         */
        _events() {
            dom.addEventDelegate(this._menuNode, 'contextmenu.ui.autocomplete', '[data-ui-action="select"]', e => {
                // prevent menu node from showing right click menu
                e.preventDefault();
            });

            dom.addEventDelegate(this._itemsList, 'mousedown.ui.autocomplete', '[data-ui-action="select"]', e => {
                // prevent selection from triggering blur event
                e.preventDefault();
            });

            dom.addEventDelegate(this._itemsList, 'mouseup.ui.autocomplete', '[data-ui-action="select"]', e => {
                e.preventDefault();

                const value = dom.getDataset(e.currentTarget, 'uiValue');
                dom.setValue(this._node, value);
                dom.triggerEvent(this._node, 'change');
                this.hide();
                dom.focus(this._node);
            });

            dom.addEventDelegate(this._itemsList, 'mouseover.ui.autocomplete', '[data-ui-action="select"]', DOM.debounce(e => {
                const focusedNode = dom.find('[data-ui-focus]', this._itemsList);
                dom.removeClass(focusedNode, this.constructor.classes.focus);
                dom.removeDataset(focusedNode, 'uiFocus');
                dom.addClass(e.currentTarget, this.constructor.classes.focus);
                dom.setDataset(e.currentTarget, 'uiFocus', true);
            }));

            dom.addEvent(this._node, 'keydown.ui.autocomplete', e => {
                if (!['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(e.code)) {
                    return;
                }

                if (e.code === 'Escape') {
                    // close the menu
                    dom.blur(this._node);

                    return;
                }

                const focusedNode = dom.findOne('[data-ui-focus]', this._itemsList);

                if (e.code === 'Enter') {
                    // select the focused item
                    if (focusedNode) {
                        const value = dom.getDataset(focusedNode, 'uiValue');
                        dom.setValue(this._node, value);
                        dom.triggerEvent(this._node, 'change');
                        this.hide();
                    }

                    return;
                }

                e.preventDefault();

                if (!dom.isConnected(this._menuNode)) {
                    this.show();

                    return;
                }

                // focus the previous/next item

                let focusNode;
                if (!focusedNode) {
                    focusNode = dom.findOne('[data-ui-action="select"]', this._itemsList);
                } else {
                    switch (e.code) {
                        case 'ArrowDown':
                            focusNode = dom.nextAll(focusedNode, '[data-ui-action="select"]').shift();
                            break;
                        case 'ArrowUp':
                            focusNode = dom.prevAll(focusedNode, '[data-ui-action="select"]').pop();
                            break;
                    }
                }

                if (focusNode) {
                    dom.removeClass(focusedNode, this.constructor.classes.focus);
                    dom.removeDataset(focusedNode, 'uiFocus');
                    dom.addClass(focusNode, this.constructor.classes.focus);
                    dom.setDataset(focusNode, 'uiFocus', true);
                }
            });

            // debounced input event
            const getDataDebounced = Core.debounce(term => {
                // check for minimum length
                if (this._settings.minLength && term.length < this._settings.minLength) {
                    dom.hide(this._menuNode);
                    return;
                }

                dom.empty(this._itemsList);

                if (dom.isConnected(this._menuNode)) {
                    this._getData({ term });
                } else {
                    this.show();
                }
            }, this._settings.debounceInput);

            dom.addEvent(this._node, 'input.ui.autocomplete', DOM.debounce(_ => {
                const term = dom.getValue(this._node);

                getDataDebounced(term);
            }));

            if (this._settings.getResults) {
                // infinite scrolling event
                dom.addEvent(this._itemsList, 'scroll.ui.autocomplete', Core.throttle(_ => {
                    if (this._request || !this._showMore) {
                        return;
                    }

                    const height = dom.height(this._itemsList);
                    const scrollHeight = dom.height(this._itemsList, DOM.SCROLL_BOX);
                    const scrollTop = dom.getScrollY(this._itemsList);

                    if (scrollTop >= scrollHeight - height - (height / 4)) {
                        const term = dom.getValue(this._node);
                        const offset = this._data.length;

                        this._getData({ term, offset });
                    }
                }, 250, false));
            }

            dom.addEvent(this._node, 'blur.ui.autocomplete', _ => {
                this.hide();
            });

            dom.addEvent(this._node, 'keydown.ui.autocomplete', e => {
                if (!/^.$/u.test(e.key)) {
                    return;
                }

                this.show();
            });
        }

    });


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


    /**
     * Autocomplete Render
     */

    Object.assign(Autocomplete.prototype, {

        /**
         * Render the toggle element.
         */
        _render() {
            this._menuNode = dom.create('div', {
                class: this.constructor.classes.menu
            });

            this._itemsList = dom.create('div', {
                class: this.constructor.classes.items
            });
            dom.append(this._menuNode, this._itemsList);

            const popperOptions = {
                reference: this._node,
                placement: this._settings.placement,
                position: this._settings.position,
                fixed: this._settings.fixed,
                spacing: this._settings.spacing,
                minContact: this._settings.minContact
            };

            if (this._settings.fullWidth) {
                popperOptions.afterUpdate = (node, reference) => {
                    const width = dom.width(reference, DOM.BORDER_BOX);
                    dom.setStyle(node, 'width', width);
                };
                popperOptions.beforeUpdate = node => {
                    dom.setStyle(node, 'width', '');
                };
            }

            this._popper = new UI.Popper(this._menuNode, popperOptions);
        },

        /**
         * Render an item.
         * @param {object} value The value to render.
         * @returns {HTMLElement} The item element.
         */
        _renderItem(value) {
            const active = dom.getValue(this._node) === value;

            const element = dom.create('div', {
                html: this._settings.sanitize(
                    this._settings.renderResult(value, active)
                ),
                class: this.constructor.classes.item,
                dataset: {
                    uiAction: 'select',
                    uiValue: value
                }
            });

            if (active) {
                dom.addClass(element, this.constructor.classes.active);
                // dom.setDataset(element, 'uiActive', true);
            }

            return element;
        },

        /**
         * Render results.
         * @param {array} results The results to render.
         */
        _renderResults(results) {
            if (!results.length) {
                dom.hide(this._menuNode);
                return;
            }

            dom.show(this._menuNode);

            for (const item of results) {
                const element = this._renderItem(item);
                dom.append(this._itemsList, element);
            }

            let focusNode = dom.findOne('[data-ui-active]', this._itemsList);

            if (!focusNode) {
                focusNode = dom.findOne('[data-ui-action="select"]', this._itemsList);
            }

            if (focusNode) {
                dom.addClass(focusNode, this.constructor.classes.focus);
                dom.setDataset(focusNode, 'uiFocus', true);
            }
        }

    });


    // Autocomplete default options
    Autocomplete.defaults = {
        data: null,
        getResults: null,
        isMatch: (value, term) => {
            const normalized = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const escapedTerm = Core.escapeRegExp(term);
            const regExp = new RegExp(escapedTerm, 'i');

            return regExp.test(value) || regExp.test(normalized);
        },
        renderResult: value => value,
        sanitize: input => dom.sanitize(input),
        sortResults: (results, term) => results.sort((a, b) => {
            const aLower = a.toLowerCase();
            const bLower = b.toLowerCase();

            if (term) {
                const diff = aLower.indexOf(term) - bLower.indexOf(term);

                if (diff) {
                    return diff;
                }
            }

            return aLower.localeCompare(bLower);
        }),
        minLength: 1,
        debounceInput: 250,
        duration: 100,
        appendTo: null,
        fullWidth: false,
        placement: 'bottom',
        position: 'start',
        fixed: false,
        spacing: 0,
        minContact: false
    };

    // Default classes
    Autocomplete.classes = {
        active: 'autocomplete-active',
        focus: 'autocomplete-focus',
        item: 'autocomplete-item',
        items: 'autocomplete-items',
        menu: 'autocomplete-menu shadow-sm'
    };

    UI.initComponent('autocomplete', Autocomplete);

    UI.Autocomplete = Autocomplete;

});