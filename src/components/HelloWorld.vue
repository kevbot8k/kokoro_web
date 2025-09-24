<script setup lang="ts">
import { ref } from 'vue'
import { kokoroWorker } from "../workers/index";


async function generateText() {
  const kokorowrkr = await new kokoroWorker.KokoroWorker();
}

</script>

<template>

  <div class="">
    <p>
      Kokoro example
    </p>
  </div>

  <div>
    <audio id="audioPlayer" controls></audio>
  </div>
</template>
