<template>
    <div>
        <div class="template-info">
            <div class="col-desc">
                <div class="desc">
                    Check your proxies for availability and speed at google.com search page
                </div>
                <div class="meta">
                    Submitted: 24.05.2023<br>
                    Updated: 27.05.2023<br>
                    <a href="">author@email.com</a>
                </div>
            </div>
            <div class="col-stats">
                <div class="col">
                    <div class="statname">Views</div>
                    <div class="statval">2,569</div>
                </div>
                <div class="col">
                    <div class="statname">Downloads</div>
                    <div class="statval">55,698</div>
                </div>
                <div class="col">
                    <div class="statname">Runs</div>
                    <div class="statval">658,458</div>
                </div>
            </div>
        </div>
        <div class="source">
            Source code:
            <source-code class="mt8" :code="code" />
        </div>
    </div>
</template>
<script setup lang="ts">
import SourceCode from "../components/SourceCode.vue"
const code = `{
    "errorId":0,
    "status":"ready",
    "solution":
    {
        "gRecaptchaResponse":"3AHJ_VuvYIBNBW5yyv0zRYJ75VkOKvhKj9_xGBJKnQimF72rfoq3Iy-DyGHMwLAo6a3" "gRecaptchaResponse":"3AHJ_VuvYIBNBW5yyv0zRYJ75VkOKvhKj9_xGBJKnQimF72rfoq3Iy-DyGHMwLAo6a3"
    },
    "cost":"0.001500",
    "ip":"46.98.54.221",
    "createTime":1472205564,
    "endTime":1472205570,
    "solveCount":"0"
}
`
</script>
<style lang="less" scoped>
.template-info {
    display: flex;
    gap: 60px
}
.desc {
    font-size: 18px;
    margin-bottom: 24px;
}
.meta {
    font-size: 13px;
    line-height: 1.8;
    opacity: 0.7;
}
.col-desc {
    flex-basis: 50%;
}
.col-stats {
    display: flex;
    gap: 32px;
}
.source {
    margin-top: 32px;
}
</style>