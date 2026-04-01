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
    const remainingAmountForMultiplier = phase.totalAmount - fixedOffsetTotal;

    // 1倍率あたりの金額ベース（端数計算前）
    const baseAmount = multiplierTotal > 0 ? remainingAmountForMultiplier / multiplierTotal : 0;

    // 倍率ごとのグループ化を行い、グループ内で同一の金額を割り当てる（誤差防止）
    const multiplierGroups = new Map<number, string[]>();
    adjustments.forEach(({ participantId, adjustment }) => {
      if (adjustment.type === 'multiplier') {
        const v = adjustment.value;
        if (!multiplierGroups.has(v)) multiplierGroups.set(v, []);
        multiplierGroups.get(v)!.push(participantId);
      }
    });

    // 各参加者のフェーズ別負担額を加算
    // 固定額の人
    adjustments.filter(a => a.adjustment.type === 'fixed_offset').forEach(({ participantId, adjustment }) => {
      const current = participantAmounts.get(participantId) || 0;
      participantAmounts.set(participantId, current + adjustment.value);
    });

    // 倍率グループの人
    multiplierGroups.forEach((ids, multiplier) => {
      const amountPerPerson = baseAmount * multiplier;
      ids.forEach(id => {
        const current = participantAmounts.get(id) || 0;
        participantAmounts.set(id, current + amountPerPerson);
      });
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
