"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerService = void 0;
const log4js_1 = require("log4js"); // it's for node.js only. otherwise, use console.log for react native (needs do command for environment before run)
/**
 * #### LoggerServiceクラス
 * - log4jsのログ出力機能をカプセル化したユーティリティクラス
 *
 * - 状態を保つクラス実装であり、インスタンス化して利用
 * - 環境変数への依存なし
 * - 依存パッケージはlog4jsのみ
 * - スレッドアンセーフ
 */
class LoggerService {
    /**
     * #### コンストラクタ
     * @param log4jsConfigPath log4jsのJSON設定ファイルパス
     * @param isLogging ロギングするか否か（任意）
     * @param isLoggingWithConsole ロギングをコンソールにも出力するか否か（任意）
     */
    constructor(log4jsConfigPath, isLogging = true, isLoggingWithConsole = true) {
        /**
         * #### Loggerオブジェクトを個別取得する内部メソッド
         * @param keyName LoggerTypeの任意のプロパティ名
         * @returns Loggerオブジェクト
         */
        this.getLogger = (keyName) => this._logger[keyName];
        /**
         * #### Accessログメッセージの生成と必要ならコンソール出力
         * @param params Type定義のTips参照
         * @returns 整形したメッセージ
         */
        this.createAccessLogMessage = (params) => `${params.status ? `status: ${params.status}, ` : ''}message: ${params.message}`;
        /**
         * #### 正常なアクセスログ出力メソッド
         * @param message 出力メッセージ
         */
        this.logAccessInfo = (message) => (this._isLogging ? this.accessLogger.info(this.createAccessLogMessage({ message: message, status: '情報' })) : void 0);
        /**
         * #### 警告レベルのアクセスログ出力メソッド
         * @param message 出力メッセージ
         */
        this.logAccessWarning = (message) => (this._isLogging ? this.accessLogger.warn(this.createAccessLogMessage({ message: message, status: '警告' })) : void 0);
        /**
         * #### エラーレベルのアクセスログ出力メソッド
         * @param message 出力メッセージ
         */
        this.logAccessError = (message) => (this._isLogging ? this.accessLogger.error(this.createAccessLogMessage({ message: message, status: 'エラー' })) : void 0);
        /**
         * ログをコンソール出力（log4jsのconsoleLoggerを使用しない場合）
         * @param message 出力メッセージ
         * @returns messageをそのまま返す
         */
        this.logConsole = (message) => (this._isLogging && this._isLoggingWithConsole ? `${message + console.log(message)}` : message);
        /**
         * #### Httpログメッセージの生成と必要ならコンソール出力
         * @param params Type定義のTips参照
         * @returns 整形したメッセージ
         */
        this.createHttpLogMessage = (params) => this.logConsole(`${params.url ? `url: ${params.url}, ` : ''}${params.status ? `status: ${params.status}, ` : ''}${params.ip ? `ip: ${params.ip}, ` : ''}${params.user ? `user: ${params.user}, ` : ''}message: ${params.message}`);
        /**
         * #### 正常なHttpログ出力メソッド
         * @param params Type定義のTips参照
         */
        this.logHttpInfo = (params) => {
            var _a;
            const logMessage = this.createHttpLogMessage(Object.assign(Object.assign({}, params), { status: (_a = params.status) !== null && _a !== void 0 ? _a : '情報' }));
            this._isLogging ? this.httpLogger.info(logMessage) : void 0;
            this._isLogging && this._isLoggingWithConsole ? this.consoleLogger.info(logMessage) : void 0;
        };
        /**
         * #### 警告レベルのHttpログ出力メソッド
         * @param message 出力メッセージ
         */
        this.logHttpWarning = (params) => {
            var _a;
            const logMessage = this.createHttpLogMessage(Object.assign(Object.assign({}, params), { status: (_a = params.status) !== null && _a !== void 0 ? _a : '警告' }));
            this._isLogging ? this.httpLogger.warn(logMessage) : void 0;
            this._isLogging && this._isLoggingWithConsole ? this.consoleLogger.warn(logMessage) : void 0;
        };
        /**
         * #### エラーレベルのHttpログ出力メソッド
         * @param message 出力メッセージ
         */
        this.logHttpError = (params) => {
            var _a;
            const logMessage = this.createHttpLogMessage(Object.assign(Object.assign({}, params), { status: (_a = params.status) !== null && _a !== void 0 ? _a : 'エラー' }));
            this._isLogging ? this.httpLogger.error(logMessage) : void 0;
            this._isLogging && this._isLoggingWithConsole ? this.consoleLogger.error(logMessage) : void 0;
        };
        /**
         * #### Systemログメッセージの生成と必要ならコンソール出力
         * @param params Type定義のTips参照
         * @returns オプションを合成したメッセージ
         */
        this.createSystemLogMessage = (params) => `${params.status ? `status: ${params.status}, ` : ''}${params.place ? `place: ${params.place}, ` : ''}message: ${params.message}`;
        /**
         * #### 正常なSystemログ出力メソッド
         * @param params Type定義のTips参照
         */
        this.logSystemInfo = (params) => {
            var _a;
            const logMessage = this.createSystemLogMessage(Object.assign(Object.assign({}, params), { status: (_a = params.status) !== null && _a !== void 0 ? _a : '情報' }));
            this._isLogging ? this.systemLogger.info(logMessage) : void 0;
            this._isLogging && this._isLoggingWithConsole ? this.consoleLogger.info(logMessage) : void 0;
        };
        /**
         * #### 警告レベルのSystenログ出力メソッド
         * @param params Type定義のTips参照
         */
        this.logSystemWarning = (params) => {
            var _a;
            const logMessage = this.createSystemLogMessage(Object.assign(Object.assign({}, params), { status: (_a = params.status) !== null && _a !== void 0 ? _a : '警告' }));
            this._isLogging ? this.systemLogger.warn(logMessage) : void 0;
            this._isLogging && this._isLoggingWithConsole ? this.consoleLogger.warn(logMessage) : void 0;
        };
        /**
         * #### エラーレベルのSystenログ出力メソッド
         * @param params Type定義のTips参照
         * @param e Errorオブジェクト（任意）
         */
        this.logSystemError = (params, e) => {
            var _a;
            const logMessage = this.createSystemLogMessage(Object.assign(Object.assign({}, params), { status: (_a = params.status) !== null && _a !== void 0 ? _a : 'エラー' })) + `${e ? `, \nerror: ${e}` : ''}`;
            this._isLogging ? this.systemLogger.error(logMessage) : void 0;
            this._isLogging && this._isLoggingWithConsole ? this.consoleLogger.error(logMessage) : void 0;
        };
        /**
         * #### anchorから現在地点間のmSec値を文字列取得
         * @param anchor - 任意の地点のperformance.now値
         */
        this.getElapsedTimeString = (anchor) => `${(performance.now() - anchor).toPrecision(4)} mSec`;
        /**
         * #### Performanceログメッセージの生成と必要ならコンソール出力
         * @param params Type定義のTips参照
         * @returns オプションを合成したメッセージ
         */
        this.createPerformanceLogMessage = (params) => { var _a; return `${params.place ? `place: ${params.place}, ` : ''}${params.status ? `status: ${params.status}, ` : ''}time: ${this.getElapsedTimeString((_a = params.anchor) !== null && _a !== void 0 ? _a : this._anchor)}`; };
        /**
         * #### performanceログ出力メソッド
         * - anchorから現在地点間のmSec値をperformanceログに出力
         * @param params Type定義のTips参照
         */
        this.logPerformance = (params) => {
            const logMessage = this.createPerformanceLogMessage(params);
            this._isLogging ? this.performanceLogger.info(logMessage) : void 0;
            this._isLogging && this._isLoggingWithConsole ? this.consoleLogger.info(logMessage) : void 0;
        };
        /**
         * #### Errorログ出力メソッド（すべてのエラーはここにも出力すると良いが必須ではない）
         * @param message 出力メッセージ
         */
        this.logError = (message) => (this._isLogging ? this.systemLogger.error(message) : void 0);
        /**
         * #### アンカーポイントを生成
         * @returns アンカーポイント
         */
        this.anchor = () => {
            this._anchor = performance.now();
            return this._anchor;
        };
        this._isLogging = isLogging;
        this._isLoggingWithConsole = isLoggingWithConsole;
        log4js_1.configure(log4jsConfigPath);
        this._logger = {
            access: log4js_1.getLogger('access'),
            http: log4js_1.getLogger('http'),
            system: log4js_1.getLogger('system'),
            performance: log4js_1.getLogger('performance'),
            console: log4js_1.getLogger('console'),
        };
        this._anchor = performance.now();
    }
    /**
     * accessLoggerのgetter
     * - getterはprivate、単純なログ出力メソッドを利用推奨
     */
    get accessLogger() {
        return this.getLogger('access');
    }
    /**
     * #### httpLoggerのgetter
     * - getterはprivate、単純なログ出力メソッドの方を利用推奨
     */
    get httpLogger() {
        return this.getLogger('http');
    }
    /**
     * #### systemLoggerのgetter
     * - getterはprivate、単純なログ出力メソッドの方を利用推奨
     */
    get systemLogger() {
        return this.getLogger('system');
    }
    /**
     * #### performanceLoggerのgetter
     * - getterはprivate、単純なログ出力メソッドの方を利用推奨
     */
    get performanceLogger() {
        return this.getLogger('performance');
    }
    /**
     * #### consoleLoggerのgetter
     * - getterはprivate、単純なログ出力メソッドの方を利用推奨
     */
    get consoleLogger() {
        return this.getLogger('console');
    }
}
exports.LoggerService = LoggerService;
//# sourceMappingURL=LoggerServiceNode.js.map