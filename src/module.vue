<script setup>
import { useApi } from "@directus/extensions-sdk";
import 'rapidoc';
import { computed, onMounted, onUnmounted, ref, watch } from "vue";

const api = useApi()

const loading = ref('')
const container = ref(null)
const schema = ref('')
const downloadSchema = ref('')
const incl_directus = ref(true)
const incl_items = ref(true)

const token = ref('')
function getTokenFromHeader() {
  token.value = api.defaults.headers.common['Authorization']
}

async function fetchSchema() {
  loading.value = 'Fetching schema...';
  const { data } = await api.get('/server/specs/oas', {
    headers: {
      'Authorization': `${token.value}`
    }
  })
  
  schema.value = data;
}

onMounted(() => {
  loading.value = 'Starting up...';
  getTokenFromHeader()
})

// Watch and debounce the token value changing before calling the fetchSchema
let reloadToken;
watch(token, (T) => {
  clearInterval(reloadToken)
  if (!T) return;

  reloadToken = setTimeout(() => {
    fetchSchema()
  }, 1000)
}, { immediate: true })
onUnmounted(() => {
  clearInterval(reloadToken)
})

let debounceParsing;
watch([schema, incl_directus, incl_items], ([schemaSpec, incl_directus, incl_items]) => {
  loading.value = 'Parsing schema...';
  clearTimeout(debounceParsing)
  debounceParsing = setTimeout(() => {
    const loadSchema = transformSchema(schemaSpec)

    if (loadSchema) {
      downloadSchema.value = 'data:application/json;charset=utf-8, ' + encodeURIComponent(JSON.stringify(loadSchema, null, 2));
      container.value.loadSpec(loadSchema);
    }

    loading.value = '';
  }, 50);
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

const camelToSpaced = /([A-Z])([A-Z])([a-z])|([a-z])([A-Z])/g;
function formatLabel(str) {
  return str.replace(camelToSpaced, '$1$4 $2$3$5')
}

function transformSchema(schemaSpec) {
  if (!schemaSpec) return;
  schemaSpec = JSON.parse(JSON.stringify(schemaSpec))
  if (!incl_directus.value) {
    if (schemaSpec.servers[0]?.url.includes('localhost') || schemaSpec.servers[0]?.url.includes('0.0.0.0')) {
      schemaSpec.servers[0].url = location.origin
    }

    [].forEach(key => {
      delete(schemaSpec.components.schemas[key])
    })

    schemaSpec.tags = schemaSpec.tags.filter(tag => {
      if (tag.name.startsWith('Items')) {
        tag.name = formatLabel(incl_items.value ? tag.name : tag.name.replace(/^Items/, ''))
        return true;
      }
    });

    const newPaths = {}
    for (const path in schemaSpec.paths) {
      if (path.startsWith('/items')) {
        const pathInfo = schemaSpec.paths[path]
        const newPath = incl_items.value ? path : path.replace(/^\/items/, '')
        newPaths[newPath] = pathInfo

        for (const method in pathInfo) {
          // remove the tag "Items" from the path [method].tags and remove the prefix "Items" from the tags
          pathInfo[method].tags = pathInfo[method].tags.filter(tag => tag !== 'Items').map(tag => {
            return formatLabel(incl_items.value ? tag : tag.replace(/^Items/, ''))
          })

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
  } else {
    schemaSpec.tags.forEach(tag => {
      tag.name = formatLabel(incl_items.value ? tag.name : tag.name.replace(/^Items/, ''))
    });
    for (const path in schemaSpec.paths) {
      const pathInfo = schemaSpec.paths[path]
      for (const method in pathInfo) {
        pathInfo[method].tags = pathInfo[method].tags.map(tag => formatLabel(incl_items.value ? tag : tag.replace(/^Items/, '')))
      }
    }
  }

  return schemaSpec
}
</script>

<template>
  <private-view title="API Viewer" small-header class="api-viewer">

    <template #title-outer:append>			
      <v-button style="margin: 0 16px;" x-small outlined download="schema.json" :href="downloadSchema">Download Schema</v-button>

      <v-menu show-arrow placement="bottom-end">
				<template #activator="{ toggle }">
					<v-icon v-tooltip="'Toggle options'" name="filter_alt" clickable @click="toggle" />
				</template>

				<v-list class="monospace">
					<v-list-item>
            <v-checkbox v-model="incl_directus" label="Directus Endpoints" />
					</v-list-item>
          <v-list-item v-tooltip="`Remove 'items' from url path and title`">
            <v-checkbox v-model="incl_items" label="Items Prefix" />            
					</v-list-item>
				</v-list>
			</v-menu>
		</template>

    <template #actions:prepend>
      <v-input v-model="token" placeholder="Bearer token including prefix" small />
      <v-button  icon small @click="getTokenFromHeader" v-tooltip="'Get current user token'" style="margin: 0 16px;">
        <v-icon name="refresh" />
      </v-button>
    </template>

    <v-info v-if="loading"
      style="margin 4rem auto; padding: 4rem 0"
    >
      <v-progress-circular indeterminate style="margin: 1rem auto;" />
      <p style="margin: 1rem">{{ loading }}</p>
    </v-info>

    <rapi-doc
      v-if="schema"
      v-show="!loading"
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

      :server-url="undefined"
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