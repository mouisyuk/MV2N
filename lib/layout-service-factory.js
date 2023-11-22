import { RestLayoutService } from "@sitecore-jss/sitecore-jss-vue";
import { getConfig } from "../temp/config";

export class LayoutServiceFactory {
  create() {
    const config = getConfig();

    // TO:DO when axios will be avaliable for nuxt 3 -> remove nuxtjs-alt/axios and install actual version
    // const nuxtContext = useNuxtApp();

    return new RestLayoutService({
      apiHost: config.sitecoreApiHost,
      apiKey: config.sitecoreApiKey,
      siteName: config.jssAppName,
      configurationName: "jss",
    });
  }
}

export const layoutServiceFactory = new LayoutServiceFactory();
