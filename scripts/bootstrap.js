import jssConfig from "../scjssconfig.json" assert { type: "json" };
import {
  generateRuntimeConfig,
  generateRenderingHostConfig,
  generateSitecoreProxyConfig,
} from "./generate-config.js";

/*
    BOOTSTRAPPING
    The bootstrap process runs before build, and generates JS that needs to be
    included into the build - specifically, the component name to component mapping,
    and the global config module(s).
  */

// Resolve execution modes
const isExport = process.env.NUXT_EXPORT === "true";

/*
    CONFIG GENERATION
    Generates the /src/temp/config.js file which contains runtime configuration
    that the app can import and use.
  */
const runtimeConfigOverrides = getRuntimeConfigOverrides();
generateRuntimeConfig(runtimeConfigOverrides);

// Rendering Host config generation can be removed / disabled if rendering host is not being used.
generateRenderingHostConfig();

// Sitecore Proxy config generation can be removed / disabled if Sitecore proxy is not being used.
generateSitecoreProxyConfig();

/*
    COMPONENT FACTORY GENERATION
  */
// require("./generate-component-factory");

function getRuntimeConfigOverrides() {
  const configOverride = {};

  if (isExport) {
    const siteName = process.env.API_SITENAME;

    if (siteName) {
      configOverride.sitecoreSiteName = siteName;
    }

    const apiKey = jssConfig.sitecore.apiKey;
    if (apiKey) {
      configOverride.apiKey = apiKey;
    }

    const layoutServiceHost = jssConfig.sitecore.layoutServiceHost;
    if (layoutServiceHost) {
      configOverride.sitecoreApiHost = layoutServiceHost;
    }
  }

  return configOverride;
}
