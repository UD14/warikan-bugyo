export type BankAccount = {
  id: string;
  bankName: string;         // 銀行名
  branchName: string;       // 支店名
  accountType: '普通' | '当座';
  accountNumber: string;    // 口座番号
  accountHolder: string;    // 口座名義
};

// 振込先情報（グローバル設定用）
export type PaymentInfo = {
  paypayId: string;         // PayPayのID or 電話番号
  bankAccounts: BankAccount[];
};

export type MessageTemplates = {
  all: string;
  remind: string;
};

export type UserConfig = {
  paymentInfo: PaymentInfo;
  messageTemplates?: MessageTemplates;
};

// 傾斜設定
export type Adjustment = {
  type: 'multiplier' | 'fixed_offset'; // 倍率 or 定額加算/減算
  value: number;                        // 倍率なら1.0, 定額なら円
};

// フェーズ（1軒分）
export type Phase = {
  id: string;
  name: string;             // 例: "1軒目：サバ銀"
  totalAmount: number;      // そのフェーズの合計金額
  participantIds: string[]; // 参加した参加者IDのリスト
};

// 参加者
export type Participant = {
  id: string;             // uuid
  name: string;
  adjustments: Record<string, Adjustment>; // phaseId をキーにした傾斜設定。未設定のフェーズはデフォルト値で計算
  hasPaid: boolean;
};

// イベント（飲み会全体）
export type Event = {
  id: string;
  name: string;           // 例: "3月定例会"
  phases: Phase[];
  participants: Participant[];
  roundingUnit: 10 | 50 | 100 | 1000; // 端数処理単位
  status: 'active' | 'completed';     // ステータス: 進行中 or 完了
  createdAt: string;      // ISO8601
};

// 全体の状態
export type AppState = {
  events: Event[];
  userConfig: UserConfig;
  activeEventId: string | null; // 現在表示中のイベントID。nullならダッシュボード表示
};

// 計算結果（導出型・保存しない）
export type CalculationResult = {
  participantId: string;
  name: string;
  totalAmount: number;    // 端数処理後の最終金額
  hasPaid: boolean;
};
