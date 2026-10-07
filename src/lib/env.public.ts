import { parsePublicEnv, readPublicSource } from "./env-schema";

export const publicEnv = parsePublicEnv(readPublicSource(process.env));
