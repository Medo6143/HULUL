import "server-only";
import { parseServerEnv, readServerSource } from "./env-schema";

export const serverEnv = parseServerEnv(readServerSource(process.env));
