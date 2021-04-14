// Autocomplete default options
Autocomplete.defaults = {
    data: null,
    getResults: null,
    isMatch: (value, term) => {
        const normalized = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const escapedTerm = Core.escapeRegExp(term);
        const regExp = new RegExp(escapedTerm, 'i');

        return regExp.test(value) || regeExp.test(normalized);
    },
    renderResult: value => value,
    sanitize: input => dom.sanitize(input),
    sortResults: (results, term) => results.sort((a, b) => {
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();

        if (term) {
            const diff = aLower.indexOf(term) - bLower.indexOf(term);

            if (diff) {
                return diff;
            }
        }

        return aLower.localeCompare(bLower);
    }),
    minLength: 1,
    debounceInput: 250,
    duration: 100,
    appendTo: null,
    fullWidth: false,
    placement: 'bottom',
    position: 'start',
    fixed: false,
    spacing: 0,
    minContact: false
};

// Default classes
Autocomplete.classes = {
    active: 'autocomplete-active',
    focus: 'autocomplete-focus',
    item: 'autocomplete-item',
    items: 'autocomplete-items',
    menu: 'autocomplete-menu'
};

UI.initComponent('autocomplete', Autocomplete);

UI.Autocomplete = Autocomplete;
