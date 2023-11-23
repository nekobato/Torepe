const package = require('./package.json');

module.exports = {
  productName: 'Torepe',
  appId: 'net.nekobato.trace-on',
  asar: true,
  directories: {
    output: 'release/${version}',
  },
  files: ['dist'],
  mac: {
    category: 'public.app-category.productivity',
    target: ['dmg'],
    // identify: undefined,
    icon: './build/icon.icns',
    publish: [
      {
        provider: "github",
        owner: "nekobato",
        repo: "torepe",
      },
    ],
  },
  buildVersion: package.version,
};
