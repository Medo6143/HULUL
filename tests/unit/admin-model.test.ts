import { describe, expect, it } from "vitest";
import type { AdminLead } from "@/features/admin/model/admin-lead";
import { computeAnalytics } from "@/features/admin/model/analytics";
import { csvCell, leadsToCsv } from "@/features/admin/model/csv";
import { sourceKey, toAdminDetail, toAdminLead, type LeadLike } from "@/features/admin/model/to-admin-lead";

const NOW = new Date("2026-10-10T12:00:00Z");
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3_600_000).toISOString();

const lead = (over: Partial<AdminLead>): AdminLead => ({
  id: "l",
  name: "Test",
  business: "",
  service: "web",
  phone: "966500000000",
  email: "",
  preferred: "whatsapp",
  status: "new",
  source: "direct",
  campaign: "",
  landing: "",
  timeline: "",
  description: "",
  createdAt: hoursAgo(10),
  firstResponseAt: null,
  assigned: "",
  isNew: true,
  lostReason: "",
  ...over,
});

describe("sourceKey", () => {
  it("maps utm and referrer to dashboard sources", () => {
    expect(sourceKey("google", "")).toBe("google");
    expect(sourceKey("", "https://www.linkedin.com/")).toBe("linkedin");
    expect(sourceKey("snapchat", "")).toBe("snapchat");
    expect(sourceKey("", "")).toBe("direct");
    expect(sourceKey("newsletter", "")).toBe("referral");
  });
});

describe("toAdminLead", () => {
  const base: LeadLike = {
    id: "l1",
    service: "mobile",
    name: "A",
    phone: "966511111111",
    email: "",
    preferredContact: "call",
    businessType: "Shop",
    timeline: "months",
    description: "d",
    status: "new",
    lostReason: "",
    assignedTo: "",
    source: { utmSource: "google", utmCampaign: "c", landingPage: "/x", referrer: "" },
    firstResponseAt: null,
    createdAt: new Date("2026-10-01T00:00:00Z"),
  };
  it("maps a lead and builds history with the creation entry first", () => {
    expect(toAdminLead(base)).toMatchObject({ business: "Shop", source: "google", isNew: true, timeline: "months" });
    const detail = toAdminDetail(
      base,
      [{ from: "new", to: "contacted", changedBy: "a@x.test", reason: "", changedAt: new Date("2026-10-02T00:00:00Z") }],
      [{ id: "n1", authorName: "A", text: "hi", createdAt: new Date("2026-10-02T01:00:00Z") }],
    );
    expect(detail.history.map((h) => h.to)).toEqual(["new", "contacted"]);
    expect(detail.notes[0]).toMatchObject({ by: "A", text: "hi" });
  });
  it("drops timelines it does not know", () => {
    expect(toAdminLead({ ...base, timeline: "someday" }).timeline).toBe("");
  });
});

describe("computeAnalytics", () => {
  const leads = [
    lead({ id: "1", status: "new", createdAt: hoursAgo(5) }),
    lead({ id: "2", status: "contacted", createdAt: hoursAgo(30), firstResponseAt: hoursAgo(28), source: "google" }),
    lead({ id: "3", status: "consultation", createdAt: hoursAgo(50), firstResponseAt: hoursAgo(46), source: "google" }),
    lead({ id: "4", status: "won", createdAt: hoursAgo(60), firstResponseAt: hoursAgo(59), source: "google" }),
    lead({ id: "5", status: "lost", lostReason: "price", createdAt: hoursAgo(70) }),
    lead({ id: "6", status: "lost", lostReason: "made-up", createdAt: hoursAgo(80) }),
    lead({ id: "7", status: "new", createdAt: hoursAgo(24 * 10) }), // previous week
  ];
  const data = computeAnalytics(leads, NOW);

  it("counts new leads in the last 7 days against the week before", () => {
    expect(data.kpis.find((k) => k.key === "new")).toMatchObject({ value: 6, delta: 5 });
  });
  it("counts stages by the furthest status reached", () => {
    expect(data.funnel.map((f) => f.count)).toEqual([5, 3, 2, 1, 1]);
    expect(data.kpis.find((k) => k.key === "won")?.value).toBe(1);
  });
  it("computes the median first reply in hours", () => {
    expect(data.firstReply.medianHours).toBe(2);
  });
  it("hides the over-limit count until a limit is set, then counts it", () => {
    expect(data.firstReply.overLimit).toBeNull();
    expect(computeAnalytics(leads, NOW, 3).firstReply.overLimit).toBeGreaterThan(0);
  });
  it("groups sources, deals, and loss reasons, with unknown reasons under other", () => {
    expect(data.sources.find((row) => row.source === "google")).toMatchObject({ leads: 3, deals: 1 });
    expect(data.sources[0]).toMatchObject({ source: "direct", leads: 4, deals: 0 });
    expect(data.losses).toEqual([
      { key: "price", value: 1 },
      { key: "other", value: 1 },
    ]);
  });
  it("handles no leads", () => {
    const empty = computeAnalytics([], NOW);
    expect(empty.total).toBe(0);
    expect(empty.firstReply.medianHours).toBeNull();
    expect(empty.sources).toEqual([]);
  });
});

describe("csv export", () => {
  it("starts with a BOM and keeps the column order", () => {
    const csv = leadsToCsv([lead({ id: "x", name: "اسم" })]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv.split("\r\n")[0]).toContain("id,created_at,name,phone");
    expect(csv).toContain('"x"');
    expect(csv).toContain('"اسم"');
  });
  it("escapes quotes and neutralizes spreadsheet formulas", () => {
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell("=HYPERLINK(1)")).toBe("\"'=HYPERLINK(1)\"");
    expect(csvCell("+1")).toBe("\"'+1\"");
    expect(csvCell("line1\nline2")).toBe('"line1\nline2"');
  });
});
