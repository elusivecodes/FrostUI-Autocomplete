const path = require('path');
const fs = require('fs');
const filepath = require('filepath');
const terser = require('terser');
const less = require('less');
const cssmin = require('cssmin');

const srcFolder = 'src';
const distFolder = 'dist';

const name = 'frost-ui-autocomplete';

// create dist folder if it doesn't exist
if (!fs.existsSync(distFolder)) {
    fs.mkdirSync(distFolder);
}

// load files and wrapper
let wrapper;
const files = [];

filepath.create(srcFolder).recurse(fullPath => {
    if (!fullPath.isFile()) {
        return;
    }

    if (path.extname(fullPath.path) === '.js') {
        const fileName = path.basename(fullPath.path, '.js');
        const data = fs.readFileSync(fullPath.path, 'utf8');

        if (fileName === 'wrapper') {
            wrapper = data;
        } else {
            files.push(data);
        }
    }
});

// inject code to wrapper
const code = wrapper.replace(
    '    // {{code}}',
    files.join('\r\n\r\n')
        .replace(
            /^(?!\s*$)/mg,
            ' '.repeat(4)
        )
);

// minify
const minified = terser.minify(code, {
    ecma: 8,
    compress: {
        ecma: 8
    }
});

// write files
if (minified.error) {
    console.error(minified.error);
} else {
    fs.writeFileSync(
        path.join(distFolder, name + '.js'),
        code
    );

    fs.writeFileSync(
        path.join(distFolder, name + '.min.js'),
        minified.code
    );
}

// css
less.render(
    fs.readFileSync(
        path.join(srcFolder, 'less/wrapper.less')
    ).toString(),
    {
        optimization: 1,
        paths: [path.join(srcFolder, 'less/')]
    }
).then(result => {
    fs.writeFileSync(
        path.join(distFolder, name + '.css'),
        result.css
    );

    fs.writeFileSync(
        path.join(distFolder, name + '.min.css'),
        cssmin(result.css)
    );
}).catch(console.error);