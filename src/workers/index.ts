import { wrap } from "comlink";
import { type KokoroWorker } from "./kokoro/worker"


const kokoroWorker = wrap<{ KokoroWorker: typeof KokoroWorker }>(
	new Worker(new URL("./kokoro/worker", import.meta.url), { type: "module" })
);

export { kokoroWorker }