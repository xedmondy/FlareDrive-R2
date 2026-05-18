<template>
  <footer class="footer">

    <div class="project-links">
      <strong>Project:</strong><a href="https://github.com/willow-god/FlareDrive-R2" target="_blank"
        rel="noopener noreferrer">FlareDrive-R2</a>
      <strong>Author:</strong><a href="https://github.com/willow-god" target="_blank"
        rel="noopener noreferrer">LiuShen</a>
      <strong>Forked from:</strong><a href="https://github.com/ljxi/Cloudflare-R2-oss" target="_blank"
        rel="noopener noreferrer">Cloudflare-R2-OSS</a>
    </div>

    <div class="powered">Powered by <a href="https://workers.cloudflare.com/" target="_blank"
        rel="noopener noreferrer">Cloudflare Workers</a></div>

    <div style="margin:10px 0;">© 2025 FlareDrive. All rights reserved.</div>
  </footer>
</template>

<script>
export default {
  name: "Footer",
};
</script>


<style scoped>
.footer {
  margin-top: 30px;
  text-align: center;
  padding: 20px;
  background-color: #ffffff77;
  font-size: 16px;
  border-radius: 50% 50% 0 0;

}

.project-links {
  font-size: 14px;
  color: #444;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 15px;
  text-align: center;
}

.project-links a {
  color: #444;
  text-decoration: none;
}

.project-links a:hover {
  color: #222;
}

.powered {
  margin-top: 10px;
  color: #444;
}

.powered a {
  color: #444;
  text-decoration: none;
}

.powered a:hover {
  color: #222;
}
</style>