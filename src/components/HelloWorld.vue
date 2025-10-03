<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { kokoroWorker } from "../workers/index";
import { type KokoroWorker } from "../workers/kokoro/worker"

let kokorowrkr: KokoroWorker;
const audioSrcs = ref<string[]>([]);
const modelLoaded = ref(false);
const modelGenerating = ref(false);
const currentIndex = ref(0);
const inputText = ref(``)
const textareaRef = ref(null);

/**
 * Breaks a string of text into an array of individual sentences.
 *
 * This function uses a regular expression to identify sentence boundaries
 * based on punctuation (. ! ?). It's designed to be more robust than a simple
 * split, correctly handling most common cases.
 *
 * @param text The input text to be processed.
 * @returns An array of strings, where each element is a sentence. Returns an empty array if the input is empty or null.
 */
function splitIntoSentences(text: string): string[] {
  // Return an empty array if the input is null, undefined, or empty.
  if (!text) {
    return [];
  }

  // Use a regular expression to match sentences.
  // This regex looks for:
  // - A sequence of one or more characters that are NOT a period, question mark, or exclamation mark (`[^.!?]+`)
  // - Followed by one or more of those punctuation marks (`[.!?]+`)
  // The 'g' flag ensures it finds all matches in the string.
  const sentenceMatches = text.match(/[^.!?]+[.!?]+/g);

  // The `match` method can return null if no sentences are found.
  if (!sentenceMatches) {
    // If no standard sentences are found, return the original text as a single-element array, after trimming.
    const trimmedText = text.trim();
    return trimmedText ? [trimmedText] : [];
  }

  // Clean up each matched sentence by trimming leading/trailing whitespace.
  const cleanedSentences = sentenceMatches.map(sentence => sentence.trim());

  return cleanedSentences;
}

async function generateText() {
  modelGenerating.value = true;
  audioSrcs.value = [];
  currentIndex.value = 0;

  if (!kokorowrkr) {
    kokorowrkr = await new kokoroWorker.KokoroWorker();
  }

  for (const sentence of splitIntoSentences(inputText.value)) {
    const audioUrl = await kokorowrkr.textToSpeech(sentence, `af_heart`, 1.0)
    audioSrcs.value.push(audioUrl)
  }

  modelGenerating.value = false;
}

function playNext(index: number) {
  currentIndex.value = index;
  // if there is an audio element, select it by audioPlayer-index id and play it
  const audioPlayer = document.getElementById(`audioPlayer-${index}`);
  if (audioPlayer) {
    audioPlayer.play();
  }
}

onMounted(async () => {
  kokorowrkr = await new kokoroWorker.KokoroWorker();
  await kokorowrkr.init();
  modelLoaded.value = true;
});

</script>

<template>

  <div class="text-3xl font-bold underline">
    <h1>
      Kokoro example
    </h1>
  </div>
  <div class="my-5">
    Instructions:
  </div>

  <div class="w-3/4">
    <textarea v-model="inputText" class="bg-slate-100 border rounded border-b-amber-800 w-full p-1"></textarea>
  </div>

  <div class="my-5">
    <audio v-for="(audioSrc, index) in audioSrcs" :key="index" :id="`audioPlayer-${index}`" :src="audioSrc" 
      :autoplay="index == currentIndex" @ended="playNext(index + 1)" controls></audio>
  </div>
  <button @click="generateText" :disabled="!modelLoaded" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500 disabled:cursor-not-allowed">
    {{ modelLoaded ? (!modelGenerating ? `Generate text`: `...Generating` ): `...Loading Model` }}</button>
</template>
