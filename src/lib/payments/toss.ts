/**
 * 토스페이먼츠 일반결제(단건) 서버 연동. 구매상품 결제(1회성)에 사용하며, 렌탈 쪽 카드 자동결제(빌링키)와는
 * 별개 플로우입니다. 결제 승인은 반드시 서버에서만 수행합니다 — 클라이언트는 결제창만 띄우고, 승인 여부는
 * 이 함수가 금액을 우리 쪽 주문 금액과 대조해 확정합니다 (클라이언트가 보낸 금액을 그대로 믿지 않습니다).
 */

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY ?? "";
const API = "https://api.tosspayments.com/v1/payments";

function basicAuth(): string {
  return "Basic " + Buffer.from(`${TOSS_SECRET_KEY}:`).toString("base64");
}

export type TossError = { code: string; message: string };
export type TossPaymentData = {
  paymentKey: string;
  orderId: string;
  status: string;
  totalAmount: number;
  method: string | null;
  approvedAt: string | null;
};
export type TossResult = { ok: true; data: TossPaymentData } | { ok: false; error: TossError };

function toPaymentData(raw: Record<string, unknown>): TossPaymentData {
  return {
    paymentKey: String(raw.paymentKey ?? ""),
    orderId: String(raw.orderId ?? ""),
    status: String(raw.status ?? ""),
    totalAmount: Number(raw.totalAmount ?? 0),
    method: raw.method ? String(raw.method) : null,
    approvedAt: raw.approvedAt ? String(raw.approvedAt) : null,
  };
}

async function call(url: string, init: RequestInit): Promise<TossResult> {
  if (!TOSS_SECRET_KEY) {
    return { ok: false, error: { code: "NOT_CONFIGURED", message: "결제 모듈이 아직 설정되지 않았습니다. 전화로 문의해 주세요." } };
  }
  try {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(15000) });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      return { ok: false, error: { code: String(data.code ?? "TOSS_ERROR"), message: String(data.message ?? "결제사 응답 오류") } };
    }
    return { ok: true, data: toPaymentData(data) };
  } catch (err) {
    console.error("[toss] request failed", err);
    return { ok: false, error: { code: "TOSS_UNREACHABLE", message: "결제사 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요." } };
  }
}

/** 결제 승인. Idempotency-Key = paymentKey 로 토스 쪽에서도 중복 승인 요청을 막습니다. */
export function confirmTossPayment(paymentKey: string, orderId: string, amount: number): Promise<TossResult> {
  return call(`${API}/confirm`, {
    method: "POST",
    headers: { Authorization: basicAuth(), "Content-Type": "application/json", "Idempotency-Key": paymentKey.slice(0, 300) },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });
}

/** 승인 여부가 불확실할 때(동시 요청·새로고침) 실제 상태를 재조회합니다 — 승인 API를 다시 부르지 않습니다. */
export function getTossPayment(paymentKey: string): Promise<TossResult> {
  return call(`${API}/${encodeURIComponent(paymentKey)}`, { headers: { Authorization: basicAuth() } });
}

/** 토스 실패 코드 → 고객용 한국어 안내 */
const TOSS_ERROR_KO: Record<string, string> = {
  PAY_PROCESS_CANCELED: "결제를 취소하셨습니다.",
  USER_CANCEL: "결제를 취소하셨습니다.",
  PAY_PROCESS_ABORTED: "결제가 중단되었습니다. 다시 시도해 주세요.",
  REJECT_CARD_COMPANY: "카드사에서 결제를 거절했습니다. 다른 카드로 시도해 주세요.",
  REJECT_CARD_PAYMENT: "카드 결제가 거절되었습니다. 카드사에 문의해 주세요.",
  EXCEED_MAX_CARD_INSTALLMENT_PLAN: "할부 개월 수가 허용 범위를 초과했습니다.",
  INVALID_CARD_EXPIRATION: "카드 유효기간이 올바르지 않습니다.",
  INVALID_STOPPED_CARD: "정지된 카드입니다.",
  EXCEED_MAX_DAILY_PAYMENT_COUNT: "하루 결제 가능 횟수를 초과했습니다.",
  EXCEED_MAX_PAYMENT_AMOUNT: "결제 한도를 초과했습니다.",
  NOT_SUPPORTED_INSTALLMENT_PLAN_CARD_OR_MERCHANT: "이 카드는 할부가 지원되지 않습니다.",
  INVALID_CARD_INSTALLMENT_PLAN: "할부 정보가 올바르지 않습니다.",
  NOT_AVAILABLE_PAYMENT: "현재 이용할 수 없는 결제수단입니다.",
  UNAPPROVED_ORDER_ID: "주문번호가 올바르지 않습니다.",
  ALREADY_PROCESSED_PAYMENT: "이미 처리된 결제입니다.",
  NOT_FOUND_PAYMENT: "결제 정보를 찾을 수 없습니다.",
  NOT_FOUND_PAYMENT_SESSION: "결제 시간이 만료되었습니다. 처음부터 다시 진행해 주세요.",
  FORBIDDEN_REQUEST: "허용되지 않은 요청입니다.",
  UNAUTHORIZED_KEY: "결제 설정 오류입니다. 관리자에게 문의해 주세요.",
  INVALID_REQUEST: "잘못된 요청입니다. 다시 시도해 주세요.",
  INVALID_API_KEY: "결제 설정 오류입니다. 관리자에게 문의해 주세요.",
  PROVIDER_ERROR: "결제사 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
  FAILED_INTERNAL_SYSTEM_PROCESSING: "결제사 내부 오류입니다. 잠시 후 다시 시도해 주세요.",
};

export function tossErrorKo(code: string, fallback?: string): string {
  return TOSS_ERROR_KO[code] ?? fallback ?? "결제 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
}
