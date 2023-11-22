<template>
  <div>
    <h1>
      Quote component. Prop Field:
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