<script setup>
import {computed, nextTick, onMounted, onUnmounted, ref, watch} from "vue";
import {useApi} from "@directus/extensions-sdk";
import 'rapidoc';

const api = useApi()

const container = ref(null)
const schema = ref('')
const downloadSchema = ref('')
const exclude_directus = ref(true)

const token = ref('')
let reloadToken;

function setToken() {
  token.value = api.defaults.headers.common['Authorization']
}

onMounted(async () => {
  const { data } = await api.get('/server/specs/oas')

  reloadToken = setInterval(setToken, 10000)
  setToken()

  nextTick(() => schema.value = data)
})


watch([schema, exclude_directus], ([schemaSpec, exclude]) => {
  const loadSchema = transformSchema(schemaSpec, exclude)

  if (loadSchema) {
    downloadSchema.value = 'data:application/json;charset=utf-8, ' + encodeURIComponent(JSON.stringify(loadSchema, null, 2));
    container.value.loadSpec(loadSchema);
  }
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


function transformSchema(schemaSpec, exclude = false) {
  if (!schemaSpec) return;
  if (exclude) {
    schemaSpec = JSON.parse(JSON.stringify(schemaSpec))
    if (schemaSpec.servers[0]?.url.includes('localhost') || schemaSpec.servers[0]?.url.includes('0.0.0.0')) {
      schemaSpec.servers[0].url = location.origin
    }

    [].forEach(key => {
      delete(schemaSpec.components.schemas[key])
    })

    schemaSpec.tags = schemaSpec.tags.filter(tag => tag.name.startsWith('Items') && (tag.name = tag.name.replace(/^Items/, '')))

    const newPaths = {}
    for (const path in schemaSpec.paths) {
      if (path.startsWith('/items')) {
        const pathInfo = schemaSpec.paths[path]
        newPaths[path.replace(/^\/items/, '')] = pathInfo
        for (const method in pathInfo) {
          // remove the tag "Items" from the path [method].tags and remove the prefix "Items" from the tags
          pathInfo[method].tags = pathInfo[method].tags.filter(tag => tag !== 'Items').map(tag => tag.replace(/^Items/, ''))

          const operationId = pathInfo[method].operationId
          const summary = operationId.replace(/^createItems/, 'Create ')
            .replace(/^readSingleItems/, 'Get ')
            .replace(/^deleteSingleItems/, 'Delete ')
            .replace(/^readItems/, 'List ')
            .replace(/^updateItems/, 'Update ')
            .replace(/^updateSingleItems/, 'Update ')
            .replace(/^deleteItems/, 'Delete ')
            .replace(/^createSingleItems/, 'Create ')

          pathInfo[method].summary = summary
        }
      }
    }

    schemaSpec.paths = newPaths;
  }

  return schemaSpec
}
</script>

<template>
  <private-view title="API Viewer" small-header class="api-viewer">

    <template #title-outer:append>
			<!--label for="exclude" style="margin: 0 16px;"><input type="checkbox" v-model="exclude_directus" id="exclude" /> Exclude Directus Endpoints</!--label-->
      <v-button style="margin: 0 16px;" x-small outlined download="schema.json" :href="downloadSchema">Download Schema</v-button>
		</template>

    <rapi-doc
      v-if="token"
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

      :server-url="curren"
      api-key-name="Authorization"
      api-key-location="header"
      :api-key-value="token"
    ></rapi-doc>
  </private-view>
</template>

<style>
.api-viewer #navigation .module-nav, .api-viewer #sidebar {
  display: none !important;
}
</style>