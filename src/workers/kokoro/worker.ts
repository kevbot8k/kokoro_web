import { KokoroTTS } from "./kokoro.js";
import { expose } from "comlink";

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
        try {
            const adapter = navigator.gpu.requestAdapter();
            return !!adapter;
        } catch {
            return false;
        }
    }

    async textToSpeech(text: string, voice: string, speed: number) {
        if (!this.tts) {
            await this.init();
        }
        const audio = await this.tts?.generate(text, { voice, speed });

        return audio;
    }
}

expose({
    KokoroWorker
})