import Link from "next/link";

export default function RootNotFound() {
  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          margin: 0,
          background: "#ffffff",
          color: "#0f172a",
        }}
      >
        <main style={{ maxWidth: 720, marginInline: "auto", padding: "64px 16px" }}>
          <h1>الصفحة غير موجودة</h1>
          <p>
            <Link href="/ar">العودة للرئيسية</Link>
          </p>
        </main>
      </body>
    </html>
  );
}
