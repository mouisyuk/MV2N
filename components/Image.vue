<template>
  <div>
    <h1>
      Image component. Prop Fields:
    </h1>

    {{
      props
    }}
  </div>
</template>

<script setup>
  const props = defineProps({
    fields: Object
  })
</script>