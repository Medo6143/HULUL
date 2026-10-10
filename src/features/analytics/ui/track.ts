"use client";

import { dispatchEvent } from "@/lib/analytics/browser";
import type { AnalyticsEvent } from "../domain/analytics-events";

/** The only way to send an event. Names and params come from the dictionary, so no free-form events exist. */
export function track(event: AnalyticsEvent): void {
  dispatchEvent(event.name, event.params as Record<string, string | number | boolean | undefined>);
}
