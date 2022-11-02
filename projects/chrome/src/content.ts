const configKeys = ['isEnable', 'excludeHosts'];
const attrName = 'dark-theme-active';

async function loadConfig() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(configKeys, (items) => {
      resolve(items);
    });
  });
}

async function render() {
  const config = await loadConfig();
  const isEnable = !!config['isEnable'];
  const excludeHosts = config['excludeHosts'] ?? [];
  const host = new URL(location.href).host;
  if (isEnable && !excludeHosts.includes(host)) {
    activeDark();
  } else {
    inactiveDark();
  }
}

function activeDark() {
  document.documentElement.setAttribute(attrName, '');
}

function inactiveDark() {
  document.documentElement.removeAttribute(attrName);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.configUpdate) {
    render();
  }
});

render();
