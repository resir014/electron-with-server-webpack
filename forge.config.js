module.exports = {
  packagerConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'electron_with_server_webpack',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    [
      '@electron-forge/plugin-webpack',
      {
        mainConfig: './webpack.main.config.js',
        renderer: {
          config: './webpack.renderer.config.js',
          entryPoints: [
            {
              html: './src/main-window/index.html',
              js: './src/main-window/index.js',
              preload: {
                js: './src/main-window/renderer-preload.js',
              },
              name: 'main_window',
            },
            {
              html: './src/server/index.html',
              js: './src/server/index.js',
              name: 'server',
            },
          ],
        },
      },
    ],
  ],
};
