<template>
  <div ref="el" :style="{ width: '100%', height }"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import * as echarts from 'echarts';

const props = defineProps({
  option: { type: Object, required: true },
  height: { type: String, default: '260px' },
});

const el = ref(null);
let chart = null;
let ro = null;

async function render() {
  await nextTick();
  if (!el.value) return;
  if (!chart) chart = echarts.init(el.value);
  chart.setOption(props.option, true);
}

onMounted(() => {
  render();
  ro = new ResizeObserver(() => chart && chart.resize());
  if (el.value) ro.observe(el.value);
});
watch(() => props.option, render, { deep: true });
onBeforeUnmount(() => {
  ro && ro.disconnect();
  chart && chart.dispose();
  chart = null;
});
</script>
