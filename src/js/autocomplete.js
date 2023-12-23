import $ from '@fr0st/query';
import { BaseComponent, Popper } from '@fr0st/ui';

/**
 * Autocomplete Class
 * @class
 */
export default class Autocomplete extends BaseComponent {
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

        this._popper = new Popper(this._menuNode, this._popperOptions);

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
