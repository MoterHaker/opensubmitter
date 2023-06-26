<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ msg: string }>()

const count = ref(0)
const response = ref('')
const ipcRenderer = window.require('electron').ipcRenderer;

function clickTest() {
    ipcRenderer.send('hello', ['one', 'two', 'three']);
}
ipcRenderer.on('nice', (e, data) => {
    console.log('received response:', data); //['one','two','three']
    response.value = response.value + data.toString() + "\n";
})
</script>

<template>
  <h1>{{ msg }}</h1>

  <div class="card">
    <button type="button" @click="count++">count is {{ count }}</button>
    <p>
      Edit
      <code>components/HelloWorld.vue</code> to test HMR
        <button @click="clickTest">test message</button>
    </p>
  </div>

  <div class="card">
      <textarea v-model="response" cols="50" rows="10"></textarea>
  </div>

</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
