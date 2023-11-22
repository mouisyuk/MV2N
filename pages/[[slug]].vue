<template>
  <div>
    RESPONSE:
    <br />
    <br />
    {{ routeData }}
  </div>
</template>

<script setup>
// import { Placeholder as scPlaceholder } from "@sitecore-jss/sitecore-jss-vue";
import { storeToRefs } from "pinia";
import { useMainStore } from "~/store";
import { useRoute } from "vue-router";

const mainStore = useMainStore();
const route = useRoute();
const { routeData } = storeToRefs(mainStore);
const nuxtContext = useNuxtApp();

mainStore.getLayoutData({
  route: route.path,
  nuxtContext: nuxtContext,
  language: "en",
});
</script>
