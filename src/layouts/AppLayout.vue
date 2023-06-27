<template>
    <div>
<!--        <component :is="modalToShow" />-->
        <div class="df">
            <div class="col-side-nav">
                <router-link to="/dashboard">Task Manager</router-link>
                <router-link to="/templates">Templates</router-link>
                <router-link to="/uikit">UI kit</router-link>
            </div>
            <div class="col-content">
                <router-view />
            </div>
        </div>
    </div>

</template>

<script setup>
</script>

<style lang="less" scoped>
@import '../assets/css/vars.less';

.col-side-nav {
  display: flex;
  flex-direction: column;
  width: 124px;
  margin-right: 26px;
  margin-left: 40px;
  padding-top: 16px;
  a {
    padding: 16px 0;
    color: rgba(255,255,255,.6);
    text-decoration: none;
    &.router-link-exact-active {
      color: @selected;
      text-decoration: none;
    }
  }
}
.col-content {
  flex: 1;
  padding-right: 40px;
  padding-top: 40px;
  padding-bottom: 40px;
}

@media (max-width: @phones-portrait) {
  .col-side-nav {
    position: fixed;
    background: #332E2B;
    z-index: 2;
    flex-direction: row;
    bottom: @headerHeightBottom;
    margin: 0;
    padding: 0;
    width: auto;
    overflow: auto;
    font-size: 14px;
    width: 100%;
    a {
      padding: 12px 16px;
      white-space: nowrap;
    }
  }
  .col-content {
    padding: 24px;
    padding-bottom: 120px;
  }
}
</style>
