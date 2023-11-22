// https://nuxt.com/docs/api/configuration/nuxt-config
import serverConfig  from './server/server.config';

export default defineNuxtConfig({
  plugins: [
    './modules/jss/standard/sitecore-jss-placeholder-plugin.js',
    { 
      src: '~/plugins/export-route-data-context-plugin', 
      mode: 'server' 
    },
    // '@nuxtjs/tailwindcss',
  ],
  modules: [
    '~/modules/express/initialize',
    '@pinia/nuxt',
    [
      '~/modules/jss/standard/initialize', 
      { dataFetcherType: 'axios' }
    ],
    [
      '~/modules/jss/rendering-host/initialize.js',
      {
        enabled: true,
        resolveRenderingHostPublicUrl: () => {
          const serverUrl = serverConfig.resolveServerUrl();
          const publicServerUrl = serverConfig.resolvePublicServerUrl();
          return publicServerUrl.url || serverUrl.url;
        },
      },
    ]
  ]
});

