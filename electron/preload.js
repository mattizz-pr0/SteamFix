const { contextBridge, ipcRenderer } = require('electron');

console.log('[preload] caricato');

contextBridge.exposeInMainWorld('api', {
  ping:    () => ipcRenderer.invoke('app:ping'),
  version: () => ipcRenderer.invoke('app:version'),

  dialog: {
    saveFile: (defaultName) => ipcRenderer.invoke('dialog:saveFile', defaultName),
    openFile: () => ipcRenderer.invoke('dialog:openFile'),
    openExternal: (url) => ipcRenderer.invoke('dialog:openExternal', url)
  },

  store: {
    get: (k) => ipcRenderer.invoke('store:get', k),
    set: (k, v) => ipcRenderer.invoke('store:set', k, v),
    all: () => ipcRenderer.invoke('store:all')
  },

  github: {
    listBranches: () => ipcRenderer.invoke('github:listBranches'),
    listFiles: (branch, opts) => ipcRenderer.invoke('github:listFiles', branch, opts),
    syncGame: (appId) => ipcRenderer.invoke('github:syncGame', appId),
    info: () => ipcRenderer.invoke('github:info'),
    download: (args) => ipcRenderer.invoke('github:download', args),
  },

  hubcap: {
    search: (params) => ipcRenderer.invoke('hubcap:search', params),
    library: (params) => ipcRenderer.invoke('hubcap:library', params),
    status: (appId) => ipcRenderer.invoke('hubcap:status', appId),
    statusBatch: (ids) => ipcRenderer.invoke('hubcap:statusBatch', ids),
    userStats: () => ipcRenderer.invoke('hubcap:userStats'),
    r2CheckBatch: (ids) => ipcRenderer.invoke('hubcap:r2CheckBatch', ids)
  },

  hubcapKey: {
    test: (key) => ipcRenderer.invoke('hubcapKey:test', key),
    save: (key) => ipcRenderer.invoke('hubcapKey:save', key),
    get: () => ipcRenderer.invoke('hubcapKey:get')
  },

  admin: {
    login: (token) => ipcRenderer.invoke('admin:login', token),
    logout: () => ipcRenderer.invoke('admin:logout'),
    isLogged: () => ipcRenderer.invoke('admin:isLogged'),
    status: () => ipcRenderer.invoke('admin:status'),
    forceUpdate: (id) => ipcRenderer.invoke('admin:forceUpdate', id),
    createToken: (name) => ipcRenderer.invoke('admin:createToken', name),
    listTokens: () => ipcRenderer.invoke('admin:listTokens'),
    revealToken: (id) => ipcRenderer.invoke('admin:revealToken', id),
    revokeToken: (id) => ipcRenderer.invoke('admin:revokeToken', id),
    removeToken: (id) => ipcRenderer.invoke('admin:removeToken', id)
  },

  upload: {
    onlinefix: (filePath) => ipcRenderer.invoke('upload:onlinefix', filePath),
    checkToken: () => ipcRenderer.invoke('upload:checkToken')
  },

  steamfix: {
    run: () => ipcRenderer.invoke('steamfix:run')
  },

  updater: {
    check: () => ipcRenderer.invoke('updater:check'),
    download: (version) => ipcRenderer.invoke('updater:download', version),
    install: (msiPath) => ipcRenderer.invoke('updater:install', msiPath),
    onProgress: (callback) => {
      ipcRenderer.on('updater:progress', (_e, data) => callback(data));
    }
  },

  steam: {
    listInstalled: () => ipcRenderer.invoke('steam:listInstalled'),
    installGame: (appId) => ipcRenderer.invoke('steam:installGame', appId),
    installFromWorker: (appId) => ipcRenderer.invoke('steam:installFromWorker', appId),
    removeGame: (appId) => ipcRenderer.invoke('steam:removeGame', appId),
    openFolder: (p) => ipcRenderer.invoke('steam:openFolder', p),
    restartSteam: () => ipcRenderer.invoke('steam:restartSteam'),
    appDetails: (ids) => ipcRenderer.invoke('steam:appDetails', ids)
  },
});