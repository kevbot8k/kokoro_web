<script setup lang="ts">
import { onMounted, ref, watch, nextTick, onUnmounted } from 'vue'
import { kokoroWorker } from "../workers/index";
import { type KokoroWorker } from "../workers/kokoro/kokoroWorker";
import { combineAudios } from '../utils/audio';

interface AudioSentencePair {
  audioSrc: string;
  sentence: string;
}

let kokorowrkr: KokoroWorker;
const audioSrcs = ref<AudioSentencePair[]>([]);
const combinedAudio = ref();
const modelLoaded = ref(false);
const modelGenerating = ref(false);
const currentIndex = ref(0);
const inputText = ref(``);
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

function freeObjectURLs() {
  for (const audioSrc of audioSrcs.value) {
    URL.revokeObjectURL(audioSrc.audioSrc);
  }
  if (combinedAudio.value) {
    URL.revokeObjectURL(combinedAudio.value);
  }
}

function reset() {
  freeObjectURLs();
  combinedAudio.value = null;
  modelGenerating.value = true;
  audioSrcs.value = [];
  currentIndex.value = 0;
}

async function generateText() {
  reset();

  if (!kokorowrkr) {
    kokorowrkr = await new kokoroWorker.KokoroWorker();
  }

  for (const sentence of splitIntoSentences(inputText.value)) {
    const audioUrl = await kokorowrkr.textToSpeech(sentence, `af_heart`, 1.0)
    audioSrcs.value.push({
      audioSrc: audioUrl,
      sentence: sentence
    })
  }

  modelGenerating.value = false;
  // combine audio via WAV Urls
  // combinedAudio.value = await audioCombiner.combineAudios(audioSrcs.value.map(audioSrc => audioSrc.audioSrc));
  combinedAudio.value = await combineAudios(audioSrcs.value.map(audioSrc => audioSrc.audioSrc));
  console.log(combinedAudio.value.length)

}

function getAudioPlayer(index: number): HTMLAudioElement {
  return document.getElementById(`audioPlayer-${index}`) as HTMLAudioElement;
}


function playNext(index: number) {
  // if audioPlayer-currentIndex is still playing, stop it
  const previousAudioPlayer = getAudioPlayer(currentIndex.value);
  if (previousAudioPlayer) {
    previousAudioPlayer.pause();
    previousAudioPlayer.currentTime = 0;
  }

  currentIndex.value = index;
  // if there is an audio element, select it by audioPlayer-index id and play it
  const audioPlayer = getAudioPlayer(index);
  if (audioPlayer) {
    audioPlayer.play();
    audioPlayer.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

onMounted(async () => {
  kokorowrkr = await new kokoroWorker.KokoroWorker();
  await kokorowrkr.init();
  modelLoaded.value = true;
  // audioCombiner = await new kokoroWorker.AudioCombiner();
});

onUnmounted(() => {
  freeObjectURLs();
});

watch(() => audioSrcs.value.length, async (newLength, oldLength) => {
  // Only proceed if an item was added.
  if (newLength > oldLength) {
    // Wait for Vue to update the DOM.
    await nextTick();

    // playNext item
    if (currentIndex.value + 1 == audioSrcs.value.length) {
      playNext(currentIndex.value);
    }
  }
});

</script>

<template>

  <div class="text-3xl font-bold underline">
    <h1>
      Read It To Me - using Kokoro Text-to-Speech Model
    </h1>
  </div>
  <div class="my-5 w-3/4 max-h-1/3">
    <section class="mb-8">
      <h2 class="text-2xl font-bold text-slate-800">What This Website Does 🎙️</h2>
      <p class="text-slate-600 leading-relaxed">
        This website converts any text you type or paste into it into spoken words. It uses a special text-to-speech
        model called Kokoro, which is designed to sound natural and expressive.
      </p>
    </section>

    <section class="mb-8">
      <h2 class="text-2xl font-bold text-slate-800">The Key Benefit to You 🔒</h2>
      <p class="text-slate-600 leading-relaxed">
        The main advantage of this tool is <strong class="font-semibold text-slate-900">privacy</strong>. All the
        processing happens <strong class="font-semibold text-slate-900">locally</strong> on your computer, within your
        browser. This means that the text you enter is never sent over the internet to a server, keeping your
        information completely private.
      </p>
    </section>

    <section>
      <h2 class="text-2xl font-bold text-slate-800">How to Use This Site 🚀</h2>
      <ol class="list-decimal list-inside space-y-4 text-slate-600">
        <li>
          <strong class="font-semibold text-slate-700">Enter your text:</strong> Type or paste the text you want to hear
          into the main text box at the top of the page.
        </li>
        <li>
          <strong class="font-semibold text-slate-700">Automatic conversion:</strong> The website will automatically
          begin processing the text as you type. It breaks down the text into individual sentences and converts each one
          into audio.
        </li>
        <li>
          <strong class="font-semibold text-slate-700">Listen to the audio:</strong>
          <ul class="list-disc list-inside mt-2 ml-4 space-y-2">
            <li>You can listen to each sentence separately by clicking the play button next to it.</li>
            <li>To listen to the entire text as a single audio file, use the "Combined Audio" player at the top.</li>
          </ul>
        </li>
        <li>
          <strong class="font-semibold text-slate-700">Generate new text:</strong> If you want to start over with new
          text, you can click the "Generate text" button to clear the current text and audio.
        </li>
      </ol>
    </section>
  </div>

  <div class="w-3/4 max-h-1/3">
    <textarea v-model="inputText" class="bg-white border rounded border-b-amber-800 w-full p-1 max-h-full"
      placeholder="Enter text here..." rows="10"></textarea>
  </div>

  <div v-if="combinedAudio">
    Combined Audio
    <audio :src="combinedAudio" controls></audio>
  </div>

  <div class="my-5 max-h-50vh overflow-y-auto max-w-3/4 ">
    <div class="justify-center flex flex-col items-center">
      <div v-for="(audioSrc, index) in audioSrcs" :key="index"
        class="w-3/4 min-w-sm flex flex-col items-center bg-slate-50 hover:bg-blue-50 cursor-pointer rounded border my-2"
        :class="{ 'bg-orange-100!': currentIndex == index }" @click="playNext(index)">
        <p class="w-full px-2 py-1">{{ audioSrc.sentence }}</p>
        <audio :id="`audioPlayer-${index}`" :src="audioSrc.audioSrc" @ended="playNext(index + 1)" controls></audio>
      </div>
    </div>
  </div>
  <button @click="generateText" :disabled="!modelLoaded"
    class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500 disabled:cursor-not-allowed">
    {{ modelLoaded ? (!modelGenerating ? `Generate text` : `...Generating`) : `...Loading Model` }}</button>
</template>
