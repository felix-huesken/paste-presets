/*
- PASTE PRESETS-
A GNOME Extension to quickly copy and paste frequently-used text, like your e-mail address or phone number.

Copyright 2025 Felix Hüsken

- - - -
License: GNU General Public License v3.0

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.

- - - -
Some code was re-used from the Clipboard Indicator Extension:
https://github.com/Tudmotu/gnome-shell-extension-clipboard-indicator

*/

import {
	Extension,
	gettext as _,
} from "resource:///org/gnome/shell/extensions/extension.js";

import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import Meta from "gi://Meta";
import St from "gi://St";
import Clutter from "gi://Clutter";
import Shell from "gi://Shell";
import Gio from "gi://Gio";
import GLib from "gi://GLib";
import { Keyboard } from "./keyboard.js";

let presets = [];
let selectionCounter = 0;

export default class PastePresets extends Extension {
	constructor(metadata) {
		super(metadata);
		this._indicator = null;
		this._settings = null;
		this.keyboard = null;
	}

	enable() {
		this.keyboard = new Keyboard();
		this._settings = this.getSettings();
		this._settings.set_string("path", this.dir.get_path());
		this._indicator = new PanelMenu.Button(0.0, "PanelButton", false);

		let icon = new St.Icon({
			icon_name: "insert-text-symbolic",
			style_class: "system-status-icon",
		});

		this._indicator.add_child(icon);
		Main.panel.addToStatusArea("Paste Presets", this._indicator);

		// Reload the text entries from the text file and re-build the menu when it's opened
		this._indicator.connect("button-press-event", (actor, event) => {
			this._createMenu();
		});

		this._createMenu();

		Main.wm.addKeybinding(
			"open",
			this._settings,
			Meta.KeyBindingFlags.NONE,
			Shell.ActionMode.ALL,
			this._toggleMenu.bind(this)
		);
	}

	_toggleMenu() {
		if (!this._indicator) return;

		const menu = this._indicator.menu;

		// if the menu is open, make the global keyboard shortcut select the next entries
		if (menu.isOpen) {
			this.keyboard.press(Clutter.KEY_Down);
			this.keyboard.release(Clutter.KEY_Down);
			selectionCounter++;
			if (selectionCounter >= presets.length) {
				menu.close();
				this._createMenu();
				menu.open();
			}
		} else {
			this._createMenu();
			menu.open();
			this._pastingKeypressTimeout = setTimeout(() => {
				this.keyboard.press(Clutter.KEY_Down);
				this.keyboard.release(Clutter.KEY_Down);
			}, 100);
		}
	}

	_createMenu() {
		// Destroy and re-build the menu with new text entries
		if (this._popUpMenu) {
			this._popUpMenu.destroy();
		}

		selectionCounter = 0;

		this._popUpMenu = new PopupMenu.PopupMenuSection();
		this._indicator.menu.addMenuItem(this._popUpMenu);

		presets = this._readLinesFromFile();

		for (let i = 0; i < presets.length; i++) {
			let itemLabel = presets[i];
			if (presets[i].length > 50) {
				itemLabel = presets[i].slice(0, 50) + "...";
			}
			let item = new PopupMenu.PopupMenuItem(itemLabel);

			item.connect("activate", () => {
				// Get the clipboard and insert the currently selected text entry into it.
				const clipboard = St.Clipboard.get_default();
				clipboard.set_text(St.ClipboardType.CLIPBOARD, presets[i]);

				this._indicator.menu.close();

				/* 
				Paste the selected text entry from the clipboard.
				
				The following code snippet is taken from:
				https://github.com/Tudmotu/gnome-shell-extension-clipboard-indicator
				 */
				this._pastingKeypressTimeout = setTimeout(() => {
					if (
						this.keyboard.purpose ===
						Clutter.InputContentPurpose.TERMINAL
					) {
						this.keyboard.press(Clutter.KEY_Control_L);
						this.keyboard.press(Clutter.KEY_Shift_L);
						this.keyboard.press(Clutter.KEY_Insert);
						this.keyboard.release(Clutter.KEY_Insert);
						this.keyboard.release(Clutter.KEY_Shift_L);
						this.keyboard.release(Clutter.KEY_Control_L);
					} else {
						this.keyboard.press(Clutter.KEY_Shift_L);
						this.keyboard.press(Clutter.KEY_Insert);
						this.keyboard.release(Clutter.KEY_Insert);
						this.keyboard.release(Clutter.KEY_Shift_L);
					}
				}, 100);
			});

			this._popUpMenu.addMenuItem(item);
		}
	}

	_openTextFile() {
		let filePath = GLib.build_filenamev([
			this.dir.get_path(),
			"presets.txt",
		]);
		let file = Gio.File.new_for_path(filePath);
		Gio.AppInfo.launch_default_for_uri(file.get_uri(), null);
	}

	_readLinesFromFile() {
		let filePath = GLib.build_filenamev([
			this.dir.get_path(),
			"presets.txt",
		]);
		const file = Gio.file_new_for_path(filePath);

		try {
			let [ok, contents] = GLib.file_get_contents(filePath);

			if (!ok) {
				logError(new Error(`Failed to read ${filename}`));
				return [];
			}

			let text = imports.byteArray.toString(contents);

			return text.split(/\r?\n/).filter((line) => line.trim().length > 0);
		} catch (e) {
			return [];
		}
	}

	disable() {
		if (this._indicator) {
			this._indicator.destroy();
			this._indicator = null;
			Main.wm.removeKeybinding("open");
		}
	}
}
