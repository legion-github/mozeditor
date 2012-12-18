/* editor-storage.js
 *
 * This file is part of mozeditor (Editor (ACE) embedded in browser)
 * Copyright (C) 2012  Alexey Gladkov <gladkov.alexey@gmail.com>
 *
 * This file is covered by the GNU General Public License,
 * which should be included with mozeditor as the file COPYING.
 */

(function (editorStorage, undefined) {
	editorStorage.has = function (key) {
		var items = localStorage.length;

		for (var i = 0; i < items; i++) {
			if (localStorage.key(i) == key)
				return true;
		}
		return false;
	};

	editorStorage.remove = function (key) {
		try {
			localStorage.removeItem(key);
		} catch (e) {
			editorNotify.error({
				title: "editorStorage error",
				text: e
			});
			throw "Unable to remove value";
		}
	};

	editorStorage.get = function (key, defval) {
		var dv = {};
		if (defval !== undefined)
			dv = defval;
		try {
			return (editorStorage.has(key))
				? JSON.parse(localStorage.getItem(key))
				: dv;
		} catch (e) {
			editorNotify.error({
				title: "editorStorage error",
				text: e
			});
			throw "Unable to obtain value";
		}
		return dv;
	};

	editorStorage.set = function (key, value) {
		try {
			localStorage.setItem(key, JSON.stringify(value));

		} catch (e) {
			editorNotify.error({
				title: "editorStorage error",
				text: e
			});
			throw "Unable to save value";
		}
	};

	editorStorage.append = function (key, value, maxlen) {
		try {
			var list = editorStorage.get(key, []);
			if (maxlen !== undefined) {
				if (list.length == maxlen)
					list.pop();
			}
			list.unshift(value);
			editorStorage.set(key, list);
			return list;
		} catch (e) {
			editorNotify.error({
				title: "editorStorage error",
				text: e
			});
			throw "Unable to append value";
		}
	};

} (window.editorStorage = window.editorStorage || {}));
