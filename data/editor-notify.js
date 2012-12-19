/* editor-notify.js
 *
 * This file is part of mozeditor (Editor (ACE) embedded in browser)
 * Copyright (C) 2012  Alexey Gladkov <gladkov.alexey@gmail.com>
 *
 * This file is covered by the GNU General Public License,
 * which should be included with mozeditor as the file COPYING.
 */

(function (editorNotify, undefined) {
	var notification;

	editorNotify.init = function (id) {
		notification = $(id).notify();
	};

	editorNotify.message = function (msg) {
		try {
			notification.notify("create", "sticky-message", msg, { expires:true });
		} catch(e) {
			alert(e);
		}
	};

	editorNotify.info = function (msg) {
		try {
			notification.notify("create", "sticky-info", msg, { expires:false });
		} catch(e) {
			alert(e);
		}
	};

	editorNotify.error = function (msg) {
		try {
			notification.notify("create", "sticky-error", msg, { expires:false });
		} catch(e) {
			alert(e);
		}
	};

} (window.editorNotify = window.editorNotify || {}));
