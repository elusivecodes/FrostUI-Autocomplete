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
