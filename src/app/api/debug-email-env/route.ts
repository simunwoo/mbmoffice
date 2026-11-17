// 임시 진단용 — 이메일 발송 환경변수가 실제 배포에서 보이는지 확인하기 위한 라우트입니다.
// 확인 끝나면 바로 삭제합니다.
import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function GET() {
  const hasKey = Boolean(process.env.RESEND_API_KEY);
  const hasAdmin = Boolean(process.env.ADMIN_NOTIFICATION_EMAIL);
  let sendResult: unknown = null;
  let sendError: string | null = null;
  try {
    if (hasKey && hasAdmin) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const to = process.env.ADMIN_NOTIFICATION_EMAIL!.split(",").map((s) => s.trim());
      const result = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "MBM 홈페이지 <onboarding@resend.dev>",
        to,
        subject: "[진단] 배포 환경에서 직접 보낸 테스트",
        text: "이 라우트에서 보낸 메일입니다.",
      });
      sendResult = result;
    }
  } catch (err) {
    sendError = err instanceof Error ? err.message : String(err);
  }
  return NextResponse.json({
    hasKey,
    hasAdmin,
    keyPrefix: process.env.RESEND_API_KEY?.slice(0, 6) ?? null,
    adminEmail: process.env.ADMIN_NOTIFICATION_EMAIL ?? null,
    fromEmail: process.env.RESEND_FROM_EMAIL ?? null,
    sendResult,
    sendError,
  });
}
