import $ from '@fr0st/query';
import { generateId } from '@fr0st/ui';

/**
 * Render the toggle element.
 */
export function _render() {
    const id = generateId('autocomplete');

    this._menuNode = $.create('div', {
        class: this.constructor.classes.menu,
        style: { maxHeight: this._options.maxHeight },
        attributes: {
            id,
            role: 'listbox',
        },
    });

    if (this._options.getResults) {
        this._loader = $.create('div', {
            class: this.constructor.classes.item,
            html: this._options.sanitize(this._options.lang.loading),
        });

        this._error = $.create('div', {
            class: this.constructor.classes.item,
            text: this._options.sanitize(this._options.lang.error),
        });
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
};

/**
 * Render an item.
 * @param {string|object} data The data to render.
 * @return {HTMLElement} The item element.
 */
export function _renderItem(data) {
    const id = generateId('autocomplete-item');

    const value = this._options.getValue(data);

    const element = $.create('button', {
        class: this.constructor.classes.item,
        attributes: {
            id,
            type: 'button',
            role: 'option',
        },
        dataset: {
            uiAction: 'select',
            uiValue: value,
        },
    });

    if ($.getValue(this._node) === value) {
        $.addClass(element, this.constructor.classes.active);
    }

    const content = this._options.renderResult.bind(this)(data, element);

    if ($._isString(content)) {
        $.setHTML(element, this._options.sanitize(content));
    } else if ($._isElement(content) && !$.isSame(element, content)) {
        $.append(element, content);
    }

    return element;
};

/**
 * Render results.
 * @param {array} results The results to render.
 */
export function _renderResults(results) {
    if (!results.length) {
        $.hide(this._menuNode);
        return;
    }

    $.show(this._menuNode);

    for (const item of results) {
        const element = this._renderItem(item);
        $.append(this._menuNode, element);
    }

    const focusedNode = $.findOne('[data-ui-focus]', this._menuNode);

    if (focusedNode) {
        return;
    }

    let focusNode = $.findOne('[data-ui-active]', this._menuNode);

    if (!focusNode) {
        focusNode = $.findOne('[data-ui-action="select"]', this._menuNode);
    }

    if (focusNode) {
        $.addClass(focusNode, this.constructor.classes.focus);
        $.setDataset(focusNode, { uiFocus: true });

        const id = $.getAttribute(focusNode, 'id');
        $.setAttribute(this._node, { 'aria-activedescendent': id });
    }
};
