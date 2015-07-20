/* global require, module */

var EmberAddon = require('ember-cli/lib/broccoli/ember-addon');
var fs = require('fs');

// TODO(azirbel): Use something more legit
function htmlEntities(str) {
	return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g,
		'&gt;').replace(/"/g, '&quot;');
}

var app = new EmberAddon({
	/*
	 * Replace patterns. We use this to replace strings such as:
	 * @@{controllers/file.js}
	 * With the content of those files.
	 */
	replace: {
		files: [
			'**/*.js'
		],
		patterns: [{
			match: /@@{[^}]*}/g,
			replacement: function (matchedText) {
				filename = matchedText.slice(3, -1);
				fullFilename = './tests/dummy/app/' + filename;
				fileContents = fs.readFileSync(fullFilename, 'utf8');
				return htmlEntities(fileContents).replace(/\n/g, '\\n');
			}
		}]
	}
});

app.import(app.bowerDirectory + '/d3/d3.js');

app.import({
	development: app.bowerDirectory + '/underscore/underscore.js',
	production: app.bowerDirectory + '/underscore/underscore.min.js'
}, {
	'underscore': [
		'default'
	]
});

module.exports = app.toTree();
