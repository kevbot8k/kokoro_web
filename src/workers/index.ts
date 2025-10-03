import { wrap } from "comlink";
import { type KokoroWorker, type AudioCombiner } from "./kokoro/worker"


const kokoroWorker = wrap<{ KokoroWorker: typeof KokoroWorker, AudioCombiner: typeof AudioCombiner }>(
	new Worker(new URL("./kokoro/worker", import.meta.url), { type: "module" })
);

export { kokoroWorker }