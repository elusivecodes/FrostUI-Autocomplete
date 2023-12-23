import $ from '@fr0st/query';

/**
 * Attach events for the Autocomplete.
 */
export function _events() {
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
};
