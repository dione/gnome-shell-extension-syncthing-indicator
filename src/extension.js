/* =============================================================================================================
	SyncthingIndicator 0.51
================================================================================

	GNOME Shell extension entry point - enables/disables the extension.

	Copyright (c) 2019-2026, 2nv2u <info@2nv2u.com>
	This work is distributed under GPLv3, see LICENSE for more information.
================================================================================ */

import * as Main from "resource:///org/gnome/shell/ui/main.js";
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";

import * as Syncthing from "./syncthing.js";
import * as PanelMenu from "./panelMenu.js";
import * as QuickSetting from "./quickSetting.js";
import * as Utils from "./utils.js";
import Config from "./config.js";

const SETTINGS_DELAY = 500;

// Syncthing indicator extension
export default class SyncthingIndicatorExtension extends Extension {
  enable() {
    this._settingTimer = new Utils.Timer(SETTINGS_DELAY);
    this.settings = this.getSettings();
    this._settingsChangedId = this.settings.connect("changed", () => {
      this._settingTimer.run(() => {
        this.indicator.close();
        this.disable();
        this.enable();
      });
    });
    this.manager = new Syncthing.Manager(
      new Config(this.settings, false),
      this.metadata.path,
    );
    switch (this.settings.get_int("menu")) {
      case 1:
        this.indicator = new PanelMenu.SyncthingIndicatorPanel(this);
        Main.panel.addToStatusArea("SyncthingIndicatorPanel", this.indicator);
        break;
      case 0:
      default:
        // Fall back to Quick Settings for any unexpected value rather
        // than leaving `this.indicator` undefined and crashing
        // disable().
        this.indicator = new QuickSetting.SyncthingIndicatorQuickSetting(this);
        Main.panel.statusArea.quickSettings.addExternalIndicator(
          this.indicator,
        );
        break;
    }
    this.manager.attach();
  }

  disable() {
    Utils.Timer.destroy();
    if (this._settingsChangedId) {
      this.settings.disconnect(this._settingsChangedId);
      this._settingsChangedId = 0;
    }
    this.settings = null;
    this.indicator?.destroy();
    this.indicator = null;
    this.manager?.destroy();
    this.manager = null;
    Utils.I18N.reset();
  }
}
