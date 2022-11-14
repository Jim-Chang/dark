enum Menu {
  ToggleEnable = 'toggle_enable',
  DarkThemeExclude = 'dark_theme_exclude',
  DarkThemeInclude = 'dark_theme_include',
}

chrome.contextMenus.create({
  title: 'Toggle Enable Status',
  contexts: ['all'],
  id: Menu.ToggleEnable,
});

chrome.contextMenus.create({
  title: "Don't Apply Dark Theme",
  contexts: ['all'],
  id: Menu.DarkThemeExclude,
});

chrome.contextMenus.create({
  title: 'Apply Dark Theme',
  contexts: ['all'],
  id: Menu.DarkThemeInclude,
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId == Menu.ToggleEnable) {
    onClickToggleEnableStatus();
  } else if (info.menuItemId === Menu.DarkThemeExclude) {
    onClickAddToExcludeDarkTheme(tab);
  } else if (info.menuItemId === Menu.DarkThemeInclude) {
    onclickRemoveFromExcludeDarkTheme(tab);
  }
});

async function onClickToggleEnableStatus() {
  await ConfigService.toggleEnableStatus();
  await TabService.notifyChangeToAllTab();
}

async function onClickAddToExcludeDarkTheme(tab: chrome.tabs.Tab | undefined) {
  if (tab && tab.url) {
    const host = new URL(tab.url).host;
    await ConfigService.addExcludeHost(host);
    await TabService.notifyChangeToTab(tab.id);
  }
}

async function onclickRemoveFromExcludeDarkTheme(tab: chrome.tabs.Tab | undefined) {
  if (tab && tab.url) {
    const host = new URL(tab.url).host;
    await ConfigService.removeExcludeHost(host);
    await TabService.notifyChangeToTab(tab.id);
  }
}

export type Config = { [key: string]: any };

class ConfigService {
  static load(keys: string[]): Promise<Config> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(keys, (items) => resolve(items));
    });
  }

  static save(config: Config): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.sync.set(config, () => resolve());
    });
  }

  static async toggleEnableStatus(): Promise<void> {
    const config = await ConfigService.load(['isEnable']);
    const isEnable = !config.isEnable;
    return await ConfigService.save({ isEnable });
  }

  static async addExcludeHost(host: string): Promise<void> {
    const config = await ConfigService.load(['excludeHosts']);
    const excludeHosts = config['excludeHosts'] ?? [];
    if (!excludeHosts.includes(host)) {
      excludeHosts.push(host);
    }
    return await ConfigService.save({ excludeHosts });
  }

  static async removeExcludeHost(host: string): Promise<void> {
    const config = await ConfigService.load(['excludeHosts']);
    const excludeHosts = config['excludeHosts'] ?? [];
    const index = excludeHosts.indexOf(host);
    if (index > -1) {
      excludeHosts.splice(index, 1);
    }
    return await ConfigService.save({ excludeHosts });
  }
}

export class TabService {
  static notifyChangeToTab(tabId: number): Promise<any> {
    return chrome.tabs.sendMessage(tabId, { configUpdate: true });
  }

  static notifyChangeToAllTab(): Promise<void> {
    return new Promise((resolve) => {
      chrome.tabs.query({}, async (tabs) => {
        try {
          await Promise.all(
            tabs.filter((t) => t !== undefined).map((t) => chrome.tabs.sendMessage(t.id!, { configUpdate: true })),
          );
        } catch (e) {
          console.error(e);
        }
        resolve();
      });
    });
  }
}
