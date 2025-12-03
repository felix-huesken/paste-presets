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
		const group3 = new Adw.PreferencesGroup();

		const configButton = new Gtk.Button({
			label: _("Edit Text Presets"),
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
		group1.add(configButton);

		const configTip1 = new Gtk.Label({
			label: _(
				"Each line in the Preset File is one entry. Disable and re-enable the extension after editing the Preset File."
			),
			wrap: true,
			xalign: 0.5,
			justify: Gtk.Justification.CENTER,
		});
		group1.add(configTip1);

		const shortcutTip1 = new Gtk.Label({
			label: _("Global Shortcut (e.g. <Super>C or <Ctrl><Alt>T)"),
			wrap: true,
			xalign: 0.5,
			justify: Gtk.Justification.CENTER,
		});
		group2.add(shortcutTip1);

		const entry = new Gtk.Entry({
			text: settings.get_strv("shortcutopen")[0] || "",
			hexpand: true,
			xalign: 0.5,
		});
		group2.add(entry);

		const shortcutTip2 = new Gtk.Label({
			label: _(
				"Tip: If you press the shortcut multiple times, you will automatically select the next text entry, just as if you pressed the down arrow key. Press enter to close the extension and paste the text."
			),
			wrap: true,
			xalign: 0.5,
			justify: Gtk.Justification.CENTER,
		});
		group2.add(shortcutTip2);

		entry.connect("activate", () => {
			const value = entry.text.trim();
			if (value) settings.set_strv("shortcutopen", [value]);
		});
		const saveButton = new Gtk.Button({
			label: _("Save"),
			halign: Gtk.Align.CENTER,
		});
		saveButton.connect("clicked", () => {
			const value = entry.text.trim();
			if (value) settings.set_strv("shortcutopen", [value]);
			window.close();
		});
		group2.add(saveButton);

		const showIndicator = new Adw.SwitchRow({
			title: _("Show Indicator"),
			active: settings.get_strv("indicator") || true,
		});
		settings.bind(
			"indicator",
			showIndicator,
			"active",
			Gio.SettingsBindFlags.DEFAULT
		);
		group3.add(showIndicator);

		page.add(group1);
		page.add(group2);
		page.add(group3);
		window.add(page);
	}
}
