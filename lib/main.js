/* main.js
 *
 * This file is part of mozeditor (Editor (ACE) embedded in browser)
 * Copyright (C) 2012  Alexey Gladkov <gladkov.alexey@gmail.com>
 *
 * This file is covered by the GNU General Public License,
 * which should be included with mozeditor as the file COPYING.
 */

'use strict';

var self = require("self");
var tabs = require("tabs");
var file = require("file");
var widgets = require("widget");
var winUtils = require("window-utils");
var {Cc, Ci} = require("chrome");

var widget = widgets.Widget({
	id: "mozeditor",
	label: "Mozilla Editor",
	contentURL: self.data.url('editor-24.png'),
	onClick: function() {
		tabs.open({
			url: self.data.url('editor.html'),
			onReady: function(tab) {
				var worker = tab.attach({
					contentScriptFile: [
						self.data.url('jquery-1.8.3.min.js'),
						self.data.url('content.js')
					]
				});
				worker.port.on('send-save', function(message) {
					var op_status = 'ok';
					var op_err = '';

					try {
						var f = JSON.parse(message);
						var fp = file.open(f.path, "w");
						fp.write(f.data);
						fp.close();
					} catch(e) {
						op_status = 'error';
						op_err = e;
					}
					worker.port.emit("recv-save", JSON.stringify({
						status:  op_status,
						message: op_err.toString()
					}));
				});
				worker.port.on('send-open', function(message) {
					var data = JSON.parse(message);

					if (data.type == 'filedata') {
						data.data = file.read(data.path);
						worker.port.emit("recv-open", JSON.stringify(data));
						return;
					}

					var window = winUtils.windowIterator().next();
					var fp = Cc["@mozilla.org/filepicker;1"]
						.createInstance(Ci.nsIFilePicker);

					fp.init(window, "Dialog Title", Ci.nsIFilePicker.modeOpen);
					//fp.appendFilters(nsIFilePicker.filterAll | nsIFilePicker.filterText);
					fp.appendFilters(Ci.nsIFilePicker.filterAll);

					var rv = fp.show();

					if (rv == Ci.nsIFilePicker.returnOK || rv == Ci.nsIFilePicker.returnReplace) {
						var contentType = 'text/plain';

						try {
							contentType = Cc["@mozilla.org/mime;1"]
								.getService(Ci.nsIMIMEService)
								.getTypeFromFile(fp.file);
						} catch(e) {}

						//console.log(fp.file.leafName);

						worker.port.emit("recv-open", JSON.stringify({
							type: 'filename',
							mime: contentType,
							name: fp.file.leafName,
							path: fp.file.path,
							size: fp.file.fileSize,
							perm: fp.file.permissions,
							data: ''
						}));
					}
				});
			}
		});
	}
});
