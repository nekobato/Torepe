module.exports = {
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        appId: 'net.netkobato.tracingpaper',
        mac: {
          category: 'public.app-category.productivity',
          icon: './build/icon.icns',
          target: 'default',
        },
      },
    },
  },
};
