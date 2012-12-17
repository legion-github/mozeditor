/* editor-guess-mode.js
 *
 * This file is part of mozeditor (Editor (ACE) embedded in browser)
 * Copyright (C) 2012  Alexey Gladkov <gladkov.alexey@gmail.com>
 *
 * This file is covered by the GNU General Public License,
 * which should be included with mozeditor as the file COPYING.
 */

const DEFAULT_FILENAME = 'Buffer';
const STATUS_SAVED     = 'saved';
const STATUS_CHANGED   = 'changed';

(function (editorStatusbar, undefined) {
	var params = {
		filename: { value: DEFAULT_FILENAME, handle: function(a) { editorStatusbar.filename(a) } },
		changed:  { value: false,            handle: function(a) { editorStatusbar.changed(a) }  },
		mode:     { value: 'text',           handle: function(a) { editorStatusbar.mode(a) }     }
	};

	editorStatusbar.init = function () {
		editorStatusbar.filename('');
		editorStatusbar.changed(false);
		editorStatusbar.mode('text');
	};

	editorStatusbar.update = function (obj) {
		for (var prop in params) {
			if (prop in obj) {
				params[prop]['handle'](obj[prop]);
			}
		}
	};

	editorStatusbar.changed = function (state) {
		if (state === undefined)
			return params.changed.value;
		params.changed.value = state;
		$('#statusbar-changed').text(state ? STATUS_CHANGED : STATUS_SAVED);
	};

	editorStatusbar.mode = function (mode) {
		if (mode === undefined)
			return params.mode.value;
		params.mode.value = mode;
		$('#statusbar-mode').text(mode);
	};

	editorStatusbar.filename = function (name) {
		if (name === undefined)
			return params.filename.value;
		if (name === '') {
			editorStatusbar.changed(false);
			params.filename.value = DEFAULT_FILENAME;
		} else {
			params.filename.value = name;
		}
		$('#statusbar-filename').text(params.filename.value);
	};

}(window.editorStatusbar = window.editorStatusbar || {}));
