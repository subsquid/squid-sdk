import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const events = {
    NewTip: createEvent(
        'Tips.NewTip',
        {
            v2028: TipsNewTipEvent,
            v9130: TipsNewTipEvent,
        }
    ),
    TipClosed: createEvent(
        'Tips.TipClosed',
        {
            v2028: TipsTipClosedEvent,
            v9130: TipsTipClosedEvent,
        }
    ),
    TipClosing: createEvent(
        'Tips.TipClosing',
        {
            v2028: TipsTipClosingEvent,
            v9130: TipsTipClosingEvent,
        }
    ),
    TipRetracted: createEvent(
        'Tips.TipRetracted',
        {
            v2028: TipsTipRetractedEvent,
            v9130: TipsTipRetractedEvent,
        }
    ),
    TipSlashed: createEvent(
        'Tips.TipSlashed',
        {
            v2028: TipsTipSlashedEvent,
            v9130: TipsTipSlashedEvent,
        }
    ),
}

export const calls = {
    close_tip: createCall(
        'Tips.close_tip',
        {
            v2028: TipsCloseTipCall,
        }
    ),
    report_awesome: createCall(
        'Tips.report_awesome',
        {
            v2028: TipsReportAwesomeCall,
            v9291: TipsReportAwesomeCall,
        }
    ),
    retract_tip: createCall(
        'Tips.retract_tip',
        {
            v2028: TipsRetractTipCall,
        }
    ),
    slash_tip: createCall(
        'Tips.slash_tip',
        {
            v2028: TipsSlashTipCall,
        }
    ),
    tip: createCall(
        'Tips.tip',
        {
            v2028: TipsTipCall,
            v9111: TipsTipCall,
        }
    ),
    tip_new: createCall(
        'Tips.tip_new',
        {
            v2028: TipsTipNewCall,
            v9111: TipsTipNewCall,
            v9291: TipsTipNewCall,
        }
    ),
}

export const constants = {
    DataDepositPerByte: createConstant(
        'Tips.DataDepositPerByte',
        {
            v2028: TipsDataDepositPerByteConstant,
        }
    ),
    MaximumReasonLength: createConstant(
        'Tips.MaximumReasonLength',
        {
            v2028: TipsMaximumReasonLengthConstant,
        }
    ),
    TipCountdown: createConstant(
        'Tips.TipCountdown',
        {
            v2028: TipsTipCountdownConstant,
        }
    ),
    TipFindersFee: createConstant(
        'Tips.TipFindersFee',
        {
            v2028: TipsTipFindersFeeConstant,
        }
    ),
    TipReportDepositBase: createConstant(
        'Tips.TipReportDepositBase',
        {
            v2028: TipsTipReportDepositBaseConstant,
        }
    ),
}

export const storage = {
    Reasons: createStorage(
        'Tips.Reasons',
        {
            v2028: TipsReasonsStorage,
        }
    ),
    Tips: createStorage(
        'Tips.Tips',
        {
            v2028: TipsTipsStorage,
        }
    ),
}

export default {events, calls, constants}
