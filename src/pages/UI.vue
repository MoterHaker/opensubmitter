<template>
    <div class="form-settings">
        <div class="form-row">
            <div class="hg2">Settings title</div>
            <div class="setting-desc">Setting subtitle.</div>
            <div class="df alitc gap16">
                Input and button {{inputValue}}:<br>
                <textfield value="hello world" v-model="inputValue"/>
                <div class="btn">Do something</div>
            </div>
            <div style="padding: 20px 0">
                Toggle:<br>
                <app-toggler />
            </div>
            <div style="padding: 20px 0">
                Progress bar:<br>
                <div class="progress-block">
                    <progress-bar :percents="progressPerc" />
                    <btn label="Stop" @click="progressPerc = 0"></btn>
                </div>
                <div class="df mt8 gap8">
                    <btn label="0" @click="progressPerc = 0"></btn>
                    <btn label="20" @click="progressPerc = 20"></btn>
                    <btn label="50" @click="progressPerc = 50"></btn>
                    <btn label="100" @click="progressPerc = 100"></btn>
                </div>
            </div>


            <div style="padding: 20px 0">
                Thread Statuses:<br>
                <thread-statuses :statuses="threadStatuses" />
            </div>

            <div>
                Table:<br>
                <table class="table-docs">
                    <thead>
                    <tr>
                        <th>
                            Some
                        </th>
                        <th>
                            Table
                        </th>
                        <th>
                            Required
                        </th>
                        <th>
                            Purpose
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <td>name</td>
                        <td>value</td>
                        <td>test</td>
                        <td>cell</td>
                    </tr>
                    <tr>
                        <td>name</td>
                        <td>value</td>
                        <td>test</td>
                        <td>cell</td>
                    </tr>
                    <tr>
                        <td>name</td>
                        <td>value</td>
                        <td>test</td>
                        <td>cell</td>
                    </tr>
                    <tr>
                        <td>name</td>
                        <td>value</td>
                        <td>test</td>
                        <td>cell</td>
                    </tr>
                    <tr>
                        <td>name</td>
                        <td>value</td>
                        <td>test</td>
                        <td>cell</td>
                    </tr>
                    <tr>
                        <td>name</td>
                        <td>value</td>
                        <td>test</td>
                        <td>cell</td>
                    </tr>
                    <tr>
                        <td>name</td>
                        <td>value</td>
                        <td>test</td>
                        <td>cell</td>
                    </tr>
                    <tr>
                        <td>name</td>
                        <td>value</td>
                        <td>test</td>
                        <td>cell</td>
                    </tr>
                    <tr>
                        <td>name</td>
                        <td>value</td>
                        <td>test</td>
                        <td>cell</td>
                    </tr>
                    <tr>
                        <td>name</td>
                        <td>value</td>
                        <td>test</td>
                        <td>cell</td>
                    </tr>
                    <tr>
                        <td>name</td>
                        <td>value</td>
                        <td>test</td>
                        <td>cell</td>
                    </tr>
                    <tr>
                        <td>name</td>
                        <td>value</td>
                        <td>test</td>
                        <td>cell</td>
                    </tr>
                    <tr>
                        <td>name</td>
                        <td>value</td>
                        <td>test</td>
                        <td>cell</td>
                    </tr>
                    </tbody>
                </table>
            </div>

            <div>
                Button with loader:
                <btn label="Test me" :loading="true"/>
            </div>
            <div style="padding: 10px 0">
                Disabled Button:
                <btn label="Test me" :disabled="true"/>
            </div>

        </div>
    </div>
</template>
<script setup lang="ts">
import Btn from "../components/Btn.vue";
import AppToggler from "../components/AppToggler.vue";
import Textfield from "../components/Textfield.vue";
import ProgressBar from "../components/ProgressBar.vue";
import ThreadStatuses from "../components/ThreadStatuses.vue";
import {onMounted, ref} from "vue";

const progressPerc = ref(20)
const inputValue = ref('text');
const threadStatuses = ref<ThreadStatus[]>([{
    thread: 1,
    status: 'checking proxy 8.8.8.1:3000'
},{
    thread: 2,
    status: 'checking proxy 8.8.8.2:3000'
},{
    thread: 3,
    status: 'checking proxy 8.8.8.3:3000'
},{
    thread: 4,
    status: 'checking proxy 8.8.8.4:3000'
},{
    thread: 5,
    status: 'checking proxy 8.8.8.5:3000'
},{
    thread: 6,
    status: 'checking proxy 8.8.8.5:3000'
},{
    thread: 7,
    status: 'checking proxy 8.8.8.5:3000'
},{
    thread: 8,
    status: 'checking proxy 8.8.8.5:3000'
},{
    thread: 9,
    status: 'checking proxy 8.8.8.5:3000'
},{
    thread: 10,
    status: 'checking proxy 8.8.8.5:3000'
},{
    thread: 11,
    status: 'checking proxy 8.8.8.5:3000'
},{
    thread: 12,
    status: 'checking proxy 8.8.8.5:3000'
},{
    thread: 13,
    status: 'checking proxy 8.8.8.5:3000'
},{
    thread: 14,
    status: 'checking proxy 8.8.8.5:3000'
}])

</script>