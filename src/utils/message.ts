import type { Event, CalculationResult, PaymentInfo, MessageTemplates } from '../types';

// デフォルトテンプレート（設定の「初期テンプレートに戻す」でも使用）
export const defaultTemplates: MessageTemplates = {
  all: `お疲れ様です！
「{{飲み会名}}」の精算をお願いします🙏

▼内訳
{{内訳}}

{{支払い金額}}

{{支払い先}}

よろしくお願いします！`,
  remind: `お疲れ様です！
「{{飲み会名}}」の精算リマインドです🙇‍♂️
お忙しいところ恐縮ですが、お手隙の際にご確認をお願いします！

▼内訳
{{内訳}}

{{支払い金額}}

{{支払い先}}`
};

export function generateAllMessage(
  event: Event, 
  results: CalculationResult[], 
  paymentInfo: PaymentInfo,
  displayMode: 'amount' | 'person' = 'amount',
  templates?: MessageTemplates
): string {
  const template = templates?.all || defaultTemplates.all;
  return replacePlaceholders(template, event, results, paymentInfo, displayMode);
}

export function generateRemindMessage(
  event: Event, 
  results: CalculationResult[], 
  paymentInfo: PaymentInfo,
  displayMode: 'amount' | 'person' = 'amount',
  templates?: MessageTemplates
): string {
  const unpaidResults = results.filter(r => !r.hasPaid);
  if (unpaidResults.length === 0) return '未払いの方はいません！';

  const template = templates?.remind || defaultTemplates.remind;
  return replacePlaceholders(template, event, unpaidResults, paymentInfo, displayMode);
}

function replacePlaceholders(
  template: string,
  event: Event,
  results: CalculationResult[],
  paymentInfo: PaymentInfo,
  displayMode: 'amount' | 'person'
): string {
  const resultSection = generateResultSection(results, displayMode);
  const paymentInfoSection = generatePaymentSection(paymentInfo);

  return template
    .replace(/\{\{飲み会名\}\}/g, event.name)
    .replace(/\{\{内訳\}\}/g, event.phases.map(p => `・${p.name} (¥${p.totalAmount.toLocaleString()})`).join('\n'))
    .replace(/\{\{支払い金額\}\}/g, resultSection)
    .replace(/\{\{支払い先\}\}/g, paymentInfoSection)
    // 互換性のための古いタグ
    .replace(/\{\{eventName\}\}/g, event.name)
    .replace(/\{\{phaseList\}\}/g, event.phases.map(p => `・${p.name} (¥${p.totalAmount.toLocaleString()})`).join('\n'))
    .replace(/\{\{resultSection\}\}/g, resultSection)
    .replace(/\{\{paymentInfo\}\}/g, paymentInfoSection)
    .trim();
}

// 支払い金額セクションの生成
function generateResultSection(results: CalculationResult[], displayMode: 'amount' | 'person'): string {
  if (results.length === 0) return 'なし';

  if (displayMode === 'person') {
    // 人単位: 一人一行
    const lines = results.map(r => {
      const status = r.hasPaid ? ' 【済】' : '';
      return `${r.name}：¥${r.totalAmount.toLocaleString()}${status}`;
    });
    return `▼支払い金額\n${lines.join('\n')}`;
  } else {
    // 円単位: 金額でグルーピング
    const groups: Record<number, string[]> = {};
    results.forEach(r => {
      if (!groups[r.totalAmount]) {
        groups[r.totalAmount] = [];
      }
      const status = r.hasPaid ? '(済)' : '';
      groups[r.totalAmount].push(r.name + status);
    });

    const groupLines = Object.keys(groups)
      .map(Number)
      .sort((a, b) => b - a)
      .map(amount => {
        return `▽${amount.toLocaleString()}円\n${groups[amount].join(', ')}`;
      })
      .join('\n\n');

    return `▼支払い金額\n${groupLines}`;
  }
}

// 支払い先セクションの生成
function generatePaymentSection(paymentInfo: PaymentInfo): string {
  const lines: string[] = [];

  if (paymentInfo.bankAccounts && paymentInfo.bankAccounts.length > 0) {
    paymentInfo.bankAccounts.forEach((account) => {
      if (account.bankName) {
        lines.push(`・${account.bankName}/${account.branchName || ''}/${account.accountNumber || ''}/${account.accountType || '普通'}`);
      }
    });
  }
  if (paymentInfo.paypayId) {
    lines.push(`・paypay ${paymentInfo.paypayId}`);
  }

  if (lines.length === 0) return '';
  return `▼支払い先\n${lines.join('\n')}`;
}
