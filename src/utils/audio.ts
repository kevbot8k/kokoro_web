import { read_audio } from "@huggingface/transformers";

/**
 * A utility class to encode raw audio samples into a WAV file buffer.
 * This class handles the creation of the WAV header and combining it
 * with the provided audio data.
 */
class WaveEncoder {
    /**
     * Encodes PCM audio data into a WAV format Uint8Array.
     * @param options - The audio data and format parameters.
     * @param options.samples - The raw audio samples as a Float32Array.
     * @param options.sampleRate - The sample rate of the audio (e.g., 24000).
     * @param options.numChannels - The number of audio channels (e.g., 1 for mono).
     * @returns A Uint8Array containing the complete WAV file data.
     */
    public static encode({ samples, sampleRate, numChannels }: {
        samples: Float32Array;
        sampleRate: number;
        numChannels: number;
    }): Uint8Array {
        const bitsPerSample = 32; // 32-bit float
        const bytesPerSample = bitsPerSample / 8;
        const dataSize = samples.length * bytesPerSample;
        const blockAlign = numChannels * bytesPerSample;
        const byteRate = sampleRate * blockAlign;

        // The total buffer size is 44 bytes for the header plus the data size
        const buffer = new ArrayBuffer(44 + dataSize);
        const view = new DataView(buffer);

        let offset = 0;

        // Helper function to write a string to the DataView
        const writeString = (str: string) => {
            for (let i = 0; i < str.length; i++) {
                view.setUint8(offset + i, str.charCodeAt(i));
            }
            offset += str.length;
        };

        // RIFF chunk descriptor
        writeString("RIFF");
        view.setUint32(offset, 36 + dataSize, true); offset += 4; // ChunkSize
        writeString("WAVE");

        // "fmt " sub-chunk
        writeString("fmt ");
        view.setUint32(offset, 16, true); offset += 4;  // Subchunk1Size for PCM
        view.setUint16(offset, 3, true); offset += 2;   // AudioFormat: 3 for IEEE float
        view.setUint16(offset, numChannels, true); offset += 2;
        view.setUint32(offset, sampleRate, true); offset += 4;
        view.setUint32(offset, byteRate, true); offset += 4;
        view.setUint16(offset, blockAlign, true); offset += 2;
        view.setUint16(offset, bitsPerSample, true); offset += 2;

        // "data" sub-chunk
        writeString("data");
        view.setUint32(offset, dataSize, true); offset += 4;

        // Write the PCM data
        for (let i = 0; i < samples.length; i++, offset += bytesPerSample) {
            view.setFloat32(offset, samples[i], true);
        }

        return new Uint8Array(buffer);
    }
}


export async function combineAudios(audioURLs: string[]): Promise<string> {
    // 1. Decode all audio files and collect their sample data
    const allSampleChunks: Float32Array[] = [];

    for (const url of audioURLs) {
        const samples: Float32Array = await read_audio(url, 24000);

        if (samples.length > 0) {
            // We assume mono audio, so we take the first channel.
            allSampleChunks.push(samples);
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
    // 3. Encode the combined samples into a WAV format buffer using our custom encoder
    const wavBuffer: Uint8Array = WaveEncoder.encode({
        samples: concatenatedSamples,
        sampleRate: 24000,
        numChannels: 1,
    });

    // Assuming 'audioBuffer' is your Uint8Array containing the WAV file data
    const blob = new Blob([wavBuffer], { type: 'audio/wav' });
    const audioUrl = URL.createObjectURL(blob);
    console.debug(audioUrl);

    // audioURLs.forEach(URL.revokeObjectURL);
    return audioUrl;
}