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

/** 새 A/S·토너 요청이 접수됐을 때 관리자에게 알림 메일을 보냅니다. 미설정이면 조용히 건너뜁니다. */
export async function sendAsRequestNotification(req: {
  requestType: "as" | "toner";
  description: string;
  memberName: string | null;
  memberPhone: string | null;
  contractLabel: string | null;
}) {
  if (!isEmailConfigured()) {
    console.warn("[email] RESEND_API_KEY 또는 ADMIN_NOTIFICATION_EMAIL 미설정 — 알림 메일을 건너뜁니다.");
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const to = process.env.ADMIN_NOTIFICATION_EMAIL!.split(",").map((s) => s.trim());
  const typeLabel = req.requestType === "toner" ? "토너 요청" : "A/S 요청";

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "MBM 홈페이지 <onboarding@resend.dev>",
    to,
    subject: `[${typeLabel}] ${req.memberName ?? "회원"}`,
    text: [
      `구분: ${typeLabel}`,
      req.contractLabel ? `계약: ${req.contractLabel}` : null,
      `신청자: ${req.memberName ?? "-"}`,
      `연락처: ${req.memberPhone ?? "-"}`,
      "",
      "요청 내용:",
      req.description,
      "",
      "어드민 페이지 > A/S·토너 요청 에서 전체 내용을 확인하고 처리해 주세요.",
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

/** 가상계좌(무통장입금)가 발급됐을 때 입금 안내 메일을 보냅니다. applicant_email이 없으면 조용히 건너뜁니다. */
export async function sendVirtualAccountIssuedEmail(args: {
  to: string | null;
  applicantName: string;
  productName: string;
  optionLabel?: string | null;
  orderId: string;
  amount: number;
  bank: string;
  accountNumber: string;
  dueDate: string | null;
}) {
  if (!args.to || !isEmailConfigured()) return;

  const resend = new Resend(process.env.RESEND_API_KEY);
  const itemLabel = `${args.productName}${args.optionLabel ? ` (${args.optionLabel})` : ""}`;
  const dueDateLabel = args.dueDate ? new Date(args.dueDate).toLocaleString("ko-KR", { dateStyle: "long", timeStyle: "short" }) : "안내된 기한";

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "MBM 홈페이지 <onboarding@resend.dev>",
    to: [args.to],
    subject: `[엠비엠] ${args.applicantName}님, 가상계좌가 발급되었습니다`,
    text: [
      `${args.applicantName}님, 안녕하세요.`,
      "",
      `주문하신 ${itemLabel}의 결제를 위한 가상계좌가 발급되었습니다. 아래 계좌로 입금해 주세요.`,
      "",
      `입금은행: ${args.bank}`,
      `계좌번호: ${args.accountNumber}`,
      `입금금액: ${args.amount.toLocaleString()}원 (정확히 일치해야 자동으로 확인됩니다)`,
      `입금기한: ${dueDateLabel}`,
      "",
      "입금이 확인되면 자동으로 주문이 접수되고 다시 안내 메일을 보내드립니다.",
      `주문번호: ${args.orderId}`,
      "문의: 1833-2613",
    ].join("\n"),
  });
}

export type OrderStatusEmailKind = "received" | "shipping" | "delivered" | "cancel_requested" | "return_requested";

const ORDER_STATUS_EMAIL_SUBJECT: Record<OrderStatusEmailKind, string> = {
  received: "주문이 접수됐어요",
  shipping: "상품을 발송했어요",
  delivered: "배송이 완료됐어요",
  cancel_requested: "취소 요청을 접수했어요",
  return_requested: "반품 요청을 접수했어요",
};

/**
 * 구매주문 상태가 핵심 단계(주문접수/배송시작/배송완료/취소접수/반품접수)로 바뀔 때마다 고객에게
 * 보내는 안내 메일입니다. 상품준비중·배송대기처럼 세세한 내부 단계는 보내지 않습니다(너무 잦으면
 * 스팸처럼 느껴질 수 있어서). applicant_email이 없는 주문이면 호출하는 쪽에서 아예 건너뜁니다.
 */
export async function sendOrderStatusEmailToCustomer(args: {
  to: string;
  kind: OrderStatusEmailKind;
  applicantName: string;
  productName: string;
  optionLabel?: string | null;
  orderId: string;
  carrier?: string | null;
  trackingNumber?: string | null;
}) {
  if (!isEmailConfigured()) return;

  const resend = new Resend(process.env.RESEND_API_KEY);
  const itemLabel = `${args.productName}${args.optionLabel ? ` (${args.optionLabel})` : ""}`;

  const bodyByKind: Record<OrderStatusEmailKind, string> = {
    received: `주문하신 ${itemLabel} 결제가 정상적으로 완료되어 주문이 접수되었습니다.\n빠르게 상품을 준비해 발송해 드리겠습니다.`,
    shipping: `주문하신 ${itemLabel} 상품을 발송했습니다.${
      args.carrier || args.trackingNumber ? `\n\n택배사: ${args.carrier || "-"}\n송장번호: ${args.trackingNumber || "-"}` : ""
    }`,
    delivered: `주문하신 ${itemLabel} 배송이 완료되었습니다.\n이용해 주셔서 감사합니다. 불편한 점이 있으면 언제든 연락해 주세요.`,
    cancel_requested: `주문하신 ${itemLabel}에 대한 취소 요청을 접수했습니다.\n확인 후 순차적으로 처리해 드리겠습니다.`,
    return_requested: `주문하신 ${itemLabel}에 대한 반품 요청을 접수했습니다.\n확인 후 순차적으로 처리해 드리겠습니다.`,
  };

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "MBM 홈페이지 <onboarding@resend.dev>",
    to: [args.to],
    subject: `[엠비엠] ${args.applicantName}님, ${ORDER_STATUS_EMAIL_SUBJECT[args.kind]}`,
    text: [
      `${args.applicantName}님, 안녕하세요.`,
      "",
      bodyByKind[args.kind],
      "",
      `주문번호: ${args.orderId}`,
      "문의: 1833-2613",
    ].join("\n"),
  });
}
