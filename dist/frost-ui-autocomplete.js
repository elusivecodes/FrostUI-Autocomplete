(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@fr0st/query'), require('@fr0st/ui')) :
    typeof define === 'function' && define.amd ? define(['exports', '@fr0st/query', '@fr0st/ui'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.UI = global.UI || {}, global.fQuery, global.UI));
})(this, (function (exports, $, ui) { 'use strict';

    /**
     * Autocomplete Class
     * @class
     */
    class Autocomplete extends ui.BaseComponent {
        /**
         * New Autocomplete constructor.
         * @param {HTMLElement} node The input node.
         * @param {object} [options] The options to create the Autocomplete with.
         */
        constructor(node, options) {
            super(node, options);

            this._data = [];
            this._activeItems = [];

            this._getData = null;
            this._getResults = null;

            if (this._options.getResults) {
                this._getResultsInit();
            } else if (this._options.data) {
                this._data = this._options.data;
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

            $.remove(this._menuNode);
            $.removeEvent(this._node, 'keydown.ui.autocomplete');
            $.removeEvent(this._node, 'input.ui.autocomplete');
            $.removeEvent(this._node, 'blur.ui.autocomplete');
            $.removeAttribute(this._node, 'role');
            $.removeAttribute(this._node, 'aria-controls');
            $.removeAttribute(this._node, 'aria-autocomplete');
            $.removeAttribute(this._node, 'aria-expanded');
            $.removeAttribute(this._node, 'aria-activedescendent');

            this._menuNode = null;
            this._loader = null;
            this._error = null;
            this._data = null;
            this._activeItems = null;
            this._value = null;
            this._requests = null;
            this._popperOptions = null;
            this._getData = null;

            super.dispose();
        }

        /**
         * Hide the Autocomplete.
         */
        hide() {
            if (
                !$.isConnected(this._menuNode) ||
                $.getDataset(this._menuNode, 'uiAnimating') ||
                !$.triggerOne(this._node, 'hide.ui.autocomplete')
            ) {
                return;
            }

            $.setDataset(this._menuNode, { uiAnimating: 'out' });

            $.fadeOut(this._menuNode, {
                duration: this._options.duration,
            }).then((_) => {
                this._popper.dispose();
                this._popper = null;

                this._activeItems = [];
                $.empty(this._menuNode);
                $.detach(this._menuNode);
                $.removeDataset(this._menuNode, 'uiAnimating');
                $.setAttribute(this._node, {
                    'aria-expanded': false,
                    'aria-activedescendent': '',
                });
                $.triggerEvent(this._node, 'hidden.ui.autocomplete');
            }).catch((_) => {
                if ($.getDataset(this._menuNode, 'uiAnimating') === 'out') {
                    $.removeDataset(this._menuNode, 'uiAnimating');
                }
            });
        }

        /**
         * Show the Autocomplete.
         */
        show() {
            if (
                $.is(this._node, ':disabled') ||
                $.hasAttribute(this._node, 'readonly') ||
                $.isConnected(this._menuNode) ||
                $.getDataset(this._menuNode, 'uiAnimating') ||
                !$.triggerOne(this._node, 'show.ui.autocomplete')
            ) {
                return;
            }

            const term = $.getValue(this._node);
            this._getData({ term });

            $.setDataset(this._menuNode, { uiAnimating: 'in' });

            if (this._options.appendTo) {
                $.append(this._options.appendTo, this._menuNode);
            } else {
                $.after(this._node, this._menuNode);
            }

            this._popper = new ui.Popper(this._menuNode, this._popperOptions);

            $.fadeIn(this._menuNode, {
                duration: this._options.duration,
            }).then((_) => {
                $.removeDataset(this._menuNode, 'uiAnimating');
                $.setAttribute(this._node, { 'aria-expanded': true });
                $.triggerEvent(this._node, 'shown.ui.autocomplete');
            }).catch((_) => {
                if ($.getDataset(this._menuNode, 'uiAnimating') === 'in') {
                    $.removeDataset(this._menuNode, 'uiAnimating');
                }
            });
        }

        /**
         * Toggle the Autocomplete.
         */
        toggle() {
            if ($.isConnected(this._menuNode)) {
                this.hide();
            } else {
                this.show();
            }
        }

        /**
         * Update the Autocomplete position.
         */
        update() {
            if (this._popper) {
                this._popper.update();
            }
        }
    }

    /**
     * Initialize preloaded get data.
     */
    function _getDataInit() {
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
    }
    /**
     * Initialize get data from callback.
     */
    function _getResultsInit() {
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
    }

    /**
     * Attach events for the Autocomplete.
     */
    function _events() {
        $.addEventDelegate(this._menuNode, 'contextmenu.ui.autocomplete', '[data-ui-action="select"]', (e) => {
            // prevent menu node from showing right click menu
            e.preventDefault();
        });

        $.addEventDelegate(this._menuNode, 'mousedown.ui.autocomplete', '[data-ui-action="select"]', (e) => {
            // prevent selection from triggering blur event
            e.preventDefault();
        });

        $.addEvent(this._node, 'blur.ui.autocomplete', (_) => {
            if ($.isSame(this._node, document.activeElement)) {
                return;
            }

            $.stop(this._menuNode);
            $.removeDataset(this._menuNode, 'uiAnimating');

            this.hide();
        });

        $.addEventDelegate(this._menuNode, 'click.ui.autocomplete', '[data-ui-action="select"]', (e) => {
            e.preventDefault();

            const value = $.getDataset(e.currentTarget, 'uiValue');

            if (value !== $.getValue(this._node)) {
                $.setValue(this._node, value);
                $.triggerEvent(this._node, 'change.ui.autocomplete');
            }

            this.hide();
            $.focus(this._node);
        });

        $.addEventDelegate(this._menuNode, 'mouseover.ui.autocomplete', '[data-ui-action="select"]', $.debounce((e) => {
            const focusedNode = $.findOne('[data-ui-focus]', this._menuNode);
            $.removeClass(focusedNode, this.constructor.classes.focus);
            $.removeDataset(focusedNode, 'uiFocus');

            $.addClass(e.currentTarget, this.constructor.classes.focus);
            $.setDataset(e.currentTarget, { uiFocus: true });

            const id = $.getAttribute(e.currentTarget, 'id');
            $.setAttribute(this._node, { 'aria-activedescendent': id });
        }));

        $.addEvent(this._node, 'input.ui.autocomplete', $.debounce((_) => {
            if (!$.isConnected(this._menuNode)) {
                this.show();
            } else {
                const term = $.getValue(this._node);
                this._getData({ term });
            }
        }));

        $.addEvent(this._node, 'keydown.ui.autocomplete', (e) => {
            if (!['ArrowDown', 'ArrowUp', 'Enter', 'Escape', 'NumpadEnter'].includes(e.code)) {
                return;
            }

            const focusedNode = $.findOne('[data-ui-focus]', this._menuNode);

            switch (e.code) {
                case 'Enter':
                case 'NumpadEnter':
                    // select the focused item
                    if (focusedNode) {
                        const value = $.getDataset(focusedNode, 'uiValue');

                        if (value !== $.getValue(this._node)) {
                            $.setValue(this._node, value);
                            $.triggerEvent(this._node, 'change.ui.autocomplete');
                        }

                        this.hide();
                    }

                    return;
                case 'Escape':
                    if ($.isConnected(this._menuNode)) {
                        // prevent node from closing modal
                        e.stopPropagation();

                        this.hide();
                    }

                    return;
            }

            e.preventDefault();

            if (!$.isConnected(this._menuNode)) {
                this.show();
                return;
            }

            // focus the previous/next item

            let focusNode;
            if (!focusedNode) {
                focusNode = this._activeItems[0];
            } else {
                let focusIndex = this._activeItems.indexOf(focusedNode);

                switch (e.code) {
                    case 'ArrowDown':
                        focusIndex++;
                        break;
                    case 'ArrowUp':
                        focusIndex--;
                        break;
                }

                focusNode = this._activeItems[focusIndex];
            }

            if (!focusedNode && !focusNode && !this._request) {
                const term = $.getValue(this._node);
                this._getData({ term });
                return;
            }

            if (!focusNode) {
                return;
            }

            $.removeClass(focusedNode, this.constructor.classes.focus);
            $.removeDataset(focusedNode, 'uiFocus');
            $.addClass(focusNode, this.constructor.classes.focus);
            $.setDataset(focusNode, { uiFocus: true });

            const id = $.getAttribute(focusNode, 'id');
            $.setAttribute(this._node, { 'aria-activedescendent': id });

            const itemsScrollY = $.getScrollY(this._menuNode);
            const itemsRect = $.rect(this._menuNode, { offset: true });
            const nodeRect = $.rect(focusNode, { offset: true });

            if (nodeRect.top < itemsRect.top) {
                $.setScrollY(this._menuNode, itemsScrollY + nodeRect.top - itemsRect.top);
            } else if (nodeRect.bottom > itemsRect.bottom) {
                $.setScrollY(this._menuNode, itemsScrollY + nodeRect.bottom - itemsRect.bottom);
            }
        });

        if (this._options.getResults) {
            // infinite scrolling event
            $.addEvent(this._menuNode, 'scroll.ui.autocomplete', $._throttle((_) => {
                if (this._loadingScroll || !this._showMore) {
                    return;
                }

                const height = $.height(this._menuNode);
                const scrollHeight = $.height(this._menuNode, { boxSize: $.SCROLL_BOX });
                const scrollTop = $.getScrollY(this._menuNode);

                if (scrollTop >= scrollHeight - height - (height / 4)) {
                    const term = $.getValue(this._node);
                    const offset = this._data.length;

                    this._loadingScroll = true;
                    this._getData({ term, offset });
                }
            }, 250, { leading: false }));
        }
    }

    /**
     * Render the toggle element.
     */
    function _render() {
        const id = ui.generateId('autocomplete');

        this._menuNode = $.create('ul', {
            class: this.constructor.classes.menu,
            style: { maxHeight: this._options.maxHeight },
            attributes: {
                id,
                role: 'listbox',
            },
        });

        if ($.is(this._node, '.input-sm')) {
            $.addClass(this._menuNode, this.constructor.classes.menuSmall);
        } else if ($.is(this._node, '.input-lg')) {
            $.addClass(this._menuNode, this.constructor.classes.menuLarge);
        }

        if (this._options.getResults) {
            this._loader = this._renderInfo(this._options.lang.loading);
            this._error = this._renderInfo(this._options.lang.error);
        }

        this._popperOptions = {
            reference: this._node,
            placement: this._options.placement,
            position: this._options.position,
            fixed: this._options.fixed,
            spacing: this._options.spacing,
            minContact: this._options.minContact,
        };

        if (this._options.fullWidth) {
            this._popperOptions.beforeUpdate = (node) => {
                $.setStyle(node, { width: '' });
            };

            this._popperOptions.afterUpdate = (node, reference) => {
                const width = $.width(reference, { boxSize: $.BORDER_BOX });
                $.setStyle(node, { width: `${width}px` });
            };
        }

        $.setAttribute(this._node, {
            'role': 'combobox',
            'aria-controls': id,
            'aria-autocomplete': 'list',
            'aria-expanded': false,
            'aria-activedescendent': '',
        });
    }
    /**
     * Render an information item.
     * @param {string} text The text to render.
     * @return {HTMLElement} The information item.
     */
    function _renderInfo(text) {
        const element = $.create('div', {
            html: this._options.sanitize(text),
            class: this.constructor.classes.info,
        });

        return element;
    }
    /**
     * Render an item.
     * @param {string} value The value to render.
     * @return {HTMLElement} The item element.
     */
    function _renderItem(value) {
        const id = ui.generateId('autocomplete-item');

        const active = $.getValue(this._node) == value;

        const element = $.create('li', {
            class: this.constructor.classes.item,
            attributes: {
                id,
                'role': 'option',
                'aria-label': value,
                'aria-selected': active,
            },
            dataset: {
                uiAction: 'select',
                uiValue: value,
            },
        });

        this._activeItems.push(element);

        if (active) {
            $.addClass(element, this.constructor.classes.active);
        }

        const content = this._options.renderResult.bind(this)(value, element);

        if ($._isString(content)) {
            $.setHTML(element, this._options.sanitize(content));
        } else if ($._isElement(content) && !$.isSame(element, content)) {
            $.append(element, content);
        }

        return element;
    }
    /**
     * Render results.
     * @param {array} results The results to render.
     */
    function _renderResults(results) {
        $.show(this._menuNode);

        for (const value of results) {
            const element = this._renderItem(value);
            $.append(this._menuNode, element);
        }

        if (!$.hasChildren(this._menuNode)) {
            $.hide(this._menuNode);
            return;
        }

        const focusedNode = $.findOne('[data-ui-focus]', this._menuNode);

        if (!focusedNode && this._activeItems.length) {
            const element = this._activeItems[0];
            $.addClass(element, this.constructor.classes.focus);
            $.setDataset(element, { uiFocus: true });

            const id = $.getAttribute(element, 'id');
            $.setAttribute(this._node, { 'aria-activedescendent': id });
        }
    }

    // Autocomplete default options
    Autocomplete.defaults = {
        lang: {
            error: 'Error loading data.',
            loading: 'Loading..',
        },
        data: null,
        getResults: null,
        renderResult: (value) => value,
        sanitize: (input) => $.sanitize(input),
        isMatch(value, term) {
            const escapedTerm = $._escapeRegExp(term);
            const regExp = new RegExp(escapedTerm, 'i');

            if (regExp.test(value)) {
                return true;
            }

            const normalized = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

            return regExp.test(normalized);
        },
        sortResults(a, b, term) {
            const aLower = a.toLowerCase();
            const bLower = b.toLowerCase();

            if (term) {
                const diff = aLower.indexOf(term) - bLower.indexOf(term);

                if (diff) {
                    return diff;
                }
            }

            return aLower.localeCompare(bLower);
        },
        minSearch: 1,
        debounce: 250,
        duration: 100,
        maxHeight: '250px',
        menuSize: null,
        appendTo: null,
        fullWidth: false,
        placement: 'bottom',
        position: 'start',
        fixed: false,
        spacing: 0,
        minContact: false,
    };

    // Default classes
    Autocomplete.classes = {
        active: 'active',
        focus: 'focus',
        info: 'autocomplete-item text-body-secondary',
        item: 'autocomplete-item',
        menu: 'autocomplete-menu list-unstyled',
        menuSmall: 'autocomplete-menu-sm',
        menuLarge: 'autocomplete-menu-lg',
    };

    // Autocomplete prototype
    const proto = Autocomplete.prototype;

    proto._events = _events;
    proto._getDataInit = _getDataInit;
    proto._getResultsInit = _getResultsInit;
    proto._render = _render;
    proto._renderInfo = _renderInfo;
    proto._renderItem = _renderItem;
    proto._renderResults = _renderResults;

    // Autocomplete init
    ui.initComponent('autocomplete', Autocomplete);

    exports.Autocomplete = Autocomplete;

}));
//# sourceMappingURL=frost-ui-autocomplete.js.map
