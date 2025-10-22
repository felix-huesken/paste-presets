import Gtk from "gi://Gtk";
import Adw from "gi://Adw";
import GLib from "gi://GLib";
import Gio from "gi://Gio";

import {
	ExtensionPreferences,
	gettext as _,
} from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

export default class MyPrefs extends ExtensionPreferences {
	fillPreferencesWindow(window) {
		let settings = this.getSettings();

		const page = new Adw.PreferencesPage({
			title: _("Preferences"),
		});

		const group1 = new Adw.PreferencesGroup();
		const group2 = new Adw.PreferencesGroup();

		const entry = new Gtk.Entry({
			text: settings.get_strv("open")[0] || "",
			hexpand: true,
			xalign: 0.5,
		});

		const row1 = new Adw.ExpanderRow({
			title: _("Configure the Text Entries"),
		});
		const configTip1 = new Gtk.Label({
			label: _(
				"Each line in the Preset File is one entry. Disable and re-enable the extension after editing the Preset File."
			),
			wrap: true,
			xalign: 0.5,
			justify: Gtk.Justification.CENTER,
		});

		const configButton = new Gtk.Button({
			label: _("Open Preset File"),
			halign: Gtk.Align.CENTER,
		});
		configButton.connect("clicked", () => {
			let filePath = GLib.build_filenamev([
				settings.get_string("path"),
				"presets.txt",
			]);
			let file = Gio.File.new_for_path(filePath);
			Gio.AppInfo.launch_default_for_uri(file.get_uri(), null);
		});

		const row2 = new Adw.ExpanderRow({
			title: _("Enter a global Shortcut to open the Extension"),
		});
		const shortcutTip1 = new Gtk.Label({
			label: _(
				"Type in the shortcut like these examples: <Super>C or <Ctrl><Alt>T"
			),
			wrap: true,
			xalign: 0.5,
			justify: Gtk.Justification.CENTER,
		});
		const shortcutTip2 = new Gtk.Label({
			label: _(
				"Tip: If you press the shortcut multiple times, you will automatically select the next text entry, just as if your pressed the down arrow key. Press enter to close the extension and paste the text."
			),
			wrap: true,
			xalign: 0.5,
			justify: Gtk.Justification.CENTER,
		});

		entry.connect("activate", () => {
			const value = entry.text.trim();
			if (value) settings.set_strv("open", [value]);
		});

		const saveButton = new Gtk.Button({
			label: _("Save"),
			halign: Gtk.Align.CENTER,
		});
		saveButton.connect("clicked", () => {
			const value = entry.text.trim();
			if (value) settings.set_strv("open", [value]);
			window.close();
		});

		group1.add(row1);
		row1.add_row(configTip1);
		row1.add_row(configButton);
		group2.add(row2);
		row2.add_row(shortcutTip1);
		row2.add_row(entry);
		row2.add_row(saveButton);
		row2.add_row(shortcutTip2);
		page.add(group1);
		page.add(group2);
		window.add(page);
	}
}
