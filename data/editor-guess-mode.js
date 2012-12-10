/* editor-guess-mode.js
 *
 * This file is part of mozeditor (Editor (ACE) embedded in browser)
 * Copyright (C) 2012  Alexey Gladkov <gladkov.alexey@gmail.com>
 *
 * This file is covered by the GNU General Public License,
 * which should be included with mozeditor as the file COPYING.
 */

(function (guessMode, undefined) {
	var default_mode = 'text';
	var mimetypes = [
		{
			mode: 'c_cpp',
			mime: [ 'text/x-csrc', 'text/x-c++src', 'text/x-chdr', 'text/x-c++hdr' ]
		},{
			mode: 'css',
			mime: [ 'text/css' ],
		},{
			mode: 'html',
			mime: [ 'text/html' ]
		},{
			mode: 'java',
			mime: [ 'text/x-java' ]
		},{
			mode: 'javascript',
			mime: [ 'application/javascript' ]
		},{
			mode: 'diff',
			mime: [ 'text/x-patch' ]
		},{
			mode: 'lisp',
			mime: [ 'text/x-scheme' ]
		},{
			mode: 'php',
			mime: [ 'application/x-php' ]
		},{
			mode: 'python',
			mime: [ 'text/x-python' ]
		},{
			mode: 'ruby',
			mime: [ 'application/x-ruby' ]
		},{
			mode: 'sh',
			mime: [ 'application/x-shellscript' ]
		},{
			mode: 'tex',
			mime: [ 'text/x-texinfo' ]
		},{
			mode: 'xml',
			mime: [ 'text/xml' ]
		}
	];

	guessMode.check = function(name) {
		for(var i = 0; i < mimetypes.length; i++) {
			if (mimetypes[i].mime.indexOf(name) != -1)
				return mimetypes[i].mode;
		}
		return default_mode;
	};
}(window.guessMode = window.guessMode || {}));
