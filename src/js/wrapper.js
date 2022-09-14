/**
 * FrostUI-Autocomplete v1.1.5
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
    const DOM = window.DOM;
    const dom = window.dom;
    const UI = window.UI;
    const document = window.document;

    // {{code}}
});