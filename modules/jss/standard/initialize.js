const nodePath = require("path");
const { configureRouter } = require("./configure-router");
import { defineNuxtModule } from "@nuxt/kit";

export default defineNuxtModule({
  hooks: {
    "builder:extendPlugins": (plugins) => {
      const configPluginIndex = plugins.findIndex(
        (plugin) => plugin.src.indexOf("jss-config-runtime-plugin") !== -1
      );

      if (configPluginIndex !== -1) {
        const configPlugin = plugins[configPluginIndex];
        plugins.splice(configPluginIndex, 1);
        plugins.unshift(configPlugin);
      }
    },
  },
  setup(options, nuxt) {
    // // Add JSS Placeholder plugin
    // addPlugin(nodePath.resolve(__dirname, 'sitecore-jss-placeholder-plugin.js'));

    // // Add JSS Config plugin
    // addPlugin(nodePath.resolve(__dirname, 'sitecore-jss-config-runtime-plugin.js'));

    // Configure JSS router customizations.
    configureRouter(nuxt.options);
  },
});
