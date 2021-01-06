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

        dom.addEventDelegate(this._itemsList, 'mouseup.ui.autocomplete', '[data-ui-action="select"]', e => {
            e.preventDefault();

            const value = dom.getDataset(e.currentTarget, 'uiValue');
            dom.setValue(this._node, value);
            dom.triggerEvent(this._node, 'change.ui.autocomplete');
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
                    dom.triggerEvent(this._node, 'change.ui.autocomplete');
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
