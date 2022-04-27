<script setup>
import {computed, nextTick, onMounted, onUnmounted, ref} from "vue";
import {useApi} from "@directus/extensions-sdk";
import 'rapidoc';

const api = useApi()

const container = ref(null)
const schema = ref('')

const token = ref('')
let reloadToken;

function setToken() {
  token.value = api.defaults.headers.common['Authorization']
}

onMounted(async () => {
  const { data } = await api.get('/server/specs/oas')

  reloadToken = setInterval(setToken, 10000)
  setToken()

  nextTick(() => {
    delete(data.paths['/extensions/displays'])
    delete(data.paths['/extensions/interfaces'])
    delete(data.paths['/extensions/layouts'])
    delete(data.paths['/extensions/modules'])

    container.value.loadSpec(data);
  })
})

onUnmounted(() => {
  clearInterval(reloadToken)
})

const colorScheme = window.matchMedia('(prefers-color-scheme: dark)')
const mode = ref(colorScheme.matches ? 'dark' : 'light')

colorScheme.addEventListener('change', event => {
  mode.value = event.matches ? 'dark' : 'light';
});

const colors = computed(() => {
  if (mode.value === 'dark') {
    return {
      bg: '#161b22',
      text: '#ffffff',
      primary: '#8866ff',
      navBg: '#21262e',
      navText: '#ffffff',
    }
  } else {
    return {
      bg: '#ffffff',
      text: '#21262e',
      primary: '#8866ff',
      navBg: '#f0f4f9',
      navText: '#161b22',
    }
  }
})
</script>

<template>
  <private-view title="API Viewer" small-header class="api-viewer">
    <rapi-doc
        ref="container"
        allow-try="true"
        render-style="read"
        style="height:100%; width:100%"

        show-header="false"
        :theme="mode"
        :bg-color="colors.bg"
        :primary-color="colors.primary"
        :nav-bg-color="colors.navBg"
        :nav-text-color="colors.navText"

        api-key-name="Authorization"
        api-key-location="header"
        :api-key-value=token
    ></rapi-doc>
  </private-view>
</template>

<style>
.api-viewer #navigation .module-nav, .api-viewer #sidebar {
  display: none !important;
}
</style>