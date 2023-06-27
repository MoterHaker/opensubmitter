<template>
    <div class="example-code">
        <div class="tabs-list" v-if="tabs.length > 1">
            <div
                :class="[active == index ? 'active' : '']"
                class="tab-title"
                v-for="(tab, index) in tabs"
                :key="index"
                @click="switchTab(index)">
                {{ tab.$el.childNodes[0].innerText }}
            </div>
        </div>
        <div class="body">
            <slot name="content" />
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            tabs: '',
            active: 0
        }
    },
    methods: {
        switchTab(index) {
            this.active = index
            this.tabs.forEach(tab => {
                tab.$el.classList.remove('active');
            })
            this.tabs[index].$el.classList.add('active');
        }
    },
    mounted() {
        const renderedSlot = this.$children;
        this.tabs = renderedSlot;
        renderedSlot[this.active].$el.classList.add('active');
        // const tabss = this.$children;
        // tabss[0].$el.classList.add('active');
    }
}
</script>

<style lang="less" scoped>
@import '~assets/css/vars.less';

pre, code {
  margin: 0;
  padding: 0;
}
.tabs-list {
  display: flex;
  padding-top: 8px;
  padding-left: 8px;
  padding-bottom: 8px;
  gap: 8px;
//   background: rgba(255,255,255,0.1);
  background: lighten(#282C34, 5%);
  border-radius: 4px 4px 0 0;
  .tab-title {
    padding: 3px 6px;
    margin-right: -2px;
    cursor: pointer;
    font-size: 12px;
    transition: border-width 0.2s linear;
    color: rgba(255,255,255,.5);
    &.active {
      color: #000;
      border-radius: 4px;
      background-color: @selected;
      transition: background 0.2s linear;
    }
  }
}

.body {
  direction: ltr !important;
  padding: 0px;
  font-family: "Consolas","Bitstream Vera Sans Mono","Courier New",Courier,monospace;
}
</style>
