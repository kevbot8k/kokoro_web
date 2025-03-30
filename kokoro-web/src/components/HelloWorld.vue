<script setup lang="ts">
import { ref } from 'vue'
import { KokoroTTS } from "kokoro-js";

const model_id = "onnx-community/Kokoro-82M-v1.0-ONNX";
const useWebGPU = await detectWebGPU();
const tts = await KokoroTTS.from_pretrained(model_id, {
  dtype: "q8", // Options: "fp32", "fp16", "q8", "q4", "q4f16"
  device: useWebGPU ? "webgpu" : "wasm", // Options: "wasm", "webgpu" (web) or "cpu" (node). If using "webgpu", we recommend using dtype="fp32".
});

const text = "Life is like a box of chocolates. You never know what you're gonna get.";
const audio = await tts.generate(text, {
  // Use `tts.list_voices()` to list all available voices
  voice: "af_heart",
});
audio.save("audio.wav");
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
