/* editor.js
 *
 * This file is part of mozeditor (Editor (ACE) embedded in browser)
 * Copyright (C) 2012  Alexey Gladkov <gladkov.alexey@gmail.com>
 *
 * This file is covered by the GNU General Public License,
 * which should be included with mozeditor as the file COPYING.
 */

var editor;

var autosave = {
	_id: 0,
	start: function() {
		this._id = setInterval(function() {
			var path = $('#filedata').attr('path');
			if (path)
				backup_file(path, true);
		}, 5000);
		return true;
	},
	stop: function() {
		try {
			if (this._id !== 0)
				clearInterval(this._id);
		} catch(e) {
			editorNotify.error({
				title:'Autosave error',
				text: e
			});
		}
		return false;
	}
};

function onEditorChange(e) {
	// e - Contains a single property, data, which has the delta of changes.
	editorStatusbar.changed(true);
	editor.removeListener('change', onEditorChange);
}

function backup_file(path, storedata) {
	try {
		var prev = editorStorage.get(path);
		var date = ('date' in prev)
			? prev.date
			: ISODateString(new Date())
		editorStorage.set('meta:' + path, {
			path: path,
			date: date,
			name: $('#filedata').attr('name'),
			mime: $('#filedata').attr('mime'),
			mode: editorSettings.mode(),
		});
		if (storedata)
			editorStorage.set('data:' + path,
				editor.getValue()
			);
	} catch (e) {
		editorNotify.error({
			title:'Error in backuping file',
			text: e
		});
	}
}

function restore_file(path) {
	try {
		var file = editorStorage.get('meta:' + path);
		var data = editorStorage.get('data:' + path);

		if (file && data) {
			editor.removeListener('change', onEditorChange);
			editor.setValue(data);
			editor.gotoLine(0,0,false);
			editor.moveCursorTo(0,0);
			editor.on('change', onEditorChange);

			// Restore human-selected mode
			editorSettings.mode(file.mode);

			// Update editorStatusbar
			editorStatusbar.update({
				filename: file.path,
				mode:     file.mode,
				changed:  true
			});

			$('#filedata').attr('name', file.name);
			$('#filedata').attr('path', file.path);
			$('#filedata').attr('mime', file.mime);
			return true;
		}
	} catch (e) {
		editorNotify.error({
			title:'Error in restoring file',
			text: e
		});
	}
	return false;
}

function send_event(name, arg)
{
	try {
		var event = new CustomEvent(name, {
			"detail": (arg !== undefined) ? arg : ''
		});
		$('#filedata').get(0).dispatchEvent(event);
	} catch(e) {
		editorNotify.error({
			title:'Event error',
			text: e
		});
	}
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
	} catch(e) { /* Ignore all */ }
}

function open_file(file)
{
	if (editorStorage.has('data:' + file.path)) {
		dialog_restore_file(file.path, file.mime);
		return;
	}
	send_event('send-open', {
		type: 'filedata',
		mime: file.mime,
		name: file.name,
		path: file.path
	});
}

function reopen(doc)
{
	var elem = $(doc);
	var v = editorStorage.get('meta:' + elem.text());
	open_file(v);
}

function dialog_new_file()
{
	$('#dialog-new-filename').val($('#filedata').attr('path'));
	$('#dialog-new-file').dialog({
		autoOpen: true,
		resizable: true,
		width: 600,
		modal: true,
		buttons: {
			"Save": function() {
				var path = $('#dialog-new-filename').val();

				if (path) {
					$('#filedata').attr('path', path);
					save_file();
					editorStatusbar.filename(path);
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
	$('#dialog-save-filename').text($('#filedata').attr('path'));
	$("#dialog-save-file").dialog({
		autoOpen: true,
		resizable: true,
		width: 600,
		modal: true,
		buttons: {
			"Save": function() {
				if (editorStatusbar.changed()) {
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

function dialog_recently_opened(list)
{
	$('#recently-opened').empty();
	$.each(list, function (i,n) {
		var v = editorStorage.get('meta:' + n);
		$('#recently-opened').append(
			'<tr class="ui-widget">'+
			'<td class="recently-opened-name ui-widget-content ui-corner-all"><a class="ui-button" onclick="reopen(this)">'+ v.path +'</a></td>'+
			'<td class="recently-opened-date ui-widget-content ui-corner-all">' + v.date + '</td>'+
			'<td class="recently-opened-act"><button class="recently-opened-remove-entry" arg="' + v.path + '"></button></td>'+
			'</tr>');
	});
	$('.recently-opened-remove-entry').button({
		icons: { primary: "ui-icon-close" },
		text: false
	}).on('click', function (e) {
		var name = $(this).attr('arg');
		var list = editorStorage.get('recently-opened');

		editorStorage.set('recently-opened', list.filter(function (e, i, a) {
			return (e != name);
		}));

		dialog_recently_opened(editorStorage.get('recently-opened'));
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
				if (restore_file(filename)) {
					editorStatusbar.filename(filename);
				}
				$(this).dialog("close");
			},
			Cancel: function() {
				var v = editorStorage.get('meta:' + filename);
				editorStorage.remove('data:' + filename);
				v.type = 'filedata';
				send_event('send-open', v);
				$(this).dialog("close");
			}
		}
	});
}

function handle_actions(obj)
{
	switch (obj.id) {
		case 'open':
			send_event('send-open', {
				type: 'filename',
				name: '',
				mime: '',
			});
			break;
		case 'close':

			backup_file($('#filedata').attr('path'), true);

			editorStatusbar.update({
				filename: '',
				changed: false
			});

			editor.removeListener('change', onEditorChange);
			editor.setValue('');
			editor.gotoLine(0,0,false);
			editor.on('change', onEditorChange);
			$('#filedata').attr('name', '');
			$('#filedata').attr('path', '');

			window.document.title = 'Editor';
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
		default:
			editorNotify.info({
				title:'Unknown action',
				text: 'The requested action is not known'
			});
			return;
	}
}

function handle_settings(obj)
{
	switch (obj.id) {
		case 'theme':
			editorSettings.theme(obj.value);
			editorStatusbar.theme(obj.value);
			break;
		case 'mode':
			editorSettings.mode(obj.value);
			editorStatusbar.mode(obj.value);
			break;
		case 'keybinding':
			editorSettings.keybinding(obj.value);
			editorStatusbar.keybinding(obj.value);
			break;
		case 'folding':
			editorSettings.folding(obj.value);
			break;
		case 'showhidden':
			editorSettings.showInvisibles(obj.checked);
			break;
		case 'showgutter':
			editorSettings.showGutter(obj.checked);
			break;
		case 'showmargin':
			editorSettings.showPrintMargin(obj.checked);
			break;
		case 'softwrap':
			editorSettings.softwrap(obj.value);
			break;
		case 'fontsize':
			editorSettings.fontsize(obj.value);
			break;
		case 'softtabs':
			editorSettings.softTab(obj.checked);
			break;
		case 'tabsize':
			editorSettings.tabSize(obj.value);
			break;
		default:
			editorNotify.info({
				title:'Unknown operation',
				text: 'The requested operation is not known'
			});
			return;
	}
	editorSettings.save();
}

function onOpenFile(evt)
{
	try {
		if (evt.detail.type == 'filename') {
			open_file(evt.detail);
			return;
		}

		var name = evt.detail.name;
		var path = evt.detail.path;
		var mime = evt.detail.mime;
		var meta = editorStorage.get('meta:' + path);
		var mode = ('mode' in meta) ? meta.mode : guessMode.check(mime);

		// Update settings
		editorSettings.mode(mode);

		// Update statusbar
		editorStatusbar.update({
			filename: path,
			mode:     mode,
			changed:  false
		});

		// Set new file.
		editor.removeListener('change', onEditorChange);
		editor.setValue($('#filedata').val());
		editor.gotoLine(0,0,false);
		editor.moveCursorTo(0,0);
		editor.on('change', onEditorChange);

		// Update title
		window.document.title = 'Editor: ' + name;

		// Backup metadata
		backup_file(path, false);

		// Update history
		var recently_opened = editorStorage.get('recently-opened');

		for (var i = 0; i < recently_opened.length; i++) {
			if (recently_opened[i] == path)
				return;
		}

		var list = editorStorage.append('recently-opened', path, 30);
		dialog_recently_opened(list);

	} catch(e) {
		editorNotify.error({
			title:'Error in opening file',
			text: e.toString()
		});
	}
}

function onSaveFile(evt)
{
	try {
		if (evt.detail.status == 'ok') {
			editorStatusbar.changed(false);
			return;
		}

		editorNotify.error({
			title:'Error in saving file',
			text: evt.detail.message
		});
	} catch(e) {
		editorNotify.error({
			title:'Error in saving file',
			text: e.toString()
		});
	}
}

function main()
{
	editorNotify.init("#notifications");

	$("#tabs").tabs({
		heightStyle: "fill",
		activate: function (e,ui) {
			if (ui.newTab.attr('aria-controls') == "tab-recently-opened") {
				if (ui.newTab.attr('editorWatchDog'))
					return;
				ui.newTab.attr('editorWatchDog',
					setInterval(function() {
						dialog_recently_opened(editorStorage.get('recently-opened'));
					}, 10000));
			} else {
				clearInterval(ui.newTab.attr('editorWatchDog'));
			}
		}
	});

	$('#controlbar').on('click', function (e) {
		$('#settings').toggleClass('hidden');
	});

	dialog_recently_opened(editorStorage.get('recently-opened'));

	// Create editor
	editor = ace.edit('editor');
	editor.resize();

	// Setup helpers
	editorStatusbar.init();
	editorSettings.init(editor);

	// Start watchdog
	 autosave.start();

	// Track changes
	editor.on('change', onEditorChange);

	// Set addon handler
	$('#filedata').get(0).addEventListener('recv-open', onOpenFile);
	$('#filedata').get(0).addEventListener('recv-save', onSaveFile);

	send_event('send-ready');
}
