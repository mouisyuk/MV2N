const bodyParser = require("body-parser");
const cors = require("cors");
// const WebpackRequireFromPlugin = require("webpack-require-from");
const {
  getJssRenderingHostMiddleware,
} = require("./nuxt-jss-rendering-host-middleware");
// TODO: attach jss config to Nuxt config or module options
const {
  getConfig: getJssConfigRenderingHost,
} = require("../../../temp/jss-config-rendering-host");

export default function initialize(moduleOptions, nuxt) {
  if (!moduleOptions.enabled) {
    return;
  }

  // In Nuxt modules, the current Nuxt instance is available via `this.nuxt`.
  const nuxtApp = nuxt;

  // In Nuxt modules, Nuxt config (nuxt.config.js) is available via `this.options`.

  setupMiddleware(nuxtApp, moduleOptions);
  configureHooks(nuxtApp, moduleOptions.resolveRenderingHostPublicUrl);
}

function setupMiddleware(nuxtApp, { renderingHostListenRoute }) {
  const jssConfig = getJssConfigRenderingHost();
  if (!jssConfig) {
    console.warn(
      "JSS config was not provided to JSS rendering host, therefore JSS rendering host middleware is disabled."
    );
    return;
  }

  const renderingHostConfig = {
    app: nuxtApp,
    jssConfig,
  };

  // We use the `render:setupMiddleware` Nuxt hook instead of `this.addMiddleware` because using
  // `this.addMiddleware` results in a `server.use(middleware)` call. However, for rendering host
  // we specifically only want to add the middleware for POST requests to `renderingHostListenRoute`.
  // NOTE: the `render:setupMiddleware` hook is fired before any other middleware are registered.
  nuxtApp.hook("render:setupMiddleware", async (server) => {
    server.use(cors());

    // Setup body parsing middleware for incoming POST requests.
    const jsonBodyParser = bodyParser.json({
      limit: "2mb",
    });

    // Setup the JSS rendering host route.
    // By default, Sitecore will use the `/jss-render` route, but this can be configured via
    // JSS app config, e.g. `<app serverSideRenderingEngineEndpointUrl="" />`.
    // So we allow `renderingHostRoute` to be configured via `moduleOptions` so that devs
    // can configure the middleware to match the path configured in Sitecore.
    const resolvedRenderingHostListenRoute =
      renderingHostListenRoute || "/jss-render";
    server.post(
      resolvedRenderingHostListenRoute,
      jsonBodyParser,
      getJssRenderingHostMiddleware(renderingHostConfig)
    );
  });
}

function configureHooks(nuxtApp, resolveRenderingHostPublicUrl) {
  // When the rendering host middleware executes, it renders the Nuxt app and sends the generated
  // HTML back to Sitecore for serving. By default, all Nuxt/Webpack-generated assets are referenced
  // via relative URLs, e.g. `/_nuxt/runtime.js`. However, because the HTML will be served by Sitecore,
  // the HTML _must_ use absolute URLs to reference Nuxt/Webpack-generated assets,
  // e.g. `http://localhost:3000/_nuxt/runtime.js`, otherwise the browser won't be able to resolve the URLs.
  //
  // Nuxt/Webpack provide a setting named `publicPath` that normally solves this problem. If you provide
  // a value for `publicPath` it will be prepended to any URLs for Nuxt/Webpack-generated assets.
  // However, you can only set `publicPath` at build time or app start time. This is a problem for
  // JSS Rendering Host because the URL for the rendering host may not be known at build/start time
  // and the URL may be different from the URL that the Nuxt web server is running on.
  //
  // Therefore, we want to be able to both declare a `publicPath` and prepend asset URLs on a per-request basis.
  // To do this, we use a combination of webpack config modification (in the configureWebpack method above) as
  // well as intercepting <script /> and <link /> tag rendering.

  // The issue stems from this function in the `vue-ssr-renderer` package:
  // https://github.com/vuejs/vue/blob/e8ca21ff1d7af92649902952c97418ad3ffd014f/src/server/template-renderer/index.js#L86
  // That function binds the `renderStyles` and `renderScripts` methods of the Vue SSR `renderContext`
  // object to the `TemplateRenderer` instance, and we can't get access to the `TemplateRenderer` instance
  // at runtime, and therefore can't change the `TemplateRenderer.publicPath` property dynamically.

  // The `vue-renderer:ssr:context` hook fires just after the Nuxt app is rendered.
  // At this point, the html of the app _body_ has been rendered to string.
  // However, <script />, <link /> and preload/prefetch elements have not been
  // rendered to the <head /> element yet. So, we can intercept the calls that render
  // the <script /> and <link /> tags and use regex replacement to prepend asset URLs with
  // the rendering host public URL.
  nuxtApp.hook("vue-renderer:ssr:context", async (renderContext) => {
    if (!renderContext.isJssRenderingHostRequest) {
      return;
    }

    // If there is a `jssConfig` attached to the `req` object, assign it to the `renderContext.nuxt` object.
    // This makes the `jssConfig` available as a property on the SSR state object that is serialized to
    // the HTML document via `__NUXT__`.
    // This behavior useful for ensuring the rendering host JSS config is available to client code and we can
    // use the rendering host JSS config to override the runtime config values when necessary.
    if (renderContext.req.jssConfig) {
      renderContext.nuxt.jssConfig = renderContext.req.jssConfig;
    }

    const publicPath = resolveRenderingHostPublicUrl();

    // Prepend rendering host public path to <script /> `src` values.
    const originalRenderScripts = renderContext.renderScripts;
    renderContext.renderScripts = () => {
      const scripts = originalRenderScripts();

      const newScripts = scripts.replace(
        /(<script[^>]+)src="([^">]+)"/gim,
        `$1src="${publicPath}$2"`
      );
      return newScripts;
    };

    // Prepend rendering host public path to <link /> `href` values.
    const originalRenderStyles = renderContext.renderStyles;
    renderContext.renderStyles = () => {
      const styles = originalRenderStyles();

      const newStyles = styles.replace(
        /(<link[^>]+)href="([^">]+)"/gim,
        `$1src="${publicPath}$2"`
      );
      return newStyles;
    };

    // Prepend rendering host public path to <script /> or <link /> "prefetch" or "preload" tags.
    const originalRenderResourceHints = renderContext.renderResourceHints;
    renderContext.renderResourceHints = () => {
      const resourceHints = originalRenderResourceHints();

      const newResourceHints = resourceHints.replace(
        /(<(script|link)[^>]+)(src|href)="([^">]+)"/gim,
        `$1$3="${publicPath}$4"`
      );
      return newResourceHints;
    };
  });

  nuxtApp.hook(
    "vue-renderer:ssr:templateParams",
    async (templateParams, renderContext) => {
      if (!renderContext.isJssRenderingHostRequest) {
        return;
      }

      // Add a `window.__nuxt_public_path__` variable to the outgoing HTML.
      // This allows the WebpackRequireFrom plugin to do its thing.
      const publicPathScript = `<script>window.__nuxt_public_path__ = '${resolveRenderingHostPublicUrl()}${
        nuxtApp.renderer.publicPath
      }';</script>`;

      templateParams.HEAD += publicPathScript;
    }
  );
}
