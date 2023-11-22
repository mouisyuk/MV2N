import { createLayoutServiceClient } from "../../lib/layoutServiceUtils";
import { getConfig } from "../../temp/config";
import { defineStore } from "pinia";

export default defineStore("mainStore", {
  state: () => {
    return {
      sitecoreContext: {},
      routeData: null,
      currentRoute: "",
      routeDataFetchStatus: "",
      routeDataFetchError: null,
    };
  },
  actions: {
    setLayoutData({ layoutData }) {
      if (!layoutData) return;

      const routeData = layoutData.sitecore && layoutData.sitecore.route;
      this.routeData = routeData;

      const context =
        (layoutData.sitecore && layoutData.sitecore.context) || {};
      this.sitecoreContext = {
        ...context,
        routeName: routeData && routeData.name,
        itemId: routeData && routeData.itemId,
      };
    },
    setCurrentRoute({ route }) {
      this.currentRoute = route;
    },
    setRouteDataFetchStatus({ status, error }) {
      this.routeDataFetchStatus = status;
      this.routeDataFetchError = error;
    },
    getLayoutData({ route, language, nuxtContext }) {
      const config = getConfig();
      const layoutServiceClient = createLayoutServiceClient(config, {
        nuxtContext,
      });

      this.setRouteDataFetchStatus({ status: "loading", error: null });
      return layoutServiceClient
        .getRouteData(route, language)
        .then((layoutData) => {
          this.setLayoutData({ layoutData });
          this.setCurrentRoute({ route });
          this.setRouteDataFetchStatus({ status: "", error: null });
        })
        .catch((error) => {
          if (
            error.response &&
            error.response.data &&
            error.response.data.sitecore
          ) {
            this.setLayoutData({ layoutData: error.response.data });
          }

          this.setCurrentRoute({ route });
          this.setRouteDataFetchStatus({ status: "error", error });
        });
    },
  },
});
