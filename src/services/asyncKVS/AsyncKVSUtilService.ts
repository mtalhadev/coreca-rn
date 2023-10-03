import { Base64 } from 'js-base64'
import chain from 'lodash/chain'
const pako = require('pako')
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../_others/ErrorService'

/**
 *
 * @param params [{ key: string, value: unkown }, ..., ] => { key: value, ..., }
 * @returns
 */
const __keyValueListToObj = (params: ObjClass[]): ObjClass => {
    return chain(params).keyBy('key').mapValues('value').value() ?? {}
}

const __MAX_LOOP = 5
const __checkAndRestoreObject = (_obj: ObjClass, keysOfRestoreClass: string[], functionsObjsOfRestoreClass: ObjClass, index = 0): any => {
    /**
     * 無限ループを防ぐため。
     */
    if (index > __MAX_LOOP) {
        return _obj
    }

    /**
     * 配列の場合は要素ごとに処理。
     */
    if (Array.isArray(_obj)) {
        return _obj.map((element) => __checkAndRestoreObject(element, keysOfRestoreClass, functionsObjsOfRestoreClass, index))
    }

    const __isRestoreClass = (value: unknown): boolean => typeof value == 'object' && Object.getOwnPropertyNames(value).filter((subKey) => !keysOfRestoreClass.includes(subKey)).length == 0
    /**
     * RestoreClassに存在しないプロパティがない状態。つまり、valueがRestoreClassに内包されているかどうかを判定。内包されていれば、同じ型とする。
     */
    const objEntries = Object.entries(_obj)
    const restoreClassObjList = objEntries.filter(([key, value]) => typeof value == 'object' && __isRestoreClass(value)) as [string, ObjClass][]

    const notRestoreClassObjList = objEntries.filter(([key, value]) => typeof value == 'object' && !__isRestoreClass(value)) as [string, ObjClass][]

    /**
     * ループ構造。notRestoreClassObjListがなくなるまで。
     */
    const subUpdatePropertyObj = __keyValueListToObj(
        notRestoreClassObjList.map(([key, value]) => ({ key, value: { ...__checkAndRestoreObject(value, keysOfRestoreClass, functionsObjsOfRestoreClass, index + 1) } })),
    )

    const updatePropertyObj = __keyValueListToObj(restoreClassObjList.map(([key, value]) => ({ key, value: { ...functionsObjsOfRestoreClass, ...value } })))
    const restoredTargetObj = {
        ..._obj,
        ...subUpdatePropertyObj,
        ...updatePropertyObj,
    }

    return restoredTargetObj
}

type ObjClass = Record<string, unknown>
/**
 * @summary 保存したClassのインスタンスデータは関数が失われるので、その復元プロセス
 * @purpose 公開メソッド（AsyncKVS利用者向けAPI）
 * @param targetObj - 復元対象のデータ。Tで型定義
 * @param sampleInstance - 復元するClassのインスタンス。関数のみ移植する。RestoreClassで型定義
 * @returns 成功時：{success: 復元したデータ, error: undefined}、失敗時：{success: undefined, error: エラーメッセージ}
 * @errors
 * @throws なし
 * @author Hiruma
 */
export const _restoreClassData = <T extends ObjClass = ObjClass, RestoreClass = ObjClass>(targetObj: T, sampleInstance: RestoreClass): T => {
    /**
     * 対象オブジェクトにtargetObjをセット。
     * A）オブジェクトのすべてのプロパティをチェック。
     * そのうち、RestoreClassと一致するものを選択し、sampleInstanceの関数を移植する。
     * 一致せずかつObjectの場合は、A）に戻る
     */
    const keysOfRestoreClass = Object.getOwnPropertyNames(sampleInstance)
    /**
     * 復元クラスのうち、関数型をあつめたオブジェクト
     */
    const functionsObjsOfRestoreClass = __keyValueListToObj(
        Object.entries(sampleInstance as ObjClass)
            .filter(([key, value]) => typeof value == 'function')
            .map(([key, value]) => ({ key, value })),
    )
    const restoredTargetObj = __checkAndRestoreObject(targetObj, keysOfRestoreClass, functionsObjsOfRestoreClass) as T
    return restoredTargetObj
}

/**
 * @purpose データ圧縮: jsonをunit8arrayに変換、deflateしてbase64Stringに変換
 * @param value
 */
export const deflate = async (value: string): Promise<CustomResponse<string | null>> => {
    try {
        if (!value) {
            return Promise.resolve({ success: null })
        }

        const unit8Array = await pako.deflateRaw(value)
        const base64String = Base64.fromUint8Array(unit8Array)

        return Promise.resolve({ success: base64String })
    } catch (error) {
        return getErrorMessage(error)
    }
}

/**
 * @purpose データ展開: base64Stringをunit8arrayに変換、inflateしてjsonに変換
 * @param base64String
 */
export const inflate = async <T extends Record<string, unknown>>(base64String: string): Promise<CustomResponse<T | null>> => {
    try {
        if (!base64String) {
            return Promise.resolve({ success: null })
        }
        if (!base64regex.test(base64String)) {
            return Promise.resolve({ success: JSON.parse(base64String) })
        }

        const unit8Array = Base64.toUint8Array(base64String)
        const _json = await pako.inflateRaw(unit8Array, { to: 'string' })
        const json = JSON.parse(_json)

        return Promise.resolve({ success: json })
    } catch (error) {
        return getErrorMessage(error)
    }
}
const base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/

/**
 * @purpose  バイト数確認用
 * @param str
 */
export const getByteLength = (str: string) => {
    str = str == null ? '' : str
    return encodeURI(str).replace(/%../g, '*').length
}
