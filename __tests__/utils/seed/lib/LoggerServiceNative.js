"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogger = void 0;
const react_native_logs_1 = require("react-native-logs");
/**
 * #### Loggerを生成して取得
 * - react-native-logsのコンソールログ出力機能をカプセル化した関数
 * - 環境変数への依存なし（__DEV__への依存もなし）
 * - 依存パッケージはreact-native-logsのみ
 *
 * @returns Type定義のTips参照
 */
const createLogger = () => {
    const log = react_native_logs_1.logger.createLogger({
        levels: {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3,
        },
        severity: 'debug',
        transport: react_native_logs_1.consoleTransport,
        transportOptions: {
            colors: {
                info: 'blueBright',
                warn: 'yellowBright',
                error: 'redBright',
            },
        },
        async: true,
        dateFormat: 'time',
        printLevel: true,
        printDate: true,
        enabled: true,
    });
    let _anchor = performance.now();
    /**
     * #### ログ出力を有効化
     */
    const enable = () => log.enable();
    /**
     * #### ログ出力を有効化
     */
    const disable = () => log.disable();
    /**
     * #### Accessログメッセージの生成
     * @param params Type定義のTips参照
     * @returns 整形したメッセージ
     */
    const _createAccessLogMessage = (params) => `type: ACCESS${params.status ? `, status: ${params.status}` : ''}${params.message ? `, message: ${params.message}` : ''}`;
    /**
     * #### 正常なアクセスログ出力メソッド
     * @param message 出力メッセージ
     */
    const logAccessInfo = (message) => log.info(_createAccessLogMessage({ message: message, status: '情報' }));
    /**
     * #### 警告レベルのアクセスログ出力メソッド
     * @param message 出力メッセージ
     */
    const logAccessWarning = (message) => log.warn(_createAccessLogMessage({ message: message, status: '警告' }));
    /**
     * #### エラーレベルのアクセスログ出力メソッド
     * @param message 出力メッセージ
     */
    const logAccessError = (message) => log.error(_createAccessLogMessage({ message: message, status: 'エラー' }));
    /**
     * #### Httpログメッセージの生成
     * @param params Type定義のTips参照
     * @returns 整形したメッセージ
     */
    const _createHttpLogMessage = (params) => 'type: HTTP' +
        `${params.url ? `, url: ${params.url}` : ''}` +
        `${params.status ? `, status: ${params.status}, ` : ''}` +
        `${params.ip ? `, ip: ${params.ip}, ` : ''}` +
        `${params.user ? `, user: ${params.user}, ` : ''}` +
        `${params.message ? `, message: ${params.message}` : ''}`;
    /**
     * #### 正常なHttpログ出力メソッド
     * @param params Type定義のTips参照
     */
    const logHttpInfo = (params) => { var _a; return log.info(_createHttpLogMessage(Object.assign(Object.assign({}, params), { status: (_a = params.status) !== null && _a !== void 0 ? _a : '情報' }))); };
    /**
     * #### 警告レベルのHttpログ出力メソッド
     * @param params Type定義のTips参照
     */
    const logHttpWarning = (params) => { var _a; return log.warn(_createHttpLogMessage(Object.assign(Object.assign({}, params), { status: (_a = params.status) !== null && _a !== void 0 ? _a : '警告' }))); };
    /**
     * #### エラーレベルのHttpログ出力メソッド
     * @param params Type定義のTips参照
     */
    const logHttpError = (params) => { var _a; return log.Error(_createHttpLogMessage(Object.assign(Object.assign({}, params), { status: (_a = params.status) !== null && _a !== void 0 ? _a : 'エラー' }))); };
    /**
     * #### Systemログメッセージの生成
     * @param params Type定義のTips参照
     * @returns 整形したメッセージ
     */
    const _createSystemLogMessage = (params) => `type: SYSTEM${params.status ? `, status: ${params.status}` : ''}${params.place ? `, place: ${params.place}` : ''}${params.message ? `, message: ${params.message}` : ''}`;
    /**
     * #### 正常なSystemログ出力メソッド
     * @param params Type定義のTips参照
     */
    const logSystemInfo = (params) => { var _a; return log.info(_createSystemLogMessage(Object.assign(Object.assign({}, params), { status: (_a = params.status) !== null && _a !== void 0 ? _a : '情報' }))); };
    /**
     * #### 警告レベルのSystenログ出力メソッド
     * @param params Type定義のTips参照
     */
    const logSystemWarning = (params) => { var _a; return log.warn(_createSystemLogMessage(Object.assign(Object.assign({}, params), { status: (_a = params.status) !== null && _a !== void 0 ? _a : '警告' }))); };
    /**
     * #### エラーレベルのSystenログ出力メソッド
     * @param params Type定義のTips参照
     * @param e Errorオブジェクト（任意）
     */
    const logSystemError = (params, e) => { var _a; return log.error(_createSystemLogMessage(Object.assign(Object.assign({}, params), { status: (_a = params.status) !== null && _a !== void 0 ? _a : 'エラー' })) + `${e ? `, \nerror: ${e}` : ''}`); };
    /**
     * #### anchorから現在地点間のmSec値を文字列取得
     * @param anchor - 任意の地点のperformance.now値
     */
    const _getElapsedTimeString = (anchor) => `${(performance.now() - anchor).toPrecision(4)} mSec`;
    /**
     * #### Performanceログメッセージの生成と必要ならコンソール出力
     * @param params Type定義のTips参照
     * @returns 整形したメッセージ
     */
    const _createPerformanceLogMessage = (params) => { var _a; return `type: PERF${params.place ? `, place: ${params.place}` : ''}${params.status ? `, status: ${params.status}, ` : ''}, time: ${_getElapsedTimeString((_a = params.anchor) !== null && _a !== void 0 ? _a : _anchor)}`; };
    /**
     * #### performanceログ出力メソッド
     * - anchorから現在地点間のmSec値をperformanceログに出力
     * @param params Type定義のTips参照
     */
    const logPerformance = (params) => { var _a; return log.info(_createPerformanceLogMessage(Object.assign(Object.assign({}, params), { status: (_a = params.status) !== null && _a !== void 0 ? _a : '情報' }))); };
    /**
     * #### アンカーポイントを生成
     * @returns アンカーポイント
     */
    const anchor = () => {
        _anchor = performance.now();
        return _anchor;
    };
    return {
        enable: enable,
        disable: disable,
        logAccessInfo: logAccessInfo,
        logAccessWarning: logAccessWarning,
        logAccessError: logAccessError,
        logHttpInfo: logHttpInfo,
        logHttpWarning: logHttpWarning,
        logHttpError: logHttpError,
        logSystemInfo: logSystemInfo,
        logSystemWarning: logSystemWarning,
        logSystemError: logSystemError,
        logPerformance: logPerformance,
        anchor: anchor,
    };
};
exports.createLogger = createLogger;
//# sourceMappingURL=LoggerServiceNative.js.map