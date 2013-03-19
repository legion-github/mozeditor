/* content.js
 *
 * This file is part of mozeditor (Editor (ACE) embedded in browser)
 * Copyright (C) 2012  Alexey Gladkov <gladkov.alexey@gmail.com>
 *
 * This file is covered by the GNU General Public License,
 * which should be included with mozeditor as the file COPYING.
 */

function event(name, arg)
{
	var event = new CustomEvent(name, {
		"detail": (arg != undefined) ? arg : ''
	});
	$('#filedata').get(0).dispatchEvent(event);
}


$('#filedata').get(0).addEventListener('send-save',
	function (evt) {
		self.port.emit('send-save', JSON.stringify({
			type: 'filedata',
			name: $('#filedata').attr('name'),
			path: $('#filedata').attr('path'),
			mime: $('#filedata').attr('mime'),
			data: $('#filedata').val()
		}));
	}
);

$('#filedata').get(0).addEventListener('send-open',
	function (evt) {
		self.port.emit('send-open', JSON.stringify(evt.detail));
	}
);

self.port.on('recv-open',
	function (message) {
		try {
			var file = JSON.parse(message);

			if (file.type == 'filename') {
				event('recv-open', file);
				return;
			}

			$('#filedata').val(file.data);
			$('#filedata').attr('name', file.name);
			$('#filedata').attr('path', file.path);
			$('#filedata').attr('mime', file.mime);

			event('recv-open', file);
		} catch(e) {
			alert(e);
		}
	}
);

self.port.on('recv-save',
	function (message) {
		try {
			var ans = JSON.parse(message);
			event('recv-save', ans);
		} catch(e) {
			alert('connect.js: ' + e);
		}
	}
);

