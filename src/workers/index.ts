import { wrap } from "comlink";
import { type KokoroWorker } from "./kokoro/worker"

const kokoroWorker = wrap<KokoroWorker>(
	new Worker("./kokoro/worker", { type: "module" })
);

export { kokoroWorker }