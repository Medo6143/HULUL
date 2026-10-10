import { describe, expect, it } from "vitest";
import { bookingsPerDay, leadsPerDay, overviewKpis, riyadhDay, statusBreakdown } from "@/features/admin/model/dashboard";
import type { AdminLead } from "@/features/admin/model/admin-lead";

const NOW = new Date("2026-10-10T08:00:00Z"); // Saturday 11:00 Riyadh
const lead = (createdAt: string, status: AdminLead["status"] = "new"): AdminLead => ({
  id: createdAt + status, name: "x", business: "", service: "web", phone: "", email: "", preferred: "whatsapp", status,
  source: "direct", campaign: "", landing: "", timeline: "", description: "", createdAt, firstResponseAt: null, assigned: "", isNew: false, lostReason: "",
});

describe("admin dashboard numbers", () => {
  it("uses the Riyadh day, not the UTC day", () => {
    expect(riyadhDay(new Date("2026-10-10T21:30:00Z"))).toBe("2026-10-11"); // 00:30 Riyadh next day
  });
  it("counts leads per Riyadh day with zero-filled days, oldest first", () => {
    const points = leadsPerDay([lead("2026-10-10T07:00:00Z"), lead("2026-10-10T21:30:00Z"), lead("2026-10-08T09:00:00Z")], NOW, 4);
    expect(points.map((p) => p.date)).toEqual(["2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10"]);
    expect(points.map((p) => p.value)).toEqual([0, 1, 0, 1]);
  });
  it("breaks down statuses in pipeline order and skips empty ones", () => {
    expect(statusBreakdown([lead("2026-10-10T07:00:00Z", "won"), lead("2026-10-10T07:00:00Z", "new"), lead("2026-10-10T07:00:00Z", "new")])).toEqual([
      { status: "new", value: 2 },
      { status: "won", value: 1 },
    ]);
  });
  it("counts only confirmed bookings, per upcoming day", () => {
    const points = bookingsPerDay(
      [
        { startUtc: "2026-10-11T07:00:00Z", status: "confirmed" },
        { startUtc: "2026-10-11T08:00:00Z", status: "cancelled" },
        { startUtc: "2026-10-12T07:00:00Z", status: "confirmed" },
      ],
      NOW,
      3,
    );
    expect(points.map((p) => p.value)).toEqual([0, 1, 1]);
  });
  it("computes the headline numbers, including week over week and win rate", () => {
    const k = overviewKpis(
      [lead("2026-10-09T07:00:00Z", "won"), lead("2026-10-02T07:00:00Z"), lead("2026-09-01T07:00:00Z"), lead("2026-10-08T07:00:00Z")],
      [{ startUtc: "2026-10-12T07:00:00Z", status: "confirmed" }, { startUtc: "2026-10-01T07:00:00Z", status: "confirmed" }],
      NOW,
    );
    expect(k).toMatchObject({ total: 4, last7: 2, previous7: 1, won: 1, upcomingBookings: 1, winRatePercent: 25 });
    expect(overviewKpis([], [], NOW).winRatePercent).toBeNull();
  });
});
