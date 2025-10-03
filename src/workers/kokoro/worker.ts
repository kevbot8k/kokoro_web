import { KokoroTTS } from "./kokoro.js";
import { expose } from "comlink";
import { type RawAudio } from "@huggingface/transformers";
import { WaveFile } from "wavefile";

export class KokoroWorker {
    tts: KokoroTTS | null;

    constructor() {
        this.tts = null;
    }

    async init() {
        const model_id = "onnx-community/Kokoro-82M-v1.0-ONNX";
        const device = (await this.detectWebGPU()) ? "webgpu" : "wasm";
        this.tts = await KokoroTTS.from_pretrained(model_id, {
            dtype: "q8",
            device: device,
        });
    }

    private detectWebGPU() {
        return false;
        // try {
        //     const adapter = navigator.gpu.requestAdapter();
        //     return !!adapter;
        // } catch {
        //     return false;
        // }
    }

    async textToSpeech(text: string, voice: string, speed: number) {
        if (!this.tts) {
            await this.init();
        }
        const audio: RawAudio = await this.tts?.generate(text, { voice, speed });
        const audioUrl = URL.createObjectURL(audio.toBlob());
        return audioUrl;
    }
}

export class AudioCombiner {
    sampleRate: number;
    numberOfChannels: number;

    constructor(sampleRate: number = 24000, numberOfChannels: number = 1) {
        this.sampleRate = sampleRate;
        this.numberOfChannels = numberOfChannels;
    }

    /**
     * Combines multiple WAV audio files from object URLs into a single file.
     * @param audioURLs An array of object URLs for the WAV files.
     * @returns A promise that resolves with a new object URL for the combined WAV file.
     */
    async combineAudios(audioURLs: string[]): Promise<string> {
        // 1. Decode all audio files and collect their sample data
        const allSampleChunks: Float32Array[] = [];

        for (const url of audioURLs) {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();

            // The wavefile library works with Uint8Array
            const audioData = new Uint8Array(arrayBuffer);

            // Load the audio data into a temporary WaveFile object
            const tempWav = new WaveFile();
            tempWav.fromBuffer(audioData);

            // The TTS generates 32-bit float audio.
            // Ensure we work with this format consistently.
            tempWav.toBitDepth('32f');

            // getSamples(false) for de-interleaved channels.
            const samples = tempWav.getSamples(false) as Float32Array[];
            if (samples.length > 0) {
                // We assume mono audio, so we take the first channel.
                allSampleChunks.push(samples[0]);
            }
        }

        if (allSampleChunks.length === 0) {
            throw new Error("No valid audio files to combine.");
        }

        // 2. Concatenate all sample chunks into a single Float32Array
        const totalLength = allSampleChunks.reduce((len, chunk) => len + chunk.length, 0);
        const concatenatedSamples = new Float32Array(totalLength);

        let offset = 0;
        for (const chunk of allSampleChunks) {
            concatenatedSamples.set(chunk, offset);
            offset += chunk.length;
        }

        // Clean up the original object URLs to free memory
        audioURLs.forEach(URL.revokeObjectURL);

        // 3. Create a new WaveFile from scratch with the combined samples
        const combinedWav = new WaveFile();

        // Create a 32-bit float WAV file.
        combinedWav.fromScratch(this.numberOfChannels, this.sampleRate, '32f', concatenatedSamples);

        // 4. Convert the new WaveFile to a buffer and create a Blob
        const wavBuffer: Uint8Array = combinedWav.toBuffer();
        const audioUrl = URL.createObjectURL(wavBuffer);

        return audioUrl;
    }
}

expose({
    KokoroWorker,
    AudioCombiner
})