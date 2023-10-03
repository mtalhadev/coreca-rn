import isArray from 'lodash/isArray'
import { FieldValueType } from '../../services/firebase/FirestoreService'
import { CustomDate, toCustomDateFromTotalSeconds } from './CustomDate'
import { TotalSeconds } from './TotalSeconds'

/**
 * 共通型
 */
export type CommonModel = {
    createdAt?: TotalSeconds
    updatedAt?: TotalSeconds
    lockedAt?: TotalSeconds
    isValid?: boolean
}

export type CommonType = CommonModel

export type CommonCLType = {
    createdAt?: CustomDate
    updatedAt?: CustomDate
    lockedAt?: CustomDate
    isValid?: boolean
}

export const toCommonCLType = (data?: CommonType): CommonCLType => {
    return {
        ...data,
        createdAt: data?.createdAt ? toCustomDateFromTotalSeconds(data?.createdAt, true) : undefined,
        updatedAt: data?.updatedAt ? toCustomDateFromTotalSeconds(data?.updatedAt, true) : undefined,
        lockedAt: data?.lockedAt ? toCustomDateFromTotalSeconds(data?.lockedAt, true) : undefined,
    }
}

/**
 * Firebaseのupdateをするための型
 */
export type Update<T> = { [P in keyof T]?: T[P] | FieldValueType | undefined | null }
/**
 * Firebaseでcreateするための型
 */
export type Create<T> = { [P in keyof T]?: T[P] | undefined | null }

export type CommonListType<T> = {
    _arrayType?: Required<T>
}

/**
 * AllとPartの共通要素をPartで置き換え（通常のIntersection type（=&）では型が置き換えではなく、&結合になるため）
 */
export type ReplaceAnd<All, Part> = Pick<All, Exclude<keyof All, keyof Part>> & Part

export const filterIndexArray = <T = any>(array: T[], indexes: number[]): T[] => {
    if (!isArray(array) || !isArray(indexes)) {
        return []
    }
    return indexes?.map((index) => (typeof index == 'number' ? array[index] : undefined)).filter((data) => data != undefined) as T[]
}
