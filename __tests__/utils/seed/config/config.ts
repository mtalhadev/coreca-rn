import { config as dotEnvConfig } from 'dotenv'

// process.envの初期化
dotEnvConfig()

/**
 * #### SeedVerbType型 - seed実行時の動詞
 * - from: import
 * - to: export
 */
export type SeedVerbType = 'from' | 'to'

/**
 * #### seedVerbType型 - batchUpdate実行時の動詞（実際は名詞）
 * - projectperiod: 案件の工期変更
 * - workerleft: 作業員の退会日変更
 */
export type BatchUpdateVerbType = 'projectperiod' | 'workerleft'

/**
 * #### 環境変数オブジェクト
 * - tsc不要で.env環境変数をタイプセーフ化
 *
 * @key LOG_PERFORMANCE - ログ出力の有無
 * @key LOG_WITH_CONSOLE - ログ出力をコンソールにも行うか否か
 * @key PROJECT_ID - ローカルEmulator環境では demo- プリフィックス必須
 * @key HOST - ローカルEmulator環境のホスト（原則、localhost）
 * @key PORT - ローカルEmulator環境のポート
 * @key PROTOCOL - httpないしhttps（ローカルEmulator環境ではhttp）
 * @key LOG4JS_JSON_PATH - log4jsの設定ファイルパス
 * @key SEPARATOR - seed to コマンドの第3パラメータでコレクション名を列挙する際の区切り文字
 * @key DATE_FIELD_NAMES - Date型（Timestamp型）のエンティティフィールド名配列
 * @key SEED_DEFAULT_VERB - to ないし from
 * @key SEED_DEFAULT_PATH -seedの規定のJSONファイルパス
 * @key SEED_DEFAULT_ENTITIES - seed to コマンドで第3パラメータを指定しなかった場合の規定のエンティティ（未指定は全部）
 * @key BATCHUPDATE_DEFAULT_VERB - projectperiod ないし workerleft
 * @key BATCHUPDATE_DEFAULT_PATH=./data.json # batchupdateの対象となるJSONファイルパスの規定値
 * @key BATCHUPDATE_DEFAULT_START_MONTHS= # batchupdate projectperiod コマンドの工期開始日の規定値（現在日からの月数で指定）
 * @key BATCHUPDATE_DEFAULT_END_MONTHS= # batchupdate projectperiod コマンドの工期終了日の規定値（現在日からの月数で指定）
 * @key BATCHUPDATE_DEFAULT_LEFT_MONTHS= # batchupdate workerleft コマンドの退会日の規定値（現在日からの月数で指定）
 */
export const config = {
    LOG_PERFORMANCE: 'true' === process.env.LOG_PERFORMANCE ? true : false,
    LOG_WITH_CONSOLE: 'true' === process.env.LOG_WITH_CONSOLE ? true : false,
    PROJECT_ID: process.env.PROJECT_ID as string,
    HOST: process.env.HOST as string,
    PORT: Number(process.env.PORT),
    PROTOCOL: 'https' === process.env.PROTOCOL ? true : false,
    LOG4JS_JSON_PATH: process.env.LOG4JS_JSON_PATH as string,
    SEPARATOR: process.env.SEPARATOR as string,
    DATE_FIELD_NAMES: (process.env.DATE_FIELD_NAMES as string).split(':'),
    SEED_DEFAULT_VERB: process.env.SEED_DEFAULT_VERB as SeedVerbType,
    SEED_DEFAULT_PATH: process.env.SEED_DEFAULT_PATH as string,
    SEED_DEFAULT_ENTITIES: process.env.SEED_DEFAULT_ENTITIES as string,
    BATCHUPDATE_DEFAULT_VERB: process.env.BATCHUPDATE_DEFAULT_VERB as BatchUpdateVerbType,
    BATCHUPDATE_DEFAULT_PATH: process.env.BATCHUPDATE_DEFAULT_PATH as string,
    BATCHUPDATE_DEFAULT_START_MONTHS: parseInt(process.env.BATCHUPDATE_DEFAULT_START_MONTHS as string),
    BATCHUPDATE_DEFAULT_END_MONTHS: parseInt(process.env.BATCHUPDATE_DEFAULT_END_MONTHS as string),
    BATCHUPDATE_DEFAULT_LEFT_MONTHS: parseInt(process.env.BATCHUPDATE_DEFAULT_LEFT_MONTHS as string),
} as const
