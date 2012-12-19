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
			var filename = $('#filedata').attr('name');
			if (filename)
				backup_file(filename, true);
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

function backup_file(filename, storedata) {
	try {
		var prev = editorStorage.get(filename);
		var date = ('date' in prev)
			? prev.date
			: ISODateString(new Date())
		editorStorage.set('meta:' + filename, {
			name: filename,
			date: date,
			mime: $('#filedata').attr('mime'),
			mode: editorSettings.mode(),
		});
		if (storedata)
			editorStorage.set('data:' + filename,
				editor.getValue()
			);
	} catch (e) {
		editorNotify.error({
			title:'Error in backuping file',
			text: e
		});
	}
}

function restore_file(filename) {
	try {
		if (this.has(filename)) {
			var file = editorStorage.get('meta:' + filename);
			var data = editorStorage.get('data:' + filename);

			editor.removeListener('change', onEditorChange);
			editor.setValue(data);
			editor.gotoLine(0,0,false);
			editor.moveCursorTo(0,0);
			editor.on('change', onEditorChange);

			// Restore human-selected mode
			editorSettings.mode(file.mode);

			// Update editorStatusbar
			editorStatusbar.update({
				filename: file.name,
				mode:     file.mode,
				changed:  true
			});

			$('#filedata').attr('name', file.name);
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

function open_file(name, mime)
{
	if (editorStorage.has(name)) {
		dialog_restore_file(name, mime);
		return;
	}
	send_event('send-open', {
		type: 'filedata',
		mime: mime,
		name: name
	});
}

function reopen(doc)
{
	var elem = $(doc);
	open_file(elem.text(), elem.attr('mime'));
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
					editorStatusbar.filename(filename);
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
			'<td class="recently-opened-name ui-widget-content ui-corner-all"><a class="ui-button" mime="'+ v.mime +'" onclick="reopen(this)">'+ v.name +'</a></td>'+
			'<td class="recently-opened-date ui-widget-content ui-corner-all">' + v.date + '</td>'+
			'<td class="recently-opened-act"><button class="recently-opened-remove-entry" arg="' + v.name + '"></button></td>'+
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
				editorStorage.remove('data:' + filename);
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
			backup_file($('#filedata').attr('name'), true);

			editorStatusbar.update({
				filename: '',
				changed: false
			});

			editor.removeListener('change', onEditorChange);
			editor.setValue('');
			editor.gotoLine(0,0,false);
			editor.on('change', onEditorChange);
			$('#filedata').attr('name', '');
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
			open_file(evt.detail.name, evt.detail.mime);
			return;
		}

		var name = $('#filedata').attr('name');
		var mime = $('#filedata').attr('mime');
		var meta = editorStorage.get('meta:' + name);
		var mode = ('mode' in meta) ? meta.mode : guessMode.check(mime);

		// Update settings
		editorSettings.mode(mode);

		// Update statusbar
		editorStatusbar.update({
			filename: name,
			mode:     mode,
			changed:  false
		});

		// Set new file.
		editor.removeListener('change', onEditorChange);
		editor.setValue($('#filedata').val());
		editor.gotoLine(0,0,false);
		editor.moveCursorTo(0,0);
		editor.on('change', onEditorChange);

		// Backup metadata
		backup_file(name, false);

		// Update history
		var recently_opened = editorStorage.get('recently-opened');

		for (var i = 0; i < recently_opened.length; i++) {
			if (recently_opened[i] == name)
				return;
		}

		var list = editorStorage.append('recently-opened', name, 30);
		dialog_recently_opened(list);

	} catch(e) {
		editorNotify.error({
			title:'Error in opening file',
			text: e
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
}
