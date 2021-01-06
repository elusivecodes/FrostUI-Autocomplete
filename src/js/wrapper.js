/**
 * FrostUI-Autocomplete v1.0
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

    // {{code}}
});