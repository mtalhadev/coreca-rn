"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentMilisecondsEx = void 0;
const date_fns_1 = require("date-fns");
/**
 * #### 基準日時からの現在日間のミリ秒を取得（時刻は00:00:00:000にリセット）
 * - imutableなdate-fnsライブラリ利用のため内部でlet使用
 *
 * @param params 現在日から指定した年数をプラス/マイナスしたのミリ秒を取得したい場合に指定（任意）
 * @returns 基準日時からの現在日間のミリ秒（paramsが指定されていればそれを反映した値）
 */
const getCurrentMilisecondsEx = (params) => {
    // default values
    params.years ? void 0 : (params.years = 0);
    params.months ? void 0 : (params.months = 0);
    params.days ? void 0 : (params.days = 0);
    // reset time
    let date = new Date();
    date = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
    // refrect params
    date = 0 <= params.years ? date_fns_1.addYears(date, params.years) : date_fns_1.subYears(date, Math.abs(params.years));
    date = 0 <= params.months ? date_fns_1.addMonths(date, params.months) : date_fns_1.subMonths(date, Math.abs(params.months));
    date = 0 <= params.days ? (date = date_fns_1.addDays(date, params.days)) : date_fns_1.subDays(date, Math.abs(params.days));
    return date.valueOf();
};
exports.getCurrentMilisecondsEx = getCurrentMilisecondsEx;
// for test pattern
//
// console.log(new Date(getCurrentMilisecondsEx({})))
// console.log(getCurrentMilisecondsEx({}))
//
// console.log(new Date(getCurrentMilisecondsEx({ years: 0, months: 0, days: 0 })))
// console.log(getCurrentMilisecondsEx({ years: 0, months: 0, days: 0 }))
//
// console.log(new Date(getCurrentMilisecondsEx({ years: 1, months: 10, days: 30 })))
// console.log(getCurrentMilisecondsEx({ years: 1, months: 10, days: 30 }))
//
// console.log(new Date(getCurrentMilisecondsEx({ years: -1, months: -10, days: -30 })))
// console.log(getCurrentMilisecondsEx({ years: -1, months: -10, days: -30 }))
//# sourceMappingURL=helper.js.map