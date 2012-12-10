/* main.js
 *
 * This file is part of mozeditor (Editor (ACE) embedded in browser)
 * Copyright (C) 2012  Alexey Gladkov <gladkov.alexey@gmail.com>
 *
 * This file is covered by the GNU General Public License,
 * which should be included with mozeditor as the file COPYING.
 */

var self = require("self")
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
				worker = tab.attach({
					contentScriptFile: [
						self.data.url('jquery-1.8.3.min.js'),
						self.data.url('content.js')
					]
				});
				worker.port.on('send-save', function(message) {
					var f = JSON.parse(message);
					var fp = file.open(f.name, "w");
					fp.write(f.data);
					fp.close();
				});
				worker.port.on('send-open', function(message) {
					var data = JSON.parse(message);

					if (data.type == 'filedata') {
						worker.port.emit("recv-open", JSON.stringify({
							type: 'filedata',
							name: data.name,
							mime: data.mime,
							data: file.read(data.name)
						}));
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

						//console.log(contentType);

						worker.port.emit("recv-open", JSON.stringify({
							type: 'filename',
							mime: contentType,
							name: fp.file.path,
							data: ''
						}));
					}
				});
			}
		});
	}
});