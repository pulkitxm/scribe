import { atomWithStorage } from "jotai/utils";

export type LogType = "app" | "analyze";

export const logTypeAtom = atomWithStorage<LogType>("logType", "app");
