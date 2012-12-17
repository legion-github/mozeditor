/* editor-settings.js
 *
 * This file is part of mozeditor (Editor (ACE) embedded in browser)
 * Copyright (C) 2012  Alexey Gladkov <gladkov.alexey@gmail.com>
 *
 * This file is covered by the GNU General Public License,
 * which should be included with mozeditor as the file COPYING.
 */

(function (editorSettings, undefined) {
	var _editor;
	var params = {
		mode:       'text',
		keybinding: 'ace',
		theme:      'twilight',
		folding:    'manual',
		softwrap:   'off',
		fontsize:   '14px',
		tabSize:    4,

		showInvisibles:  true,
		showPrintMargin: true,
		showGutter:      true,
		softTab:         false
	};

	function _update_select(id, arg) {
		$(id + ' > option').each(function (k,v) {
			if (v.value == arg) {
				v.selected = 'selected';
				return false;
			}
			return true;
		});
	}

	function _update_checkbox(id, arg) {
		(arg)
			? $(id).attr('checked', 'checked')
			: $(id).removeAttr('checked');
	}

	editorSettings.init = function (editor) {
		_editor = editor;

		editorSettings.restore();

		editorSettings.mode(params.mode);
		editorSettings.keybinding(params.keybinding);
		editorSettings.theme(params.theme);
		editorSettings.folding(params.folding);
		editorSettings.softwrap(params.softwrap);
		editorSettings.fontsize(params.fontsize);
		editorSettings.showInvisibles(params.showInvisibles);
		editorSettings.showGutter(params.showGutter);
		editorSettings.showPrintMargin(params.showPrintMargin);
		editorSettings.softTab(params.softTab);
		editorSettings.tabSize(params.tabSize);
	}

	editorSettings.save = function () {
		editorStorage.set('settings', params);
	}

	editorSettings.restore = function () {
		var data = editorStorage.get('settings');
		for (var key in data) {
			if (key in params)
				params[key] = data[key];
		}
	}

	editorSettings.showInvisibles = function (arg) {
		if (arg === undefined)
			return params.showInvisibles;
		params.showInvisibles = arg;
		_editor.setShowInvisibles(params.showInvisibles);
		_update_checkbox('#showhidden', params.showInvisibles);
	}

	editorSettings.showGutter = function (arg) {
		if (arg === undefined)
			return params.showGutter;
		params.showGutter = arg;
		_editor.renderer.setShowGutter(params.showGutter);
		_update_checkbox('#showgutter', params.showGutter);
	}

	editorSettings.showPrintMargin = function (arg) {
		if (arg === undefined)
			return params.showPrintMargin;
		params.showPrintMargin = arg;
		_editor.renderer.setShowPrintMargin(params.showPrintMargin);
		_update_checkbox('#showmargin', params.showPrintMargin);
	}

	editorSettings.mode = function (arg) {
		if (arg === undefined)
			return params.mode;
		_editor.session.setMode('ace/mode/' + arg);
		_update_select('#mode', arg);
		params.mode = arg;
	}

	editorSettings.keybinding = function (arg) {
		if (arg === undefined)
			return params.keybinding;
		_editor.setDefaultHandler(arg);
		params.keybinding = arg;
	}

	editorSettings.theme = function (arg) {
		if (arg === undefined)
			return params.theme;
		_editor.setTheme('ace/theme/' + arg);
		_update_select('#theme', arg);
		params.theme = arg;
	}

	editorSettings.folding = function (arg) {
		if (arg === undefined)
			return params.folding;
		_editor.session.setFoldStyle(arg);
		_update_select('#folding', arg);
		params.folding = arg;
	}

	editorSettings.softwrap = function (arg) {
		if (arg === undefined)
			return params.softwrap;
		switch (arg) {
			case "off":
				_editor.session.setUseWrapMode(false);
				_editor.renderer.setPrintMarginColumn(80);
				break;
			case "free":
				_editor.session.setUseWrapMode(true);
				_editor.session.setWrapLimitRange(null, null);
				_editor.renderer.setPrintMarginColumn(80);
				break;
			default:
				_editor.session.setUseWrapMode(true);
				var col = parseInt(arg, 10);
				_editor.session.setWrapLimitRange(col, col);
				_editor.renderer.setPrintMarginColumn(col);
		}
		_update_select('#softwrap', arg);
		params.softwrap = arg;
	}

	editorSettings.fontsize = function (arg) {
		if (arg === undefined)
			return params.fontsize;
		_editor.setFontSize(arg);
		_update_select('#fontsize', arg);
		params.fontsize = arg;
	}

	editorSettings.softTab = function (arg) {
		if (arg === undefined)
			return params.softTab;
		params.softTab = arg;
		_editor.session.setUseSoftTabs(params.softTab);
		_update_checkbox('#softtab', params.softTab);
	}

	editorSettings.tabSize = function (arg) {
		if (arg === undefined)
			return params.tabSize;
		var n = parseInt(arg);
		_editor.session.setTabSize(n);
		$('#tabsize').val(n);
		params.tabSize = n;
	}

}(window.editorSettings = window.editorSettings || {}));
