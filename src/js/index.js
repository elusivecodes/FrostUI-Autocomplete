import $ from '@fr0st/query';
import { initComponent } from '@fr0st/ui';
import Autocomplete from './autocomplete.js';
import { _getDataInit, _getResultsCallbackInit, _getResultsInit } from './prototype/data.js';
import { _events } from './prototype/events.js';
import { _render, _renderInfo, _renderItem, _renderResults } from './prototype/render.js';

// Autocomplete default options
Autocomplete.defaults = {
    lang: {
        error: 'Error loading data.',
        loading: 'Loading..',
    },
    data: null,
    getResults: null,
    getValue: (value) => $._isString(value) ?
        value :
        value.text,
    renderResult(data) {
        return this._options.getValue(data);
    },
    sanitize: (input) => $.sanitize(input),
    isMatch(data, term) {
        const value = this._options.getValue(data);
        const escapedTerm = $._escapeRegExp(term);
        const regExp = new RegExp(escapedTerm, 'i');

        if (regExp.test(value)) {
            return true;
        }

        const normalized = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        return regExp.test(normalized);
    },
    sortResults(a, b, term) {
        const aLower = this._options.getValue(a).toLowerCase();
        const bLower = this._options.getValue(b).toLowerCase();

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
    items: 'autocomplete-items',
    menu: 'autocomplete-menu',
};

// Autocomplete prototype
const proto = Autocomplete.prototype;

proto._events = _events;
proto._getDataInit = _getDataInit;
proto._getResultsCallbackInit = _getResultsCallbackInit;
proto._getResultsInit = _getResultsInit;
proto._render = _render;
proto._renderInfo = _renderInfo;
proto._renderItem = _renderItem;
proto._renderResults = _renderResults;

// Autocomplete init
initComponent('autocomplete', Autocomplete);

export default Autocomplete;
