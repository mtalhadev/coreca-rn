import { getErrorMessage } from '../services/_others/ErrorService'
import { CustomResponse } from '../models/_others/CustomResponse'
import { getAsyncKVS } from '../services/asyncKVS/AsyncKVSService'

/**
 * @summary メッセージ定数
 * @purpose 本Case内でのみ使用
 * @property first - 初回キャッシュ時に待機を推奨するメッセージ
 * @property full - 保存失敗時にストレージ空き容量確認を促すメッセージ
 * @author Okuda
 */
const messages = {
    first: '初回更新中',
    full: 'キャッシュデータの保存に失敗しました、ストレージの空き容量を確認してみてください。',
} as const

/**
 * @summary genKeyName関数の引数型
 * @requires - 全て
 * @property screenName - Screenのファイル名
 * @property paramName - "Screen名@key1=value1&key2=value2"形式のキー名を生成する際のkey1,2...名（値はvalue1,2...値）
 * @author Okuda
 */
type genKeyNameParam = {
    screenName: string
    [paramName: string]: string
}

/**
 * @summary KVSのkey名を生成（"Screen名@key1=value1&key2=value2"形式）
 * @param param {@link genKeyNameParam}
 * @returns key名
 * @errors なし
 * @throws なし
 * @author Okuda
 */
export const genKeyName = (param: genKeyNameParam) => {
    const keys = Object.keys(param)
    const l = keys.length
    let keyName = `${param.screenName}Screen@`,
        n = 1
    keys.forEach((key) => {
        if ('screenName' != key) {
            keyName += `${key}=${param[key]}`
            if (l > n) keyName += '&'
        }
        n++
    })
    return keyName
}

/**
 * @summary KVSにキャッシュされたデータを取得
 * @purpose DBから取得したデータをアプリ側でKVSへキャッシュする目的で利用されることを想定（これにより次回表示速度を改善）
 * @remark キャッシュされたデータがオブジェクトの場合、それらのメソッドは破棄されているので要注意
 * @param key "Screen名@key1=値1&key2=値2"形式のキー値（これは一例でありkey値のフォーマットは自由）
 * @returns 成功時 -  {success: KVSのvalue値, error: undefined} - {@link CustomResponse}
 * @errors 失敗時 - {success: undefined, error: エラーメッセージ(errorCode: FIRST_FETCH)} - {@link CustomResponse}
 * @throws なし
 * @author Okuda
 */
export const getCachedData = async <T>(key: string): Promise<CustomResponse<T>> => {
    try {
        const result = await getAsyncKVS().getItemObj(key)
        if (result.error) throw { error: messages.first, errorCode: 'FIRST_FETCH' }
        return Promise.resolve({ success: result.success as T })
    } catch (error) {
        return getErrorMessage(error)
    }
}

/**
 * @summary updateCachedConstructionList関数の引数型
 * @requires - 全て
 * @property key - "Screen名@key1=値1&key2=値2"形式のキー文字列（これは一例でありkey値のフォーマットは自由）
 * @property value - KVSのvalue値
 * @author Okuda
 */
type updateCachedDataParam<T> = {
    key: string
    value: T
}

/**
 * @summary データをKVSへキャッシュ保存（同一keyは上書き）
 * @purpose DBから取得したデータをアプリ側でKVSへキャッシュする目的で利用されることを想定（これにより次回表示速度を改善）
 * @remark キャッシュするデータがオブジェクトの場合、それらのメソッドは破棄される
 * @param params {@link updateCachedDataParam}
 * @returns 成功時 -  {success: true, error: undefined} - {@link CustomResponse}
 * @errors 失敗時 - {success: undefined, error: エラーメッセージ} - {@link CustomResponse}
 * @throws なし
 * @author Okuda
 */
export const updateCachedData = async <T>(params: updateCachedDataParam<T>): Promise<CustomResponse<boolean>> => {
    try {
        const result = await getAsyncKVS().setItemObj({ key: params.key, value: params.value })
        if (result.error) {
            const resetCacheResult = await resetAllCachedData()
            if (resetCacheResult.error) {
                throw { error: messages.full }
            }
        }

        return Promise.resolve({ success: true })
    } catch (error) {
        return getErrorMessage(error)
    }
}

/**
 * @summary キャッシュを全て削除
 * @purpose データが壊れた場合に使用。
 * @param params
 * @returns 成功時 -  {success: true, error: undefined} - {@link CustomResponse}
 * @errors 失敗時 - {success: undefined, error: エラーメッセージ} - {@link CustomResponse}
 * @throws なし
 * @author Hiruma
 */
export const resetAllCachedData = async (): Promise<CustomResponse<boolean>> => {
    try {
        const asyncKVS = getAsyncKVS()
        const keysResult = await asyncKVS.getAllKeys()
        if (keysResult.error) {
            throw {
                error: keysResult.error,
                errorCode: 'GET_KEY_ERROR',
            }
        }
        const results = await Promise.all(keysResult.success?.map((key) => asyncKVS.removeItem(key)) ?? [])
        results.forEach((result) => {
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: 'REMOVE_CACHE_ERROR',
                }
            }
        })
        return Promise.resolve({ success: true })
    } catch (error) {
        return getErrorMessage(error)
    }
}

/**
 * @summary 特定スクリーンのキャッシュを削除
 * @purpose 該当スクリーンのキャッシュが全て更新必要になった際に利用。
 * @param params 前方一致のkey。月別スクリーンであれば、date以外の部分で作成したキー
 * @returns 成功時 -  {success: true, error: undefined} - {@link CustomResponse}
 * @errors 失敗時 - {success: undefined, error: エラーメッセージ} - {@link CustomResponse}
 * @throws なし
 * @author Kamiya
 */
export const resetTargetCachedData = async (key: string): Promise<CustomResponse<boolean>> => {
    try {
        const asyncKVS = getAsyncKVS()
        const keysResult = await asyncKVS.getAllKeys()
        if (keysResult.error) {
            throw {
                error: keysResult.error,
                errorCode: 'GET_KEY_ERROR',
            }
        }
        /**
         * 引数のキーと前方一致検索で、削除するキーを絞り込む。
         */
        const deleteKey = keysResult.success?.filter((_key) => !_key.indexOf(key))
        const results = await Promise.all(deleteKey?.map((key) => asyncKVS.removeItem(key)) ?? [])
        results.forEach((result) => {
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: 'REMOVE_CACHE_ERROR',
                }
            }
        })
        return Promise.resolve({ success: true })
    } catch (error) {
        return getErrorMessage(error)
    }
}
