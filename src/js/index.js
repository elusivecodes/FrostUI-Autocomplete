import $ from '@fr0st/query';
import { initComponent } from '@fr0st/ui';
import Autocomplete from './autocomplete.js';
import { _getDataInit, _getResultsInit } from './prototype/data.js';
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
initComponent('autocomplete', Autocomplete);

export default Autocomplete;
