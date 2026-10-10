import type { StaffRole } from "./staff";

// Invitation email for a new staff member. Plain wording, no emoji, no promises. The link is a one-time
// password-setup link from Firebase; it is placed only in this email and never logged.

export interface InviteEmail {
  subject: string;
  text: string;
  html: string;
}

const esc = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export function buildInviteEmail(input: { name: string; link: string; role: StaffRole }): InviteEmail {
  const role = input.role === "owner" ? "مالك" : "موظف";
  const lines = [
    `هلا ${input.name}،`,
    "",
    `تمت دعوتك للانضمام إلى لوحة تحكم حلول تك بدور: ${role}.`,
    "اضغط على الرابط التالي لتحديد كلمة المرور الخاصة بك، وبعدها ادخل من صفحة /admin/login.",
    "",
    input.link,
    "",
    "إذا ما كنت تتوقع هذي الدعوة، تجاهل الرسالة.",
  ];
  const html =
    `<div dir="rtl" style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.7;color:#0f172a">` +
    lines
      .map((line) => {
        if (line === "") return "<br>";
        if (line === input.link) return `<p style="margin:0 0 6px"><a href="${esc(line)}">${esc(line)}</a></p>`;
        return `<p style="margin:0 0 6px">${esc(line)}</p>`;
      })
      .join("") +
    "</div>";
  return { subject: "دعوة للانضمام إلى لوحة تحكم حلول تك", text: lines.join("\n"), html };
}

/** Password reset email for an existing member. The link is a one-time Firebase link and is never logged. */
export function buildPasswordResetEmail(input: { name: string; link: string }): InviteEmail {
  const lines = [
    `هلا ${input.name}،`,
    "",
    "وصلنا طلب لإعادة تعيين كلمة المرور الخاصة بك في لوحة تحكم حلول تك.",
    "اضغط على الرابط التالي لتحديد كلمة مرور جديدة:",
    "",
    input.link,
    "",
    "إذا ما طلبت هذا، تجاهل الرسالة وكلمة مرورك الحالية تبقى كما هي.",
  ];
  const html =
    `<div dir="rtl" style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.7;color:#0f172a">` +
    lines
      .map((line) => {
        if (line === "") return "<br>";
        if (line === input.link) return `<p style="margin:0 0 6px"><a href="${esc(line)}">${esc(line)}</a></p>`;
        return `<p style="margin:0 0 6px">${esc(line)}</p>`;
      })
      .join("") +
    "</div>";
  return { subject: "إعادة تعيين كلمة المرور في لوحة تحكم حلول تك", text: lines.join("\n"), html };
}
