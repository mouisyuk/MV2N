import { getConfig } from '~/temp/config';

export default defineNuxtPlugin(  nuxtApp => {
  // Define the plugin.
  const plugin = {
    install: (VueInstance) =>
      install({
        VueInstance,
        nuxtApp,
      }),
    key: 'SitecoreJssConfigRuntimePlugin',
  };

  // Note: we don't use the built-in Nuxt plugin "inject" functionality because it
  // will assign the plugin to the Vue instance using the `key` property. However, we
  // want all JSS-related plugins to be accessible via the `$jss` property, so we
  // need to use the Vue-provided `Vue.use()` syntax to install JSS plugins.
  nuxtApp.vueApp.use(plugin);
});

function install({ VueInstance, nuxtApp }) {
  if (nuxtApp.$jss && nuxtApp.$jss.getRuntimeConfig) {
    console.log('JSS Runtime Config plugin already installed.', nuxtApp.$jss.getRuntimeConfig);
    return;
  }

  // Define properties that will be available in the `$jss` object.
  // Note: these properties are _not_ intended to be reactive, which is why they are
  // all functions - to help make it clear to devs that the properties are not reactive.
  const pluginProps = {
    getRuntimeConfig: getConfig,
  };


  // Who knows what other JSS plugins are doing? So be kind and merge our plugin props
  // with any existing `$jss` object properties.
  nuxtApp.$jss = Object.assign(nuxtApp.$jss || {}, pluginProps);
  nuxtApp.vueApp.$jss = Object.assign(nuxtApp.vueApp.$jss || {}, pluginProps);
  VueInstance.config.globalProperties.$jss = Object.assign(VueInstance.config.globalProperties.$jss || {}, pluginProps);
}
