import { normalizeSiteSettings, type Result, type SiteSettings, type SiteSettingsError } from "../domain/site-settings";

export interface SiteSettingsStore {
  get(): Promise<SiteSettings>;
  save(settings: SiteSettings, updatedBy: string): Promise<void>;
}

export function makeGetSiteSettings(deps: { store: SiteSettingsStore }) {
  return () => deps.store.get();
}

export function makeSaveSiteSettings(deps: { store: SiteSettingsStore }) {
  return async function saveSiteSettings(req: { settings: SiteSettings; updatedBy: string }): Promise<Result<SiteSettings, SiteSettingsError>> {
    const normalized = normalizeSiteSettings(req.settings);
    if (!normalized.ok) return normalized;
    await deps.store.save(normalized.value, req.updatedBy);
    return normalized;
  };
}
