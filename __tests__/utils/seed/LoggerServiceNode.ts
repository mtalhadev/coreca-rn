import { Logger, getLogger, configure } from 'log4js' // it's for node.js only. otherwise, use console.log for react native (needs do command for environment before run)

/**
 * #### AccessLogMessageの引数タイプ
 * @property message: メッセージ文字列（任意）
 * @property status: 情報、警告、エラーなどの状態文字列（任意）
 */
type AccessLogMessageParam = Partial<{
    message: string
    status: string
}>

/**
 * #### HttpLogMessageの引数タイプ
 * @property message: メッセージ（任意）
 * @property status: 情報、警告、エラーなどの状態（任意）
 * @property url: URL（任意）
 * @property ip: IPアドレス（任意）
 * @property user: ユーザアカウント（任意）
 */
type HttpLogMessageParam = Partial<{
    message: string
    status?: string
    url?: string
    ip?: string
    user?: string
}>

/**
 * #### SystemLogMessageの引数タイプ
 * @property message: メッセージ（任意）
 * @property status: 情報、警告、エラーなどの状態（任意）
 * @property place: 発生場所（任意）
 */
type SystemLogMessageParam = Partial<{
    message: string
    status?: string
    place?: string
}>

/**
 * #### PerformanceLogMessageの引数タイプ
 * @property place: コード上の計測地点を表す文字列（任意）
 * @property anchor: 任意の地点のperformance.now値（任意）
 * @property status: 情報、警告、エラーなどの状態（任意）
 */
type PerformanceLogMessageParam = Partial<{
    place: string
    anchor?: number
    status?: string
}>

/**
 * #### Logegrタイプ
 */
type LoggerType = {
    access: Logger
    http: Logger
    system: Logger
    performance: Logger
    console: Logger
}

/**
 * #### LoggerServiceクラス
 * - log4jsのログ出力機能をカプセル化したユーティリティクラス
 *
 * - 状態を保つクラス実装であり、インスタンス化して利用
 * - 環境変数への依存なし
 * - 依存パッケージはlog4jsのみ
 * - スレッドアンセーフ
 */
export class LoggerService {
    //
    // private data members
    //
    private _logger: LoggerType
    private _isLogging: boolean
    private _isLoggingWithConsole: boolean
    private _anchor: number

    /**
     * #### コンストラクタ
     * @param log4jsConfigPath log4jsのJSON設定ファイルパス
     * @param isLogging ロギングするか否か（任意）
     * @param isLoggingWithConsole ロギングをコンソールにも出力するか否か（任意）
     */
    constructor(log4jsConfigPath: string, isLogging = true, isLoggingWithConsole = true) {
        this._isLogging = isLogging
        this._isLoggingWithConsole = isLoggingWithConsole
        configure(log4jsConfigPath)

        this._logger = {
            access: getLogger('access'),
            http: getLogger('http'),
            system: getLogger('system'),
            performance: getLogger('performance'),
            console: getLogger('console'),
        } as const

        this._anchor = performance.now()
    }

    /**
     * #### Loggerオブジェクトを個別取得する内部メソッド
     * @param keyName LoggerTypeの任意のプロパティ名
     * @returns Loggerオブジェクト
     */
    private getLogger = (keyName: keyof LoggerType) => this._logger[keyName]

    /**
     * accessLoggerのgetter
     * - getterはprivate、単純なログ出力メソッドを利用推奨
     */
    private get accessLogger(): Logger {
        return this.getLogger('access')
    }

    /**
     * #### httpLoggerのgetter
     * - getterはprivate、単純なログ出力メソッドの方を利用推奨
     */
    private get httpLogger(): Logger {
        return this.getLogger('http')
    }

    /**
     * #### systemLoggerのgetter
     * - getterはprivate、単純なログ出力メソッドの方を利用推奨
     */
    private get systemLogger(): Logger {
        return this.getLogger('system')
    }

    /**
     * #### performanceLoggerのgetter
     * - getterはprivate、単純なログ出力メソッドの方を利用推奨
     */
    private get performanceLogger(): Logger {
        return this.getLogger('performance')
    }

    /**
     * #### consoleLoggerのgetter
     * - getterはprivate、単純なログ出力メソッドの方を利用推奨
     */
    private get consoleLogger(): Logger {
        return this.getLogger('console')
    }

    /**
     * #### Accessログメッセージの生成と必要ならコンソール出力
     * @param params Type定義のTips参照
     * @returns 整形したメッセージ
     */
    private createAccessLogMessage = (params: AccessLogMessageParam) => `${params.status ? `status: ${params.status}, ` : ''}message: ${params.message}`

    /**
     * #### 正常なアクセスログ出力メソッド
     * @param message 出力メッセージ
     */
    logAccessInfo = (message: string): void => (this._isLogging ? this.accessLogger.info(this.createAccessLogMessage({ message: message, status: '情報' })) : void 0)

    /**
     * #### 警告レベルのアクセスログ出力メソッド
     * @param message 出力メッセージ
     */
    logAccessWarning = (message: string): void => (this._isLogging ? this.accessLogger.warn(this.createAccessLogMessage({ message: message, status: '警告' })) : void 0)

    /**
     * #### エラーレベルのアクセスログ出力メソッド
     * @param message 出力メッセージ
     */
    logAccessError = (message: string): void => (this._isLogging ? this.accessLogger.error(this.createAccessLogMessage({ message: message, status: 'エラー' })) : void 0)

    /**
     * ログをコンソール出力（log4jsのconsoleLoggerを使用しない場合）
     * @param message 出力メッセージ
     * @returns messageをそのまま返す
     */
    private logConsole = (message: string) => (this._isLogging && this._isLoggingWithConsole ? `${message + console.log(message)}` : message)

    /**
     * #### Httpログメッセージの生成と必要ならコンソール出力
     * @param params Type定義のTips参照
     * @returns 整形したメッセージ
     */
    private createHttpLogMessage = (params: HttpLogMessageParam) =>
        this.logConsole(
            `${params.url ? `url: ${params.url}, ` : ''}${params.status ? `status: ${params.status}, ` : ''}${params.ip ? `ip: ${params.ip}, ` : ''}${
                params.user ? `user: ${params.user}, ` : ''
            }message: ${params.message}`,
        )

    /**
     * #### 正常なHttpログ出力メソッド
     * @param params Type定義のTips参照
     */
    logHttpInfo = (params: HttpLogMessageParam): void => {
        const logMessage = this.createHttpLogMessage({ ...params, status: params.status ?? '情報' })
        this._isLogging ? this.httpLogger.info(logMessage) : void 0
        this._isLogging && this._isLoggingWithConsole ? this.consoleLogger.info(logMessage) : void 0
    }

    /**
     * #### 警告レベルのHttpログ出力メソッド
     * @param message 出力メッセージ
     */
    logHttpWarning = (params: HttpLogMessageParam): void => {
        const logMessage = this.createHttpLogMessage({ ...params, status: params.status ?? '警告' })
        this._isLogging ? this.httpLogger.warn(logMessage) : void 0
        this._isLogging && this._isLoggingWithConsole ? this.consoleLogger.warn(logMessage) : void 0
    }

    /**
     * #### エラーレベルのHttpログ出力メソッド
     * @param message 出力メッセージ
     */
    logHttpError = (params: HttpLogMessageParam): void => {
        const logMessage = this.createHttpLogMessage({ ...params, status: params.status ?? 'エラー' })
        this._isLogging ? this.httpLogger.error(logMessage) : void 0
        this._isLogging && this._isLoggingWithConsole ? this.consoleLogger.error(logMessage) : void 0
    }

    /**
     * #### Systemログメッセージの生成と必要ならコンソール出力
     * @param params Type定義のTips参照
     * @returns オプションを合成したメッセージ
     */
    private createSystemLogMessage = (params: SystemLogMessageParam) =>
        `${params.status ? `status: ${params.status}, ` : ''}${params.place ? `place: ${params.place}, ` : ''}message: ${params.message}`

    /**
     * #### 正常なSystemログ出力メソッド
     * @param params Type定義のTips参照
     */
    logSystemInfo = (params: SystemLogMessageParam): void => {
        const logMessage = this.createSystemLogMessage({ ...params, status: params.status ?? '情報' })
        this._isLogging ? this.systemLogger.info(logMessage) : void 0
        this._isLogging && this._isLoggingWithConsole ? this.consoleLogger.info(logMessage) : void 0
    }

    /**
     * #### 警告レベルのSystenログ出力メソッド
     * @param params Type定義のTips参照
     */
    logSystemWarning = (params: SystemLogMessageParam): void => {
        const logMessage = this.createSystemLogMessage({ ...params, status: params.status ?? '警告' })
        this._isLogging ? this.systemLogger.warn(logMessage) : void 0
        this._isLogging && this._isLoggingWithConsole ? this.consoleLogger.warn(logMessage) : void 0
    }

    /**
     * #### エラーレベルのSystenログ出力メソッド
     * @param params Type定義のTips参照
     * @param e Errorオブジェクト（任意）
     */
    logSystemError = (params: SystemLogMessageParam, e?: Error): void => {
        const logMessage = this.createSystemLogMessage({ ...params, status: params.status ?? 'エラー' }) + `${e ? `, \nerror: ${e}` : ''}`
        this._isLogging ? this.systemLogger.error(logMessage) : void 0
        this._isLogging && this._isLoggingWithConsole ? this.consoleLogger.error(logMessage) : void 0
    }

    /**
     * #### anchorから現在地点間のmSec値を文字列取得
     * @param anchor - 任意の地点のperformance.now値
     */
    private getElapsedTimeString = (anchor: number) => `${(performance.now() - anchor).toPrecision(4)} mSec`

    /**
     * #### Performanceログメッセージの生成と必要ならコンソール出力
     * @param params Type定義のTips参照
     * @returns オプションを合成したメッセージ
     */
    private createPerformanceLogMessage = (params: PerformanceLogMessageParam) =>
        `${params.place ? `place: ${params.place}, ` : ''}${params.status ? `status: ${params.status}, ` : ''}time: ${this.getElapsedTimeString(params.anchor ?? this._anchor)}`

    /**
     * #### performanceログ出力メソッド
     * - anchorから現在地点間のmSec値をperformanceログに出力
     * @param params Type定義のTips参照
     */
    logPerformance = (params: PerformanceLogMessageParam): void => {
        const logMessage = this.createPerformanceLogMessage(params)
        this._isLogging ? this.performanceLogger.info(logMessage) : void 0
        this._isLogging && this._isLoggingWithConsole ? this.consoleLogger.info(logMessage) : void 0
    }

    /**
     * #### Errorログ出力メソッド（すべてのエラーはここにも出力すると良いが必須ではない）
     * @param message 出力メッセージ
     */
    logError = (message: string): void => (this._isLogging ? this.systemLogger.error(message) : void 0)

    /**
     * #### アンカーポイントを生成
     * @returns アンカーポイント
     */
    anchor = (): number => {
        this._anchor = performance.now()
        return this._anchor
    }
}
