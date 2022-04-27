<script setup>
import {nextTick, onMounted, ref} from "vue";
import {useApi, useStores} from "@directus/extensions-sdk";
import 'rapidoc';

const api = useApi()
const { useUserStore } = useStores()
const userStore = useUserStore()

const container = ref(null)
const schema = ref('')
const token = ref('')
onMounted(async () => {
  console.log(userStore)
  const { data } = await api.get('/server/specs/oas')

  //Retrieve token from user
  const me = await api.get('/users/me', {params: {fields: 'token'}})
  if(me.data?.data?.token){
    token.value  = `Bearer ${me.data.data.token}`;
  }

  nextTick(() => {
    delete(data.paths['/extensions/displays'])
    delete(data.paths['/extensions/interfaces'])
    delete(data.paths['/extensions/layouts'])
    delete(data.paths['/extensions/modules'])

    container.value.loadSpec(data);
  })
})

const mode = ref('light')
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
  mode.value = event.matches ? 'dark' : 'light';
});
</script>

<template>
  <private-view title="API Viewer" small-header class="api-viewer">
    <rapi-doc
        ref="container"
        allow-try="true"
        render-style="read"
        style="height:100vh; width:100%"

        show-header="false"
        :theme="mode"
        bg-color="#161b22"
        primary-color="#8866ff"
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