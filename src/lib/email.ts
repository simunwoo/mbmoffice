import { Resend } from "resend";

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.ADMIN_NOTIFICATION_EMAIL);
}

/** 새 견적문의가 들어왔을 때 관리자에게 알림 메일을 보냅니다. 미설정이면 조용히 건너뜁니다(문의 저장 자체는 계속 진행). */
export async function sendInquiryNotification(inquiry: {
  name: string;
  phone: string;
  email: string;
  companyName: string | null;
  interest: string | null;
  message: string | null;
}) {
  if (!isEmailConfigured()) {
    console.warn("[email] RESEND_API_KEY 또는 ADMIN_NOTIFICATION_EMAIL 미설정 — 알림 메일을 건너뜁니다.");
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const to = process.env.ADMIN_NOTIFICATION_EMAIL!.split(",").map((s) => s.trim());

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "MBM 홈페이지 <onboarding@resend.dev>",
    to,
    replyTo: inquiry.email,
    subject: `[견적문의] ${inquiry.name}${inquiry.companyName ? ` (${inquiry.companyName})` : ""}`,
    text: [
      `이름: ${inquiry.name}`,
      `연락처: ${inquiry.phone}`,
      `이메일: ${inquiry.email}`,
      inquiry.companyName ? `회사명: ${inquiry.companyName}` : null,
      inquiry.interest ? `관심 상품: ${inquiry.interest}` : null,
      "",
      "문의 내용:",
      inquiry.message || "(작성 없음)",
      "",
      "어드민 페이지 > 견적문의 에서 전체 내용을 확인하세요.",
    ]
      .filter((line): line is string => line !== null)
      .join("\n"),
  });
}

/** 새 렌탈 신청서가 접수됐을 때 관리자에게 알림 메일을 보냅니다. 미설정이면 조용히 건너뜁니다. */
export async function sendRentalApplicationNotification(app: {
  productName: string;
  planLabel: string | null;
  termMonths: number | null;
  monthlyPrice: number | null;
  usageSummary: string | null;
  applicantName: string;
  applicantPhone: string;
  installAddress: string;
}) {
  if (!isEmailConfigured()) {
    console.warn("[email] RESEND_API_KEY 또는 ADMIN_NOTIFICATION_EMAIL 미설정 — 알림 메일을 건너뜁니다.");
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const to = process.env.ADMIN_NOTIFICATION_EMAIL!.split(",").map((s) => s.trim());

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "MBM 홈페이지 <onboarding@resend.dev>",
    to,
    subject: `[렌탈신청] ${app.applicantName} - ${app.productName}`,
    text: [
      `상품: ${app.productName}`,
      app.planLabel ? `요금제: ${app.planLabel}` : null,
      app.termMonths ? `약정 기간: ${app.termMonths}개월` : null,
      app.monthlyPrice ? `월 예상 금액: ${app.monthlyPrice.toLocaleString()}원 (VAT 별도)` : null,
      app.usageSummary ? `사용량: ${app.usageSummary}` : null,
      `신청자: ${app.applicantName}`,
      `연락처: ${app.applicantPhone}`,
      `설치 주소: ${app.installAddress}`,
      "",
      "어드민 페이지 > 렌탈신청 에서 전체 내용을 확인하고 고객에게 연락해 주세요.",
    ]
      .filter((line): line is string => line !== null)
      .join("\n"),
  });
}

/** 고객에게 전자계약 서명 링크를 보냅니다. */
export async function sendContractInviteEmail(args: { to: string; applicantName: string; productName: string; contractUrl: string }) {
  if (!isEmailConfigured()) {
    console.warn("[email] RESEND_API_KEY 또는 ADMIN_NOTIFICATION_EMAIL 미설정 — 전자계약 메일을 건너뜁니다.");
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "MBM 홈페이지 <onboarding@resend.dev>",
    to: [args.to],
    subject: `[엠비엠] ${args.productName} 렌탈 전자계약서 서명 요청`,
    text: [
      `${args.applicantName}님, 안녕하세요.`,
      "",
      `신청하신 ${args.productName} 렌탈 계약서를 아래 링크에서 확인하고 전자서명해 주세요.`,
      args.contractUrl,
      "",
      "본인 확인을 위해 신청 시 입력하신 성함과 연락처를 다시 입력하셔야 합니다.",
      "링크는 14일간 유효합니다.",
    ].join("\n"),
  });
}

/** 계약 서명이 완료되면 관리자에게 알립니다. */
export async function sendContractSignedNotification(args: { applicantName: string; productName: string; agreedAt: string }) {
  if (!isEmailConfigured()) return;

  const resend = new Resend(process.env.RESEND_API_KEY);
  const to = process.env.ADMIN_NOTIFICATION_EMAIL!.split(",").map((s) => s.trim());

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "MBM 홈페이지 <onboarding@resend.dev>",
    to,
    subject: `[전자계약 완료] ${args.applicantName} - ${args.productName}`,
    text: [
      `${args.applicantName}님이 ${args.productName} 렌탈 계약서에 전자서명했습니다.`,
      `서명 시각: ${args.agreedAt}`,
      "",
      "어드민 페이지 > 렌탈신청 상세에서 서명 기록을 확인하세요.",
    ].join("\n"),
  });
}

/** 서명 완료 시 고객에게도 계약 원문 사본을 보내, 고객 측에도 독립된 증거가 남도록 합니다. */
export async function sendContractSignedCopyToCustomer(args: { to: string; applicantName: string; agreedAt: string; termsText: string }) {
  if (!isEmailConfigured()) return;

  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "MBM 홈페이지 <onboarding@resend.dev>",
    to: [args.to],
    subject: "[엠비엠] 렌탈 계약 전자서명 완료 안내",
    text: [
      `${args.applicantName}님, 전자서명이 정상적으로 완료되었습니다.`,
      `서명 시각: ${args.agreedAt}`,
      "",
      "서명하신 계약 원문은 아래와 같습니다. 본 메일은 서명 완료 증빙이니 보관해 주세요.",
      "----------------------------------------",
      args.termsText,
      "----------------------------------------",
    ].join("\n"),
  });
}

/** 구매상품 결제가 승인됐을 때 관리자에게 알림 메일을 보냅니다. 미설정이면 조용히 건너뜁니다. */
export async function sendPurchaseOrderNotification(order: {
  productName: string;
  quantity: number;
  optionLabel?: string | null;
  amount: number;
  applicantName: string;
  applicantPhone: string;
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  deliveryMemo?: string | null;
  addonItems?: { productName: string; quantity: number }[];
}) {
  if (!isEmailConfigured()) {
    console.warn("[email] RESEND_API_KEY 또는 ADMIN_NOTIFICATION_EMAIL 미설정 — 알림 메일을 건너뜁니다.");
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const to = process.env.ADMIN_NOTIFICATION_EMAIL!.split(",").map((s) => s.trim());

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "MBM 홈페이지 <onboarding@resend.dev>",
    to,
    subject: `[구매주문/결제완료] ${order.applicantName} - ${order.productName}`,
    text: [
      `상품: ${order.productName}${order.optionLabel ? ` (${order.optionLabel})` : ""}`,
      `수량: ${order.quantity}개`,
      ...(order.addonItems ?? []).map((item) => `추가상품: ${item.productName} x ${item.quantity}개`),
      `결제 금액: ${order.amount.toLocaleString()}원 (VAT 포함)`,
      `주문자: ${order.applicantName}`,
      `연락처: ${order.applicantPhone}`,
      `수령인: ${order.receiverName} (${order.receiverPhone})`,
      `배송지: ${order.shippingAddress}`,
      order.deliveryMemo ? `배송메모: ${order.deliveryMemo}` : null,
      "",
      "어드민 페이지 > 구매주문 에서 전체 내용을 확인하고 배송을 준비해 주세요.",
    ]
      .filter((line): line is string => line !== null)
      .join("\n"),
  });
}
