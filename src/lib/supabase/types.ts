export type ProductRow = {
  id: string;
  name: string;
  brand: string;
  category: "mfp" | "printer" | "pc" | "notebook" | "nas" | "shredder" | "maintenance" | "supplies" | "parts";
  size: "a3" | "a4" | null;
  color: "color" | "mono" | null;
  print_tech: "laser" | "inkjet" | null;
  volume_min: number | null;
  volume_max: number | null;
  term_months: number | null;
  price_monthly: number | null;
  list_price: number | null;
  purchase_price: number | null;
  pricing_type: "rental" | "purchase" | "maintenance";
  price_note: string | null;
  specs: string[];
  images: string[];
  stock: number | null;
  status: "selling" | "soldout" | "hidden";
  source_url: string | null;
  description_html: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductInsert = Omit<ProductRow, "id" | "created_at" | "updated_at">;
export type ProductUpdate = Partial<ProductInsert>;

export type InstallCaseRow = {
  id: string;
  title: string;
  region: string | null;
  region_slug: string | null;
  industry: string | null;
  industry_slug: string | null;
  brand: string | null;
  model: string | null;
  /** 기기 종류 소분류 (예: 컬러복합기, 흑백복합기, PC·노트북 등). 관리자가 자유롭게 입력합니다. */
  category: string | null;
  body: string;
  body_html: string | null;
  images: string[];
  case_date: string | null;
  status: "published" | "draft";
  created_at: string;
  updated_at: string;
};

export type InstallCaseInsert = Omit<InstallCaseRow, "id" | "created_at" | "updated_at">;
export type InstallCaseUpdate = Partial<InstallCaseInsert>;

export type BlogPostRow = {
  id: string;
  title: string;
  category: string | null;
  body: string;
  body_html: string | null;
  images: string[];
  post_date: string | null;
  source: "site" | "naver" | "admin";
  status: "published" | "draft";
  created_at: string;
  updated_at: string;
};

export type BlogPostInsert = Omit<BlogPostRow, "id" | "created_at" | "updated_at">;
export type BlogPostUpdate = Partial<BlogPostInsert>;

export type InquiryRow = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  company_name: string | null;
  interest: string | null;
  message: string | null;
  attachments: string[];
  status: "new" | "contacted" | "closed" | "won" | "lost";
  created_at: string;
};

export type InquiryInsert = Omit<InquiryRow, "id" | "created_at" | "status"> & { status?: InquiryRow["status"] };
export type InquiryUpdate = Partial<Pick<InquiryRow, "status">>;

export type RentalContractSnapshot = {
  productName: string;
  planLabel: string | null;
  termMonths: number | null;
  monthlyPrice: number | null;
  faxOption: boolean;
  usageSummary: string | null;
};

export type RentalApplicationRow = {
  id: string;
  product_id: string | null;
  product_name: string;
  plan_label: string | null;
  term_months: number | null;
  fax_option: boolean;
  monthly_price: number | null;
  applicant_name: string;
  applicant_phone: string;
  applicant_email: string | null;
  company_name: string | null;
  business_reg_number: string | null;
  install_address: string;
  install_date: string | null;
  notes: string | null;
  usage_summary: string | null;
  /** 희망 월 렌탈료 결제일 (5/10/15/20/25/30) */
  payment_day: number | null;
  status: "new" | "contacted" | "closed" | "won" | "lost";
  contract_token: string | null;
  contract_sent_at: string | null;
  contract_terms_snapshot: RentalContractSnapshot | null;
  contract_terms_text: string | null;
  contract_terms_hash: string | null;
  contract_agreed_at: string | null;
  contract_agreed_name: string | null;
  contract_agreed_ip: string | null;
  contract_agreed_user_agent: string | null;
  // 설치 당일에 확정되는 값이라 담당 직원이 계약서 발급 전에 직접 입력합니다.
  install_model: string | null;
  install_serial_number: string | null;
  install_billing_start_date: string | null;
  install_initial_meter: number | null;
  created_at: string;
  updated_at: string;
};

type ContractField =
  | "contract_token"
  | "contract_sent_at"
  | "contract_terms_snapshot"
  | "contract_terms_text"
  | "contract_terms_hash"
  | "contract_agreed_at"
  | "contract_agreed_name"
  | "contract_agreed_ip"
  | "contract_agreed_user_agent"
  | "install_model"
  | "install_serial_number"
  | "install_billing_start_date"
  | "install_initial_meter";

export type RentalApplicationInsert = Omit<RentalApplicationRow, "id" | "status" | "created_at" | "updated_at" | ContractField> & {
  status?: RentalApplicationRow["status"];
};
export type RentalApplicationUpdate = Partial<Pick<RentalApplicationRow, "status" | ContractField>>;

export type ProductOptionGroupRow = {
  id: string;
  product_id: string;
  name: string;
  values: string[];
  sort_order: number;
  created_at: string;
};
export type ProductOptionGroupInsert = Omit<ProductOptionGroupRow, "id" | "created_at">;

export type ProductVariantRow = {
  id: string;
  product_id: string;
  option_combo: Record<string, string>;
  label: string;
  price_delta: number;
  stock: number;
  status: "selling" | "soldout";
  sort_order: number;
  created_at: string;
};
export type ProductVariantInsert = Omit<ProductVariantRow, "id" | "created_at">;

export type ProductAddonRow = {
  id: string;
  product_id: string;
  addon_product_id: string;
  sort_order: number;
  created_at: string;
};
export type ProductAddonInsert = Omit<ProductAddonRow, "id" | "created_at">;

export type PurchaseOrderItemRow = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  line_amount: number;
  created_at: string;
};
export type PurchaseOrderItemInsert = Omit<PurchaseOrderItemRow, "id" | "created_at">;

export type PurchaseOrderRow = {
  id: string;
  product_id: string | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  variant_id: string | null;
  option_label: string | null;
  amount: number;
  applicant_name: string;
  applicant_phone: string;
  applicant_email: string | null;
  company_name: string | null;
  business_reg_number: string | null;
  receiver_name: string;
  receiver_phone: string;
  zip_code: string | null;
  shipping_address: string;
  delivery_memo: string | null;
  notes: string | null;
  toss_order_id: string;
  toss_payment_key: string | null;
  status: "pending" | "paid" | "failed" | "canceled";
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PurchaseOrderInsert = Omit<
  PurchaseOrderRow,
  "id" | "status" | "toss_payment_key" | "paid_at" | "created_at" | "updated_at"
> & {
  status?: PurchaseOrderRow["status"];
};
export type PurchaseOrderUpdate = Partial<Pick<PurchaseOrderRow, "status" | "toss_payment_key" | "paid_at">>;

export type ProfileRow = {
  id: string;
  role: "member" | "admin";
  name: string | null;
  phone: string | null;
  company_name: string | null;
  provider: string;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfileInsert = Omit<ProfileRow, "created_at" | "updated_at" | "admin_note"> & {
  role?: ProfileRow["role"];
  admin_note?: string | null;
};
export type ProfileUpdate = Partial<Pick<ProfileRow, "role" | "name" | "phone" | "company_name" | "admin_note">>;

export type AsRequestRow = {
  id: string;
  member_id: string;
  rental_application_id: string | null;
  contract_label: string | null;
  request_type: "as" | "toner";
  description: string | null;
  status: "new" | "in_progress" | "done";
  created_at: string;
  updated_at: string;
};

export type AsRequestInsert = Omit<AsRequestRow, "id" | "created_at" | "updated_at" | "status"> & {
  status?: AsRequestRow["status"];
};
export type AsRequestUpdate = Partial<Pick<AsRequestRow, "status">>;

export type Database = {
  public: {
    Tables: {
      products: { Row: ProductRow; Insert: ProductInsert; Update: ProductUpdate; Relationships: [] };
      install_cases: { Row: InstallCaseRow; Insert: InstallCaseInsert; Update: InstallCaseUpdate; Relationships: [] };
      blog_posts: { Row: BlogPostRow; Insert: BlogPostInsert; Update: BlogPostUpdate; Relationships: [] };
      inquiries: { Row: InquiryRow; Insert: InquiryInsert; Update: InquiryUpdate; Relationships: [] };
      rental_applications: {
        Row: RentalApplicationRow;
        Insert: RentalApplicationInsert;
        Update: RentalApplicationUpdate;
        Relationships: [];
      };
      purchase_orders: {
        Row: PurchaseOrderRow;
        Insert: PurchaseOrderInsert;
        Update: PurchaseOrderUpdate;
        Relationships: [];
      };
      purchase_order_items: {
        Row: PurchaseOrderItemRow;
        Insert: PurchaseOrderItemInsert;
        Update: Partial<PurchaseOrderItemInsert>;
        Relationships: [];
      };
      product_option_groups: {
        Row: ProductOptionGroupRow;
        Insert: ProductOptionGroupInsert;
        Update: Partial<ProductOptionGroupInsert>;
        Relationships: [];
      };
      product_variants: {
        Row: ProductVariantRow;
        Insert: ProductVariantInsert;
        Update: Partial<ProductVariantInsert>;
        Relationships: [];
      };
      product_addons: {
        Row: ProductAddonRow;
        Insert: ProductAddonInsert;
        Update: Partial<ProductAddonInsert>;
        Relationships: [];
      };
      profiles: { Row: ProfileRow; Insert: ProfileInsert; Update: ProfileUpdate; Relationships: [] };
      as_requests: { Row: AsRequestRow; Insert: AsRequestInsert; Update: AsRequestUpdate; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: {
      claim_purchase_order_operation: {
        Args: { p_toss_order_id: string };
        Returns: { fresh: boolean };
      };
    };
  };
};
