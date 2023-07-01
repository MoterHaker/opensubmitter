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
                <progress-bar :percents="progressPerc" />
                <br>
                <btn label="0" @click="progressPerc = 0" class="sml-btn"></btn>
                <btn label="20" @click="progressPerc = 20" class="sml-btn"></btn>
                <btn label="50" @click="progressPerc = 50" class="sml-btn"></btn>
                <btn label="100" @click="progressPerc = 100" class="sml-btn"></btn>
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

<!--            <div style="padding: 10px 0">-->
<!--                Copy button:-->
<!--                <btn-icon icon="copy" className="icon16" />-->
<!--            </div>-->

<!--            <div style="padding: 10px 0">-->
<!--                Button with label:-->
<!--                <btn label="Test me" />-->
<!--            </div>-->
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
import BtnIcon from "../components/BtnIcon.vue";
import AppToggler from "../components/AppToggler.vue";
import Textfield from "../components/Textfield.vue";
import ProgressBar from "../components/ProgressBar.vue";
import {onMounted, ref} from "vue";

const progressPerc = ref(20)
const inputValue = ref('text');

</script>

<style scoped>
.sml-btn {
    width: 50px;
    display: inline-block;
    margin-left: 10px;
}
</style>