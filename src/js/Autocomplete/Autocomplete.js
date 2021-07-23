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

        dom.removeEvent(this._node, 'keydown.ui.autocomplete');
        dom.removeEvent(this._node, 'keyup.ui.autocomplete');
        dom.removeEvent(this._node, 'input.ui.autocomplete');
        dom.removeEvent(this._node, 'blur.ui.autocomplete');
        dom.remove(this._menuNode);

        this._menuNode = null;
        this._itemsList = null;
        this._data = null;
        this._value = null;
        this._request = null;
        this._popperOptions = null;
        this._getData = null;
        this._getResults = null;

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
            this._popper.dispose();
            this._popper = null;

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
            dom.append(this._settings.appendTo, this._menuNode);
        } else {
            dom.after(this._node, this._menuNode);
        }

        this._popper = new UI.Popper(this._menuNode, this._popperOptions);

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
        if (this._popper) {
            this._popper.update();
        }

        return this;
    }

}
