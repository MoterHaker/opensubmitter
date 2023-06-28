<template>
    <div class="form-settings">
        <div class="form-row">
            <div class="hg2">Settings title</div>
            <div class="setting-desc">Setting subtitle.</div>
            <div class="df alitc gap16">
                Input and button:<br>
                <textfield value="hello world" />
                <div class="btn">Do something</div>
            </div>
            <div style="padding: 20px 0">
                Toggle:<br>
                <app-toggler />
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
                    </tbody>
                </table>
            </div>

            <div style="padding: 10px 0">
                Copy button:
                <btn-icon icon="copy" className="icon16" />
            </div>

            <div style="padding: 10px 0">
                Button with label:
                <btn label="Test me" />
            </div>
            <div style="padding: 10px 0">
                Disabled Button:
                <btn label="Test me" :disabled="true"/>
            </div>
            <div style="padding: 10px 0">
                Button with loader:
                <btn label="Test me" :loading="true"/>
            </div>

        </div>
    </div>
</template>
<script setup>
import Btn from "../components/Btn.vue";
import BtnIcon from "../components/BtnIcon.vue";
import AppToggler from "../components/AppToggler.vue";
import Textfield from "../components/Textfield.vue";
import {onMounted} from "vue";

</script>