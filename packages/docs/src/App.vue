<script setup lang="ts">
import { Icon } from '@iconify/vue';
</script>

<template>
  <main class="glassmorphism">
    <img src="./assets/icon.png" class="logo" />
    <h1>Torepe</h1>
    <a class="download" href="https://github.com/nekobato/Torepe/releases/latest/download/Torepe-arm64.dmg">
      <Icon icon="mingcute:apple-fill" class="icon" />
      <span>Download for Mac</span>
    </a>
    <p class="description">
      Torepeは、デザイナーやフロントエンド開発者向けのシンプルなアプリです。<br />
      画面上から切り取った画像を任意の位置に半透明で表示することで、任意のデザインデータを実装中の画面上に重ね合わせ、デザインの精度を確認することが可能になります。<br />
    </p>
  </main>
</template>

<style scoped>
main {
  margin: auto;
  padding: 0 16px 32px;
  width: 360px;
  height: calc(100vh - 32px);
  border: 1px solid #ddd;
  border-radius: 16px;
  text-align: left;
  font-size: 14px;
  overflow-y: scroll;
  font-family: PixelMplus12;
  color: #252525;
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
  background: #f5f5f5;
}
.logo {
  width: 160px;
  height: 160px;
  margin: 16px auto 0;
}
h1 {
  font-size: 2rem;
  font-weight: 500;
  margin: 16px auto 0;
  text-align: center;
}
.download {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 32px auto 0;
  padding: 8px 16px;
  width: 100%;
  height: 48px;
  border-radius: 8px;
  background: #fff;
  color: #424242;
  text-decoration: none;
  font-size: 1rem;
  font-weight: 500;
  border: 1px solid rgba(0, 0, 0, 0.32);
}
.icon {
  position: absolute;
  left: 16px;
  width: 24px;
  height: 24px;
  margin-right: 8px;
  color: #828282;
}
.description {
  margin: 32px auto 0;
  font-size: 1rem;
  line-height: 1.5;
}
.glassmorphism {
  /* From https://css.glass */
  background: rgba(255, 255, 255, 0.4);
  border-radius: 16px;
  box-shadow: 0 4px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.32);
}

</style>
