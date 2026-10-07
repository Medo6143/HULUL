// Published market figures from the master plan (section 1, tagged "data"). Each needs its source shown on screen.
// Re-check the figures against the sources before launch. TikTok is left out on purpose: the plan flags that figure as doubtful.
export const marketSources = {
  datareportal: "DataReportal, Digital 2026 Saudi Arabia",
  qoyod: "Qoyod SME Report 2026",
} as const;

export const marketStats = [
  { key: "internet", value: 34.4, decimals: 1, unit: "million", source: "datareportal" },
  { key: "mobile", value: 48.7, decimals: 1, unit: "million", source: "datareportal" },
  { key: "sme", value: 22.9, decimals: 1, unit: "percent", source: "qoyod" },
] as const;

/** Advertising reach in Saudi Arabia, millions of users (DataReportal). Platform names are brand names. */
export const adReach = [
  { name: "YouTube", value: 27.5 },
  { name: "Snapchat", value: 25.3 },
  { name: "Instagram", value: 18.2 },
  { name: "Facebook", value: 17.7 },
  { name: "X", value: 15 },
  { name: "LinkedIn", value: 12 },
] as const;
