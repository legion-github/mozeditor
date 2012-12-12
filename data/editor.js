/* editor.js
 *
 * This file is part of mozeditor (Editor (ACE) embedded in browser)
 * Copyright (C) 2012  Alexey Gladkov <gladkov.alexey@gmail.com>
 *
 * This file is covered by the GNU General Public License,
 * which should be included with mozeditor as the file COPYING.
 */

var editor;
var newfile = false;

const DEFAULT_FILENAME = 'Buffer';
const STATUS_SAVED     = 'saved';
const STATUS_CHANGED   = 'changed';

var settings = {
	_mode:       'text',
	_keybinding: 'ace',
	_theme:      'twilight',
	_folding:    'manual',
	_softwrap:   'off',
	_fontsize:   '14px',

	_showInvisibles:  true,
	_showPrintMargin: true,
	_showGutter:      true,

	init: function (editor) {
		this._editor = editor;

		this._showInvisibles  = editor.getShowInvisibles();
		this._showGutter      = editor.renderer.getShowGutter();
		this._showPrintMargin = editor.renderer.getShowPrintMargin();

		settings.mode(this._mode);
		settings.keybinding(this._keybinding);
		settings.theme(this._theme);
		settings.folding(this._folding);
		settings.softwrap(this._softwrap);
		settings.fontsize(this._fontsize);
		settings.showInvisibles(this._showInvisibles);
		settings.showGutter(this._showGutter);
		settings.showPrintMargin(this._showPrintMargin);

		$('#controlbar').on('click', function (e) {
			$('#settings').toggleClass('hidden');
		});
	},
	_update_select: function (id, arg) {
		$(id + ' > option').each(function (k,v) {
			if (v.value == arg) {
				v.selected = 'selected';
				return false;
			}
			return true;
		});
	},
	_update_checkbox: function (id, arg) {
		(arg)
			? $(id).attr('checked', 'checked')
			: $('#showhidden').removeAttr('checked');
	},
	showInvisibles: function (arg) {
		if (arg === undefined)
			return this._showInvisibles;
		this._showInvisibles = (arg === true);
		this._editor.setShowInvisibles(this._showInvisibles);
		this._update_checkbox('#showhidden', this._showInvisibles);
	},
	showGutter: function (arg) {
		if (arg === undefined)
			return this._showGutter;
		this._showGutter = (arg === true);
		this._editor.renderer.setShowGutter(this._showGutter);
		this._update_checkbox('#showgutter', this._showGutter);
	},
	showPrintMargin: function (arg) {
		if (arg === undefined)
			return this._showPrintMargin;
		this._showPrintMargin = (arg === true);
		this._editor.renderer.setShowPrintMargin(this._showPrintMargin);
		this._update_checkbox('#showmargin', this._showPrintMargin);
	},
	mode: function (arg) {
		if (arg === undefined)
			return this._mode;
		this._editor.session.setMode('ace/mode/' + arg);
		this._update_select('#highlight', arg);
		this._mode = arg;
	},
	keybinding: function (arg) {
		if (arg === undefined)
			return this._keybinding;
		this._editor.setDefaultHandler(arg);
		this._keybinding = arg;
	},
	theme: function (arg) {
		if (arg === undefined)
			return this._theme;
		this._editor.setTheme('ace/theme/' + arg);
		this._update_select('#theme', arg);
		this._theme = arg;
	},
	folding: function (arg) {
		if (arg === undefined)
			return this._folding;
		this._editor.session.setFoldStyle(arg);
		this._update_select('#folding', arg);
		this._folding = arg;
	},
	softwrap: function (arg) {
		if (arg === undefined)
			return this._softwrap;
		switch (arg) {
			case "off":
				this._editor.session.setUseWrapMode(false);
				this._editor.renderer.setPrintMarginColumn(80);
				break;
			case "free":
				this._editor.session.setUseWrapMode(true);
				this._editor.session.setWrapLimitRange(null, null);
				this._editor.renderer.setPrintMarginColumn(80);
				break;
			default:
				this._editor.session.setUseWrapMode(true);
				var col = parseInt(arg, 10);
				this._editor.session.setWrapLimitRange(col, col);
				this._editor.renderer.setPrintMarginColumn(col);
		}
		this._update_select('#softwrap', arg);
		this._softwrap = arg;
	},
	fontsize: function (arg) {
		if (arg === undefined)
			return this._fontsize;
		this._editor.setFontSize(arg);
		this._update_select('#fontsize', arg);
		this._fontsize = arg;
	}
};

var statusbar = {
	_filename:   DEFAULT_FILENAME,
	_changed:    false,
	_mode:       'text',

	init: function () {
		$('#statusbar-filename').text(this._filename);
		$('#statusbar-changed').text(this._changed ? STATUS_CHANGED : STATUS_SAVED);
		$('#statusbar-mode').text(this._mode);
		$('#statusbar-keybinding').text(this._keybinding);
	},
	filename: function (name) {
		if (name === undefined)
			return this._filename;
		if (name === '') {
			this.changed(false);
			this._filename = DEFAULT_FILENAME;
		} else {
			this._filename = name;
		}
		$('#statusbar-filename').text(this._filename);
	},
	changed: function (state) {
		if (state === undefined)
			return this._changed;
		this._changed = state;
		$('#statusbar-changed').text(state ? STATUS_CHANGED : STATUS_SAVED);
	},
	mode: function (mode) {
		if (mode === undefined)
			return this._mode;
		this._mode = mode;
		$('#statusbar-mode').text(mode);
	}
};

var autosave = {
	_id: 0,
	start: function() {
		this._id = setInterval(function() {
			var filename = $('#filedata').attr('name');
			if (filename)
				storage.backup(filename);
		}, 3000);
		if (this._id !== 0)
			statusbar.changed(true);
		return true;
	},
	stop: function() {
		try {
			if (this._id !== 0)
				clearInterval(this._id);
		} catch(e) {
			alert(e);
		}
		statusbar.changed(false);
		return false;
	}
};

var storage = {
	has: function (key) {
		var items = localStorage.length;

		for (var i = 0; i < items; i++) {
			if (localStorage.key(i) == key)
				return true;
		}
		return false;
	},
	backup: function (filename) {
		try {
			localStorage.setItem(filename, JSON.stringify({
				name: filename,
				mime: $('#filedata').attr('mime'),
				data: editor.getValue()
			}));

		} catch (e) {
			alert("Storage error: " + e);
		}
	},
	restore: function (filename) {
		try {
			if (this.has(filename)) {
				var file = JSON.parse(localStorage.getItem(filename));

				editor.setValue(file.data);
				editor.gotoLine(0,0,false);
				editor.moveCursorTo(0,0);

				var mode = guessMode.check(file.mime);
				settings.mode(mode);

				// Update statusbar
				statusbar.filename(file.name);
				statusbar.mode(mode);

				$('#filedata').attr('name', file.name);
				$('#filedata').attr('mime', file.mime);

				autosave.start();
				changed = true;
				return true;
			}
		} catch (e) {
			alert("Storage error: " + e);
		}
		return false;
	},
	remove: function (key) {
		try {
			localStorage.removeItem(key);
		} catch (e) {
			alert("Storage error: " + e);
		}
	},
	get: function (key) {
		try {
			return (this.has(key))
				? JSON.parse(localStorage.getItem(key))
				: {};
		} catch (e) {
			alert("Storage error: " + e);
		}
		return {};
	},
	append: function (key, value, maxlen) {
		try {
			var list = (this.has(key))
				? JSON.parse(localStorage.getItem(key))
				: [];
			if (maxlen !== undefined) {
				if (list.length == maxlen)
					list.pop();
			}
			list.unshift(value);
			localStorage.setItem(key, JSON.stringify(list));
			return list;
		} catch (e) {
			alert("Storage error: " + e);
		}
	}
};

function send_event(name, arg)
{
	var event = new CustomEvent(name, {
		"detail": (arg !== undefined) ? arg : ''
	});
	$('#filedata').get(0).dispatchEvent(event);
}

function ISODateString(d){
	function pad(n) { return (n < 10) ? '0' + n : n }
	return d.getFullYear()+'-'
		+ pad(d.getMonth()+1)+'-'
		+ pad(d.getDate())+' '
		+ pad(d.getHours())+':'
		+ pad(d.getMinutes())+':'
		+ pad(d.getSeconds());
}

function save_file()
{
	try {
		$('#filedata').val(editor.getSession().getValue());
		send_event('send-save');
		autosave.stop();
		changed = false;
	} catch(e) { /* Ignore all */ }
}

function open_file(name, mime)
{
	if (storage.has(name)) {
		dialog_restore_file(name, mime);
		return;
	}
	send_event('send-open', {
		type: 'filedata',
		mime: mime,
		name: name
	});
}

function dialog_new_file()
{
	$('#dialog-new-filename').val($('#filedata').attr('name'));
	$('#dialog-new-file').dialog({
		autoOpen: true,
		resizable: true,
		width: 600,
		modal: true,
		buttons: {
			"Save": function() {
				var filename = $('#dialog-new-filename').val();

				if (filename) {
					$('#filedata').attr('name', filename);
					save_file();
					statusbar.filename(filename);
				}
				$(this).dialog("close");
			},
			Cancel: function() {
				$(this).dialog("close");
			}
		}
	});
}

function dialog_save_file()
{
	$('#dialog-save-filename').text($('#filedata').attr('name'));
	$("#dialog-save-file").dialog({
		autoOpen: true,
		resizable: true,
		width: 600,
		modal: true,
		buttons: {
			"Save": function() {
				if (statusbar.changed()) {
					save_file();
				}
				$(this).dialog("close");
			},
			Cancel: function() {
				$(this).dialog("close");
			}
		}
	});
}

function dialog_restore_file(filename, mimetype)
{
	$('#dialog-restore-filename').text(filename);
	$("#dialog-restore-file").dialog({
		autoOpen: true,
		resizable: true,
		width: 600,
		modal: true,
		buttons: {
			"Restore": function() {
				if (storage.restore(filename)) {
					statusbar.filename(filename);
				}
				$(this).dialog("close");
			},
			Cancel: function() {
				storage.remove(filename);
				send_event('send-open', {
					type: 'filedata',
					mime: mimetype,
					name: filename
				});
				$(this).dialog("close");
			}
		}
	});
}

function change_settings(obj)
{
	switch (obj.name) {
		case 'open':
			send_event('send-open', {
				type: 'filename',
				name: '',
				mime: '',
			});
			break;
		case 'close':
			newfile = true;
			editor.setValue('');
			editor.gotoLine(0,0,false);
			$('#filedata').attr('name', '');
			statusbar.filename('');
			newfile = false;
			break;
		case 'save':
			dialog_save_file();
			break;
		case 'save-as':
			dialog_new_file();
			break;

		case 'undo':
			editor.undo();
			break;
		case 'redo':
			editor.redo();
			break;
		case 'uppercase':
			editor.toUpperCase();
			break;
		case 'lowercase':
			editor.toLowerCase();
			break;
		case 'goto':
			var line = parseInt(prompt("Enter line number:"), 10);
			if (!isNaN(line)) {
				editor.gotoLine(line);
			}
			break;

		case 'theme':
			settings.theme(obj.value);
			statusbar.theme(obj.value);
			break;
		case 'highlight':
			settings.mode(obj.value);
			statusbar.mode(obj.value);
			break;
		case 'keybinding':
			settings.keybinding(obj.value);
			statusbar.keybinding(obj.value);
			break;

		case 'folding':
			settings.folding(obj.value);
			break;
		case 'showhidden':
			setttings.showInvisibles(obj.checked === true);
			break;
		case 'showgutter':
			settings.showGutter(obj.checked === true);
			break;
		case 'showmargin':
			settings.showPrintMargin(obj.checked === true);
			break;
		case 'softwrap':
			settings.softwrap(obj.value);
			break;
		case 'fontsize':
			settings.fontsize(obj.value);
			break;
	}
}

function reopen(doc)
{
	var elem = $(doc);
	open_file(elem.text(), elem.attr('mime'));
}

function handleOpenFile(evt)
{
	if (evt.detail.type == 'filename') {
		open_file(evt.detail.name, evt.detail.mime);
		return;
	}

	// Stop looking on previous file.
	autosave.stop();
	statusbar.changed(false);

	// Set new file.
	newfile = true;
	editor.setValue($('#filedata').val());
	editor.gotoLine(0,0,false);
	editor.moveCursorTo(0,0);
	newfile = false;

	var newmime = $('#filedata').attr('mime');
	var newmode = guessMode.check(newmime);
	settings.mode(newmode);

	// Update statusbar
	statusbar.filename($('#filedata').attr('name'));
	statusbar.mode(newmode);
try {
	// Update history
	var recently_opened = storage.get('recently-opened');
	var found = false;

	for (var i = 0; i < recently_opened.length; i++) {
		if (recently_opened[i].name == $('#filedata').attr('name')) {
			found = true;
			break;
		}
	}

	if (!found) {
		var d = new Date();
		var list = storage.append('recently-opened', {
			name: $('#filedata').attr('name'),
			mime: $('#filedata').attr('mime'),
			date: ISODateString(d)
		}, 10);

		$('#recently-opened').empty();
		$.each(list, function (i,v) {
			$('#recently-opened').append(
				'<tr>'+
				'<td><a class="ui-button" mime="'+ v.mime +'" onclick="reopen(this)">'+ v.name +'</a></td>'+
				'<td>' + v.date + '</td>'+
				'</tr>');
		});
	}
} catch(e) { alert(e); }
}

function main()
{
	$("#tabs").tabs({ heightStyle: "fill" });

	$.each(storage.get('recently-opened'), function (i,v) {
		$('#recently-opened').append(
			'<tr>'+
			'<td><a class="ui-button" mime="'+ v.mime +'" onclick="reopen(this)">'+ v.name +'</a></td>'+
			'<td>' + v.date + '</td>'+
			'</tr>');
	});

	/*
	 * Create editor
	 */
	window.__editor__ = editor = ace.edit('editor');
	editor.resize();

	/*
	 * Setup helpers
	 */
	statusbar.init();
	settings.init(editor);

	/*
	 * Set addon handler
	 */
	$('#filedata').get(0).addEventListener('recv-open', handleOpenFile);

	/*
	 * Autosave block
	 */
	editor.on('change', function(e) {
		// e - Contains a single property, data, which has the delta of changes.
		if (statusbar.changed() || newfile)
			return;
		autosave.start();
		statusbar.changed(true);
	});
}
