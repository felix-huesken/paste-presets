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
		this._pastingKeypressTimeout = null;
	}

	enable() {
		this.keyboard = new Keyboard();
		this._settings = this.getSettings();
		this._settings.set_string("path", this.dir.get_path());
		this._indicator = new PanelMenu.Button(0.0, "PanelButton", false);
		this._createMenu();

		Main.wm.addKeybinding(
			"open",
			this._settings,
			Meta.KeyBindingFlags.NONE,
			Shell.ActionMode.ALL,
			this._toggleMenu.bind(this)
		);

		let icon = new St.Icon({
			icon_name: "insert-text-symbolic",
			style_class: "system-status-icon",
		});

		this._indicator.add_child(icon);
		Main.panel.addToStatusArea("Paste Presets", this._indicator);
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
				selectionCounter = 0;
				menu.open();
			}
		} else {
			selectionCounter = 0;
			menu.open();
			if (this._pastingKeypressTimeout) {
				clearTimeout(this._pastingKeypressTimeout);
				this._pastingKeypressTimeout = null;
			}
			this._pastingKeypressTimeout = setTimeout(() => {
				this.keyboard.press(Clutter.KEY_Down);
				this.keyboard.release(Clutter.KEY_Down);
			}, 100);
		}
	}

	async _createMenu() {
		selectionCounter = 0;

		this._popUpMenu = new PopupMenu.PopupMenuSection();
		this._indicator.menu.addMenuItem(this._popUpMenu);
		try {
			presets = await this._readLinesFromFile();

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
					if (this._pastingKeypressTimeout) {
						clearTimeout(this._pastingKeypressTimeout);
						this._pastingKeypressTimeout = null;
					}
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
		} catch (e) {
			log(e);
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

	async _readLinesFromFile() {
		let filePath = GLib.build_filenamev([
			this.dir.get_path(),
			"presets.txt",
		]);

		const file = Gio.File.new_for_path(filePath);

		const [ok, contents] = await new Promise((resolve, reject) => {
			file.load_contents_async(null, (file, res) => {
				try {
					const [ok, contents] = file.load_contents_finish(res);
					resolve([ok, contents]);
				} catch (e) {
					reject(e);
				}
			});
		});
		const text = new TextDecoder("utf-8").decode(contents);
		if (ok) {
			return text.split(/\r?\n/).filter((line) => line.trim().length > 0);
		} else {
			throw new Error("Failed to load file");
		}
	}

	disable() {
		this._settings = null;
		this.keyboard = null;
		if (this._pastingKeypressTimeout) {
			clearTimeout(this._pastingKeypressTimeout);
		}
		this._pastingKeypressTimeout = null;
		if (this._indicator) {
			this._indicator.destroy();
			this._indicator = null;
		}
		Main.wm.removeKeybinding("open");
	}
}
