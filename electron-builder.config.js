const package = require('./package.json');

module.exports = {
  appId: 'net.nekobato.torepe',
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
  },
  buildVersion: package.version,
};
