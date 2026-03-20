import type { Event, CalculationResult, Adjustment } from '../types';

export function calculateSettlement(event: Event): CalculationResult[] {
  // 1. 各参加者の最終金額を格納するマップを初期化
  const participantAmounts = new Map<string, number>();
  event.participants.forEach(p => {
    participantAmounts.set(p.id, 0);
  });

  // 2. フェーズごとに計算
  event.phases.forEach(phase => {
    if (phase.participantIds.length === 0 || phase.totalAmount === 0) return;

    // このフェーズの参加者リストを取得
    const activeParticipants = event.participants.filter(p => phase.participantIds.includes(p.id));
    if (activeParticipants.length === 0) return;

    // それぞれのこのフェーズの傾斜設定を取得
    const adjustments = activeParticipants.map(p => {
      // phaseごとの調整値があればそれ、なければデフォルト(multiplier 1.0)
      const adj = p.adjustments && p.adjustments[phase.id] 
        ? p.adjustments[phase.id] 
        : { type: 'multiplier', value: 1.0 } as Adjustment;
      return { participantId: p.id, adjustment: adj };
    });

    // 定額オフセットの合計値を計算
    const fixedOffsetTotal = adjustments
      .filter(a => a.adjustment.type === 'fixed_offset')
      .reduce((sum, a) => sum + a.adjustment.value, 0);

    // 倍率の合計値を計算
    const multiplierTotal = adjustments
      .filter(a => a.adjustment.type === 'multiplier')
      .reduce((sum, a) => sum + a.adjustment.value, 0);

    // 倍率で分割すべき基本金額（定額分を引いた金額）
    // NOTE: 定額オフセットは全体の金額から定額引かれるわけではなく、「均等割額＋オフセット」の意図とする場合は別の計算になる。
    // 一般的な飲み会の割り勘では、定額は「Aさんは1000円余分に払う」という意味あいで全体のパイから引くのが自然。
    const remainingAmountForMultiplier = phase.totalAmount - fixedOffsetTotal;

    // 1倍率あたりの金額ベース（端数計算前）
    const baseAmount = multiplierTotal > 0 ? remainingAmountForMultiplier / multiplierTotal : 0;

    // 各参加者のフェーズ別負担額を加算
    adjustments.forEach(({ participantId, adjustment }) => {
      let amount = 0;
      if (adjustment.type === 'fixed_offset') {
        // 定額オフセットの人は、基本的には「均等割額＋オフセット」というより、固定額そのものとするか？
        // いいえ、仕様では「定額オフセット（加算/減算）」「新卒は -1000円」などの意図。
        // ここは一旦、「全員ベース額を払い、その上で加減算される」というより「倍率グループ」と「定額追加/割引」として計算する。
        // 仕様詳細化: 
        // type = fixed_offset の value は「基準額からの差額」ではなく、「そのフェーズで支払う固定額」と解釈するのが最もシンプルで破綻しない。
        // もしくは「定額割引」と「定額追加」であれば、残りのお金を倍率組で割るだけ。
        // 実装方針: 倍率1.0で計算した上でオフセットを引くのではなく、オフセットは文字通り「固定額引く/足す」
        
        // 複雑化を避けるため、「定額」と「倍率」の2パターンとして、定額の人は完全固定額とする。
        // 例: value = 3000 なら 3000円。
        amount = adjustment.value;
      } else {
        // 倍率計算
        amount = baseAmount * adjustment.value;
      }

      const current = participantAmounts.get(participantId) || 0;
      participantAmounts.set(participantId, current + amount);
    });
  });

  // 3. 全フェーズ合算後の金額に対して、各ユーザーごとの端数処理
  let totalCalculated = 0;
  let leaderId: string | null = null;
  
  if (event.participants.length > 0) {
    leaderId = event.participants[0].id; // 幹事を最初の参加者とする
  }

  const results: CalculationResult[] = event.participants.map(p => {
    const rawAmount = participantAmounts.get(p.id) || 0;
    
    // 端数処理（10, 50, 100, 1000）
    let roundedAmount = rawAmount;
    if (event.roundingUnit > 0) {
      // 割り勘は「切り上げ」とする（集金不足を防ぎ、余剰分は幹事が受け取る）
      roundedAmount = Math.ceil(rawAmount / event.roundingUnit) * event.roundingUnit;
    }

    totalCalculated += roundedAmount;

    return {
      participantId: p.id,
      name: p.name,
      totalAmount: roundedAmount,
      hasPaid: p.hasPaid
    };
  });

  // 4. 端数の残差を幹事（最初の参加者）に加算
  const totalActualAmount = event.phases.reduce((sum, phase) => sum + phase.totalAmount, 0);
  const diff = totalActualAmount - totalCalculated;

  if (diff !== 0 && leaderId) {
    const leaderResult = results.find(r => r.participantId === leaderId);
    if (leaderResult) {
      leaderResult.totalAmount += diff;
    }
  }

  return results;
}
