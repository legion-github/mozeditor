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
			mime: $('#filedata').attr('mime'),
			data: $('#filedata').val()
		}));
	}
);

$('#filedata').get(0).addEventListener('send-open',
	function (evt) {
		self.port.emit('send-open', JSON.stringify({
			type: evt.detail.type,
			name: evt.detail.name,
			mime: evt.detail.mime,
			data: ''
		}));
	}
);

self.port.on('recv-open',
	function (message) {
		try {
			var file = JSON.parse(message);

			if (file.type == 'filename') {
				event('recv-open', {
					type: 'filename',
					name: file.name,
					mime: file.mime,
					data: ''
				});
				return;
			}

			$('#filedata').val(file.data);
			$('#filedata').attr('name', file.name);
			$('#filedata').attr('mime', file.mime);

			event('recv-open', {
				type: 'filedata',
				name: file.name,
				mime: file.mime,
				data: ''
			});
		} catch(e) {
			alert(e);
		}
	}
);
