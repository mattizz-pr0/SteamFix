const Store = require('electron-store');

const store = new Store({
  name: 'config',
  defaults: {
    githubToken: '',
    githubRepo: 'mattizz-pr0/games-db',
    githubGamesBranch: 'games',
    githubOnlinefixBranch: 'online-fix',
    hubcapApiKey: '',
    hubcapApiKeyIssuedAt: '',
    hubcapDailyUsed: 0,
    hubcapDailyDate: '',
    theme: 'dark',
    lang: 'it',
    workerUrl: 'https://onlinefix-proxy.reveng3r.workers.dev',
    adminToken: ''
  }
});

module.exports = {
  get:  (key)        => store.get(key),
  set:  (key, value) => store.set(key, value),
  all:  ()           => store.store
};