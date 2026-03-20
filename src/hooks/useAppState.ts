import { useReducer, useEffect, useMemo } from 'react';
import type { Event, AppState, Participant, Phase, UserConfig, CalculationResult } from '../types';
import { calculateSettlement } from '../utils/calculate';
import { defaultTemplates } from '../utils/message';
import { generateId } from '../utils/uuid';

type Action = 
  | { type: 'SET_ACTIVE_EVENT'; payload: string | null }
  | { type: 'ADD_EVENT'; payload: Event }
  | { type: 'REMOVE_EVENT'; payload: string }
  | { type: 'UPDATE_EVENT'; payload: Event }
  | { type: 'TOGGLE_EVENT_COMPLETED'; payload: string }
  | { type: 'UPDATE_USER_CONFIG'; payload: UserConfig }
  // 以前のAction（アクティブイベントに対して実行）
  | { type: 'UPDATE_EVENT_NAME'; payload: string }
  | { type: 'ADD_PARTICIPANT'; payload: Participant }
  | { type: 'REMOVE_PARTICIPANT'; payload: string }
  | { type: 'UPDATE_PARTICIPANT'; payload: Participant }
  | { type: 'ADD_PHASE'; payload: Phase }
  | { type: 'REMOVE_PHASE'; payload: string }
  | { type: 'UPDATE_PHASE'; payload: Phase }
  | { type: 'UPDATE_ROUNDING_UNIT'; payload: 10 | 50 | 100 | 1000 }
  | { type: 'COPY_FROM_EVENT'; payload: string };

const STORAGE_KEY = 'warikan-app-state';
const OLD_STORAGE_KEY = 'warikan-event';

// デフォルトテンプレートは message.ts から一元管理
const defaultUserConfig: UserConfig = {
  paymentInfo: {
    paypayId: '',
    bankAccounts: [
      { id: generateId(), bankName: '', branchName: '', accountType: '普通', accountNumber: '', accountHolder: '' }
    ]
  },
  messageTemplates: defaultTemplates
};

const sampleEvent: Event = {
  id: 'sample-event-id',
  name: '【サンプル】金曜 de 定例飲み会（二次会込み）',
  participants: [
    { 
      id: 'p1', 
      name: '自分（幹事）', 
      hasPaid: true, 
      adjustments: {
        'ph1': { type: 'multiplier', value: 1.5 },
        'ph2': { type: 'multiplier', value: 1.5 }
      } 
    },
    { id: 'p2', name: '田中さん', hasPaid: false, adjustments: {} },
    { id: 'p3', name: '佐藤さん', hasPaid: false, adjustments: {} },
    { id: 'p4', name: '鈴木さん', hasPaid: false, adjustments: {} },
  ],
  phases: [
    { 
      id: 'ph1', 
      name: '個室居酒屋 ◯◯（一次会）', 
      totalAmount: 18000, 
      participantIds: ['p1', 'p2', 'p3', 'p4'] 
    },
    { 
      id: 'ph2', 
      name: 'カラオケパセラ（二次会）', 
      totalAmount: 7500, 
      participantIds: ['p1', 'p2', 'p3'] // 鈴木さんは除外
    },
  ],
  roundingUnit: 10,
  status: 'active',
  createdAt: new Date().toISOString(),
};

const getInitialState = (): AppState => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // 既存データがある場合でも、テンプレートが未設定（または空）の場合はデフォルトを補填
      const existingTemplates = parsed.userConfig.messageTemplates || {};
      
      let allTemp = existingTemplates.all || '';
      let remindTemp = existingTemplates.remind || '';
      
      // 日本語タグ（飲み会名 or 支払い金額）が含まれていない場合は新形式へ強制リセット
      const isNewFormat = allTemp.includes('{{飲み会名}}') || allTemp.includes('{{支払い金額}}');
      
      if (!isNewFormat) {
        allTemp = defaultUserConfig.messageTemplates!.all;
        remindTemp = defaultUserConfig.messageTemplates!.remind;
      }

      parsed.userConfig.messageTemplates = {
        all: allTemp,
        remind: remindTemp
      };
      return parsed;
    } catch (e) {
      console.error('Failed to parse app state', e);
    }
  }

  // 移行ロジック: 旧データの読み込み
  const oldSaved = localStorage.getItem(OLD_STORAGE_KEY);
  if (oldSaved) {
    try {
      const oldEvent = JSON.parse(oldSaved);
      // 旧データのpaymentInfoをグローバル設定へ
      const userConfig: UserConfig = {
        paymentInfo: oldEvent.paymentInfo || defaultUserConfig.paymentInfo
      };
      // イベント本体
      const event: Event = {
        ...oldEvent,
        status: oldEvent.status || 'active'
      };
      // statusを追加（旧データにはない可能性があるため）
      if (!event.status) event.status = 'active';
      
      const initialState: AppState = {
        events: [event],
        userConfig,
        activeEventId: event.id
      };
      // 保存
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));
      return initialState;
    } catch (e) {
      console.error('Failed to migrate old event', e);
    }
  }

  // サンプルデータの提供
  return {
    events: [sampleEvent],
    userConfig: {
      ...defaultUserConfig,
      // 既存データの有無に関わらず、テンプレートが未定義の場合はデフォルトをセット
      messageTemplates: defaultUserConfig.messageTemplates
    },
    activeEventId: null // ダッシュボードから開始
  };
};

function appReducer(state: AppState, action: Action): AppState {
  // グローバルアクション
  switch (action.type) {
    case 'SET_ACTIVE_EVENT':
      return { ...state, activeEventId: action.payload };
    case 'ADD_EVENT':
      return { 
        ...state, 
        events: [action.payload, ...state.events],
        activeEventId: action.payload.id 
      };
    case 'REMOVE_EVENT':
      return { 
        ...state, 
        events: state.events.filter(e => e.id !== action.payload),
        activeEventId: state.activeEventId === action.payload ? null : state.activeEventId
      };
    case 'UPDATE_EVENT':
      return {
        ...state,
        events: state.events.map(e => e.id === action.payload.id ? action.payload : e)
      };
    case 'TOGGLE_EVENT_COMPLETED':
      return {
        ...state,
        events: state.events.map(e => 
          e.id === action.payload 
            ? { ...e, status: e.status === 'completed' ? 'active' : 'completed' } 
            : e
        )
      };
    case 'UPDATE_USER_CONFIG':
      return { ...state, userConfig: action.payload };
  }

  // アクティブイベントに対するアクション
  if (!state.activeEventId) return state;

  const activeEventIndex = state.events.findIndex(e => e.id === state.activeEventId);
  if (activeEventIndex === -1) return state;

  const activeEvent = state.events[activeEventIndex];
  let updatedEvent: Event = { ...activeEvent };

  switch (action.type) {
    case 'UPDATE_EVENT_NAME':
      updatedEvent.name = action.payload;
      break;
    case 'ADD_PARTICIPANT':
      updatedEvent.participants = [...activeEvent.participants, action.payload];
      break;
    case 'REMOVE_PARTICIPANT':
      updatedEvent.participants = activeEvent.participants.filter(p => p.id !== action.payload);
      updatedEvent.phases = activeEvent.phases.map(ph => ({
        ...ph,
        participantIds: ph.participantIds.filter(id => id !== action.payload)
      }));
      break;
    case 'UPDATE_PARTICIPANT':
      updatedEvent.participants = activeEvent.participants.map(p => 
        p.id === action.payload.id ? action.payload : p
      );
      break;
    case 'ADD_PHASE':
      updatedEvent.phases = [...activeEvent.phases, action.payload];
      break;
    case 'REMOVE_PHASE':
      updatedEvent.phases = activeEvent.phases.filter(ph => ph.id !== action.payload);
      break;
    case 'UPDATE_PHASE':
      updatedEvent.phases = activeEvent.phases.map(ph => 
        ph.id === action.payload.id ? action.payload : ph
      );
      break;
    case 'UPDATE_ROUNDING_UNIT':
      updatedEvent.roundingUnit = action.payload;
      break;
    case 'COPY_FROM_EVENT': {
      const sourceEvent = state.events.find(e => e.id === action.payload);
      if (!sourceEvent) break;

      updatedEvent.name = sourceEvent.name + ' (コピー)';

      const oldToNewParticipantId: Record<string, string> = {};
      const newParticipants = sourceEvent.participants.map(p => {
        const newId = generateId();
        oldToNewParticipantId[p.id] = newId;
        return { ...p, id: newId, hasPaid: false, adjustments: {} };
      });

      const oldToNewPhaseId: Record<string, string> = {};
      const newPhases = sourceEvent.phases.map(ph => {
        const newId = crypto.randomUUID();
        oldToNewPhaseId[ph.id] = newId;
        return {
          ...ph,
          id: newId,
          participantIds: ph.participantIds.map(oldId => oldToNewParticipantId[oldId] || oldId),
        };
      });

      sourceEvent.participants.forEach(p => {
        const newP = newParticipants.find(np => np.id === oldToNewParticipantId[p.id]);
        if (newP) {
          const newAdjustments: Record<string, any> = {};
          Object.entries(p.adjustments).forEach(([oldPhaseId, adj]) => {
            const newPhaseId = oldToNewPhaseId[oldPhaseId];
            if (newPhaseId) {
              newAdjustments[newPhaseId] = { ...adj };
            }
          });
          newP.adjustments = newAdjustments;
        }
      });

      updatedEvent.participants = newParticipants;
      updatedEvent.phases = newPhases;
      updatedEvent.roundingUnit = sourceEvent.roundingUnit;
      break;
    }
    default:
      return state;
  }

  const newEvents = [...state.events];
  newEvents[activeEventIndex] = updatedEvent;
  return { ...state, events: newEvents };
}

export function useAppState() {
  const [state, dispatch] = useReducer(appReducer, undefined, getInitialState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const activeEvent = useMemo(() => 
    state.events.find(e => e.id === state.activeEventId) || null
  , [state.events, state.activeEventId]);

  const results: CalculationResult[] = useMemo(() => 
    activeEvent ? calculateSettlement(activeEvent) : []
  , [activeEvent]);

  return {
    state,
    activeEvent,
    results,
    dispatch
  };
}
