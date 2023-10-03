import { writeAsStringAsync, readAsStringAsync, deleteAsync, readDirectoryAsync, documentDirectory } from 'expo-file-system'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { _restoreClassData, inflate, deflate } from './AsyncKVSUtilService'

/**
 * @summary AsyncKVS（端末ローカルのkey/valueストア）をカプセル化したクロージャ関数（状態レス）
 * @purpose AsyncStorageに6MBの制限があり、かつ、この制限をconfig pluginで回避してもExpoGoでは稼働しないため、やむなくAsyncStorageの代替えとして実装
 * - AsyncKVSは保存期間の制限なし、サイズの制限なし、Expo Go環境でも稼働可、この3つを必須要件として実装
 * - syncには非対応
 * @remark キャッシュされたデータがオブジェクトの場合、それらのメソッドは破棄されているので要注意
 * @params なし
 * @returns 公開メソッド（API）の集約オブジェクト {@link GetAsyncKVSResponse}
 * @errors なし
 * @throws なし
 * @author Okuda
 */
export const getAsyncKVS = () => {
    /**
     * ドキュメントディレクトリ定数
     */
    const DOC_DIR = `${documentDirectory}`

    /**
     * @summary 例外のメッセージを取得（簡易版）
     * @purpose エラーメッセージを生成するためにクロージャ内部でのみ使用するヘルバー関数
     * @param e catchで捕捉した例外値
     * @returns 引数がError派生Objectだった場合は e.message、Object型だった場合は e.toString()、それ以外では引数値をそのまま返す
     * @errors なし
     * @throws なし
     */
    const _getErrorMessage = (e: unknown): string | unknown => (e instanceof Error ? e.message : e instanceof Object ? e.toString() : e)

    /**
     * @summary setItem関数の引数型
     * @requires - 全て
     * @property key - KVSのキー値
     * @property value - KVSのvalue値（string型）
     */
    type SetItemParam = {
        key: string
        value: string
    }

    /**
     * @summary KVSにkey/valueセットを保存（valueはstring型）
     * @remark キャッシュするデータがオブジェクトの場合、それらのメソッドは破棄される
     * @purpose 公開メソッド（AsyncKVSの低レベルAPI）
     * @param params {@link SetItemParam}
     * @returns 成功時 -  {success: true, error: undefined} - {@link CustomResponse}
     * @errors 失敗時 - {success: undefined, error: エラーメッセージ} - {@link CustomResponse}
     * @throws なし
     */
    const setItem = async (params: SetItemParam): Promise<CustomResponse<boolean>> => {
        try {
            await writeAsStringAsync(`${DOC_DIR}${params.key}`, params.value)
            return Promise.resolve({ success: true })
        } catch (e) {
            return Promise.resolve({ error: `${_getErrorMessage(e)}` } as CustomResponse<boolean>)
        }
    }

    /**
     * @summary setItemObj関数の引数型
     * @requires 全て
     * @property key - KVSのキー値
     * @property value - KVSのvalue値（Object型）
     */
    type SetItemObjParam = {
        key: string
        // value: Object
        value: unknown
    }

    /**
     * @summary KVSにkey/valueセットを保存（valueはオブジェクト型）
     * @purpose 公開メソッド（AsyncKVSの低レベルAPI）
     * @param params {@link SetItemObjParam}
     * @returns 成功時：{success: true, error: undefined}、失敗時：{success: undefined, error: エラーメッセージ}
     * @errors
     * @throws なし
     */
    const setItemObj = async (params: SetItemObjParam): Promise<CustomResponse<boolean>> => {
        try {
            const deflateResult = await deflate(JSON.stringify(params.value))
            if (deflateResult.error) {
                throw {
                    error: deflateResult.error,
                }
            }
            const base64String = deflateResult.success as string

            await writeAsStringAsync(`${DOC_DIR}${params.key}`, base64String)
            return Promise.resolve({ success: true })
        } catch (e) {
            return Promise.resolve({ error: `${_getErrorMessage(e)}` } as CustomResponse<boolean>)
        }
    }

    /**
     * @summary KVSからvalue値を取得（valueはstring型）
     * @purpose 公開メソッド（AsyncKVSの低レベルAPI）
     * @param key キー値
     * @returns 指定したkeyのvalue値（params.wantsCustomResponseがfalseの場合）
     * @errors
     * @throws なし
     */
    const getItem = async (key: string): Promise<CustomResponse<string>> => {
        try {
            const value = await readAsStringAsync(`${DOC_DIR}${key}`)
            return Promise.resolve({ success: value })
        } catch (e) {
            return Promise.resolve({ error: `${_getErrorMessage(e)}` } as CustomResponse<string>)
        }
    }

    /**
     * @summary KVSからvalue値を取得（valueはObject型）
     * @purpose 公開メソッド（AsyncKVSの低レベルAPI）
     * @param key キー値
     * @returns 成功時：{success: 指定したkeyのvalue obj, error: undefined}、失敗時：{success: undefined, error: エラーメッセージ}
     * @errors
     * @throws なし
     */
    // const getItemObj = async (key: string): Promise<CustomResponse<Object>> => {
    const getItemObj = async <T extends Record<string, unknown>>(key: string): Promise<CustomResponse<T>> => {
        try {
            const base64String = await readAsStringAsync(`${DOC_DIR}${key}`)
            const inflateResult = await inflate(base64String)
            if (inflateResult.error) {
                throw {
                    error: inflateResult.error,
                }
            }
            const json = inflateResult.success as T

            return Promise.resolve({ success: json })
        } catch (e) {
            return Promise.resolve({ error: `${_getErrorMessage(e)}` })
        }
    }

    /**
     * @summary KVSからkey/valueセットを削除
     * @purpose 公開メソッド（AsyncKVSの低レベルAPI）
     * @param key キー値
     * @returns 成功時：{success: true, error: undefined}、失敗時：{success: undefined, error: エラーメッセージ}
     * @errors
     * @throws なし
     */
    const removeItem = async (key: string): Promise<CustomResponse<boolean>> => {
        try {
            await deleteAsync(`${DOC_DIR}${key}`, { idempotent: true })
            return Promise.resolve({ success: true })
        } catch (e) {
            return Promise.resolve({ error: `${_getErrorMessage(e)}` } as CustomResponse<boolean>)
        }
    }

    /**
     * @summary KVSから全てのkeys配列を取得
     * @purpose 公開メソッド（AsyncKVSの低レベルAPI）
     * @returns 成功時：{success: key値配列, error: undefined}、失敗時：{success: undefined, error: エラーメッセージ}
     * @errors
     * @throws なし
     */
    const getAllKeys = async (): Promise<CustomResponse<string[]>> => {
        try {
            const keys = await readDirectoryAsync(`${DOC_DIR}`)
            return Promise.resolve({ success: keys })
        } catch (e) {
            return Promise.resolve({ error: `${_getErrorMessage(e)}` } as CustomResponse<string[]>)
        }
    }

    /**
     * @summary getAsyncKVS関数の返り値型
     * @purpose 公開メソッド群（AsyncKVSの低レベルAPI）を1つのオブジェクトに集約化
     * @requires 全て
     * @property getItem関数
     * @property getItemObj関数
     * @property setItem関数
     * @property setItemObj関数
     * @property removeItem関数
     * @property getAllKeys関数
     */
    type GetAsyncKVSResponse = {
        getItem: typeof getItem
        getItemObj: typeof getItemObj
        setItem: typeof setItem
        setItemObj: typeof setItemObj
        removeItem: typeof removeItem
        getAllKeys: typeof getAllKeys
    }

    return {
        getItem: getItem,
        getItemObj: getItemObj,
        setItem: setItem,
        setItemObj: setItemObj,
        removeItem: removeItem,
        getAllKeys: getAllKeys,
    } as GetAsyncKVSResponse
}
