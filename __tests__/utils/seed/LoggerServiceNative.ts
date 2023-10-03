import { logger, consoleTransport } from 'react-native-logs'

/**
 * #### Loggerを生成して取得
 * - react-native-logsのコンソールログ出力機能をカプセル化した関数
 * - 環境変数への依存なし（__DEV__への依存もなし）
 * - 依存パッケージはreact-native-logsのみ
 *
 * @returns Type定義のTips参照
 */
export const createLogger = () => {
    const log = logger.createLogger({
        levels: {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3,
        },
        severity: 'debug',
        transport: consoleTransport,
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
    })
    let _anchor = performance.now()

    /**
     * #### ログ出力を有効化
     */
    const enable = () => log.enable()

    /**
     * #### ログ出力を有効化
     */
    const disable = () => log.disable()

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
     * #### Accessログメッセージの生成
     * @param params Type定義のTips参照
     * @returns 整形したメッセージ
     */
    const _createAccessLogMessage = (params: AccessLogMessageParam) => `type: ACCESS${params.status ? `, status: ${params.status}` : ''}${params.message ? `, message: ${params.message}` : ''}`

    /**
     * #### 正常なアクセスログ出力メソッド
     * @param message 出力メッセージ
     */
    const logAccessInfo = (message: string) => log.info(_createAccessLogMessage({ message: message, status: '情報' }))

    /**
     * #### 警告レベルのアクセスログ出力メソッド
     * @param message 出力メッセージ
     */
    const logAccessWarning = (message: string) => log.warn(_createAccessLogMessage({ message: message, status: '警告' }))

    /**
     * #### エラーレベルのアクセスログ出力メソッド
     * @param message 出力メッセージ
     */
    const logAccessError = (message: string) => log.error(_createAccessLogMessage({ message: message, status: 'エラー' }))

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
        status: string
        url: string
        ip: string
        user: string
    }>

    /**
     * #### Httpログメッセージの生成
     * @param params Type定義のTips参照
     * @returns 整形したメッセージ
     */
    const _createHttpLogMessage = (params: HttpLogMessageParam) =>
        'type: HTTP' +
        `${params.url ? `, url: ${params.url}` : ''}` +
        `${params.status ? `, status: ${params.status}, ` : ''}` +
        `${params.ip ? `, ip: ${params.ip}, ` : ''}` +
        `${params.user ? `, user: ${params.user}, ` : ''}` +
        `${params.message ? `, message: ${params.message}` : ''}`

    /**
     * #### 正常なHttpログ出力メソッド
     * @param params Type定義のTips参照
     */
    const logHttpInfo = (params: HttpLogMessageParam) => log.info(_createHttpLogMessage({ ...params, status: params.status ?? '情報' }))

    /**
     * #### 警告レベルのHttpログ出力メソッド
     * @param params Type定義のTips参照
     */
    const logHttpWarning = (params: HttpLogMessageParam) => log.warn(_createHttpLogMessage({ ...params, status: params.status ?? '警告' }))

    /**
     * #### エラーレベルのHttpログ出力メソッド
     * @param params Type定義のTips参照
     */
    const logHttpError = (params: HttpLogMessageParam) => log.Error(_createHttpLogMessage({ ...params, status: params.status ?? 'エラー' }))

    /**
     * #### SystemLogMessageの引数タイプ
     * @property message: メッセージ（任意）
     * @property status: 情報、警告、エラーなどの状態（任意）
     * @property place: 発生場所（任意）
     */
    type SystemLogMessageParam = Partial<{
        message: string
        status: string
        place: string
    }>

    /**
     * #### Systemログメッセージの生成
     * @param params Type定義のTips参照
     * @returns 整形したメッセージ
     */
    const _createSystemLogMessage = (params: SystemLogMessageParam) =>
        `type: SYSTEM${params.status ? `, status: ${params.status}` : ''}${params.place ? `, place: ${params.place}` : ''}${params.message ? `, message: ${params.message}` : ''}`

    /**
     * #### 正常なSystemログ出力メソッド
     * @param params Type定義のTips参照
     */
    const logSystemInfo = (params: SystemLogMessageParam) => log.info(_createSystemLogMessage({ ...params, status: params.status ?? '情報' }))

    /**
     * #### 警告レベルのSystenログ出力メソッド
     * @param params Type定義のTips参照
     */
    const logSystemWarning = (params: SystemLogMessageParam) => log.warn(_createSystemLogMessage({ ...params, status: params.status ?? '警告' }))

    /**
     * #### エラーレベルのSystenログ出力メソッド
     * @param params Type定義のTips参照
     * @param e Errorオブジェクト（任意）
     */
    const logSystemError = (params: SystemLogMessageParam, e?: Error) => log.error(_createSystemLogMessage({ ...params, status: params.status ?? 'エラー' }) + `${e ? `, \nerror: ${e}` : ''}`)

    /**
     * #### PerformanceLogMessageの引数タイプ
     * @property place: コード上の計測地点を表す文字列（任意）
     * @property anchor: 任意の地点のperformance.now値（任意）
     * @property status: 情報、警告、エラーなどの状態（任意）
     */
    type PerformanceLogMessageParam = Partial<{
        place: string
        anchor: number
        status: string
    }>

    /**
     * #### anchorから現在地点間のmSec値を文字列取得
     * @param anchor - 任意の地点のperformance.now値
     */
    const _getElapsedTimeString = (anchor: number) => `${(performance.now() - anchor).toPrecision(4)} mSec`

    /**
     * #### Performanceログメッセージの生成と必要ならコンソール出力
     * @param params Type定義のTips参照
     * @returns 整形したメッセージ
     */
    const _createPerformanceLogMessage = (params: PerformanceLogMessageParam) =>
        `type: PERF${params.place ? `, place: ${params.place}` : ''}${params.status ? `, status: ${params.status}, ` : ''}, time: ${_getElapsedTimeString(params.anchor ?? _anchor)}`

    /**
     * #### performanceログ出力メソッド
     * - anchorから現在地点間のmSec値をperformanceログに出力
     * @param params Type定義のTips参照
     */
    const logPerformance = (params: PerformanceLogMessageParam): void => log.info(_createPerformanceLogMessage({ ...params, status: params.status ?? '情報' }))

    /**
     * #### アンカーポイントを生成
     * @returns アンカーポイント
     */
    const anchor = (): number => {
        _anchor = performance.now()
        return _anchor
    }

    /**
     * createLogger関数の引数型
     *
     * @property enable関数
     * @property disable関数
     * @property logAccessInfo関数
     * @property logAccessWarning関数
     * @property logAccessError関数
     * @property logHttpInfo関数
     * @property logHttpWarning関数
     * @property logHttpError関数
     * @property logSystemInfo関数
     * @property logSystemWarning関数
     * @property logSystemError関数
     * @property logPerformance関数
     * @property anchor: anchor関数
     */
    type createLoggerResponse = {
        enable: typeof enable
        disable: typeof disable
        logAccessInfo: typeof logAccessInfo
        logAccessWarning: typeof logAccessWarning
        logAccessError: typeof logAccessError
        logHttpInfo: typeof logHttpInfo
        logHttpWarning: typeof logHttpWarning
        logHttpError: typeof logHttpError
        logSystemInfo: typeof logSystemInfo
        logSystemWarning: typeof logSystemWarning
        logSystemError: typeof logSystemError
        logPerformance: typeof logPerformance
        anchor: typeof anchor
    }

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
    } as createLoggerResponse
}
