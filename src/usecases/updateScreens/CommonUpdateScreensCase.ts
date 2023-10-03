import { splitIdAndDates, UpdateScreenType } from '../../models/updateScreens/UpdateScreens'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { YYYYMMDDTotalSecondsParam, YYYYMMTotalSecondsParam } from '../../models/_others/TotalSeconds'
import { _getUpdateScreens, _getUpdateScreensOfTargetAccount, _updateUpdateScreens } from '../../services/updateScreens/UpdateScreens'
import { getErrorMessage } from '../../services/_others/ErrorService'
import { ID } from '../../models/_others/ID'
import { ScreenNameType } from '../../screens/Router'
/**
 * @requires
 * - accountId - 使用者のアカウントId
 */
export type GetUpdateScreensParam = {
    accountId?: string
    screenName?: ScreenNameType
}

export type GetUpdateScreensResponse = UpdateScreenType | undefined
/**
 * @remarks 指定のアカウントの更新すべきスクリーンを取得する
 * @objective 整合性を担保するため
 * @error
 * - ACCOUNT_ERROR - アカウントIdがなかった場合
 * @author  Kamiya
 * @param params - {@link GetUpdateScreensParam}
 * @returns - {@link GetUpdateScreensResponse}
 */
export const getUpdateScreenOfTargetAccountAndScreen = async (params: GetUpdateScreensParam): Promise<CustomResponse<GetUpdateScreensResponse>> => {
    try {
        const { accountId, screenName } = params
        if (accountId == undefined) {
            throw {
                error: '自社情報がありません。ログインし直してください。',
                errorCode: 'ACCOUNT_ERROR',
            } as CustomResponse
        }

        const updateScreensResult = await _getUpdateScreensOfTargetAccount({ accountId: accountId ?? 'no-id' })

        if (updateScreensResult.error) {
            throw {
                error: updateScreensResult.error,
                errorCode: 'UPDATESCREEN_ERROR',
            }
        }

        //同一名のscreenNameを含むscreensは存在しない想定
        const updateScreen = updateScreensResult.success?.screens?.filter((screen) => screen.screenName == screenName)[0]

        return Promise.resolve({
            success: updateScreen,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
export type deleteScreenOfUpdateScreensParam = {
    accountId?: string
    screenName?: string
}
/**
 * @remarks DBフェッチ後に、updateScreensから対象のScreenを削除する。
 * @objective 次回以降DBフェッチしないように
 * @author  Kamiya
 * @param params - {@link deleteScreenOfUpdateScreensParam}
 * @returns - void
 */
export const deleteScreenOfUpdateScreens = async (params: deleteScreenOfUpdateScreensParam): Promise<CustomResponse<boolean>> => {
    try {
        const { accountId, screenName } = params
        const updateScreensResult = await _getUpdateScreensOfTargetAccount({ accountId: accountId ?? 'no-id' })
        if (updateScreensResult.error) {
            throw {
                error: updateScreensResult.error,
            }
        }
        const screens = updateScreensResult.success?.screens?.filter((screen) => screen.screenName != screenName)
        const newUpdateScreens = {
            ...updateScreensResult.success,
            screens,
        }
        const result = await _updateUpdateScreens(newUpdateScreens)
        return Promise.resolve({
            success: !!result,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
/**
 * @requires
 * - accountId - 使用者のアカウントId
 * - screenName - DBフェッチしたscreenName
 * - paramName - dates又はidsまたはidAndDates
 * @partial
 * - id - idsまたはidAndDateのid
 * - startDate - paramNameがdatesまたはidAndDatesの場合の、削除したい期間の開始日
 * - endDate - paramNameがdatesまたはidAndDatesの場合の、削除したい期間の終了日
 */
export type deleteParamOfUpdateScreensParam = {
    accountId?: string
    screenName?: string
    id?: string
    ids?: string[]
    startDate?: YYYYMMDDTotalSecondsParam | YYYYMMTotalSecondsParam
    endDate?: number
    paramName: keyof Omit<UpdateScreenType, 'screenName' | 'isAll'>
}
/**
 * @remarks DBフェッチ後に、updateScreensから対象のScreenかつ月又は日付を削除する。
 * @objective 次回以降DBフェッチしないように
 * @error
 * - ACCOUNT_ERROR - アカウントIdがなかった場合
 * @author  Kamiya
 * @param params - {@link deleteParamOfUpdateScreensParam}
 * @returns - void
 */
export const deleteParamOfUpdateScreens = async (params: deleteParamOfUpdateScreensParam): Promise<CustomResponse<boolean>> => {
    try {
        const { accountId, screenName, id, ids, startDate, endDate, paramName } = params
        if (accountId == undefined) {
            throw {
                error: '自社情報がありません。ログインし直してください。',
                errorCode: 'ACCOUNT_ERROR',
            } as CustomResponse
        }
        const updateScreensResult = await _getUpdateScreensOfTargetAccount({ accountId: accountId ?? 'no-id' })
        if (updateScreensResult.error) {
            throw {
                error: updateScreensResult.error,
            }
        }
        const targetScreen = updateScreensResult.success?.screens?.filter((screen) => screen.screenName == screenName)[0]
        if (targetScreen) {
            if (paramName == 'dates' && startDate && endDate) {
                const newParam = targetScreen[paramName]?.filter((data) => data < startDate || data > endDate)
                targetScreen[paramName] = newParam
            }
            if (paramName == 'ids' && id) {
                const newParam = targetScreen[paramName]?.filter((data) => data != id)
                targetScreen[paramName] = newParam
            }
            if (paramName == 'ids' && ids) {
                const newParam = targetScreen[paramName]?.filter((data) => !ids.includes(data))
                targetScreen[paramName] = newParam
            }
            if (paramName == 'idAndDates' && startDate && endDate) {
                const idAndDateObjArr = splitIdAndDates(targetScreen.idAndDates)
                const newIdAndDateObjArr = idAndDateObjArr.filter((obj) => id != obj.id || obj.date < startDate || obj.date > endDate)
                const newParam = newIdAndDateObjArr.map((obj) => 'id=' + obj.id + 'dates=' + obj.date.toString())
                targetScreen[paramName] = newParam
            }
            if (targetScreen.isAll) {
                targetScreen.isAll = false
            }
            let screens: UpdateScreenType[] = []
            const paramLength = targetScreen[paramName]?.length ?? 0
            if (paramLength > 0) {
                screens = [...(updateScreensResult.success?.screens?.filter((screen) => screen.screenName != screenName) ?? []), targetScreen]
            } else {
                screens = [...(updateScreensResult.success?.screens?.filter((screen) => screen.screenName != screenName) ?? [])]
            }
            const newUpdateScreens = {
                ...updateScreensResult.success, //今の状態
                screens, //screenNameが一致したものを除外したもの（screensだけを更新）
            }
            const result = await _updateUpdateScreens(newUpdateScreens)
            return Promise.resolve({
                success: !!result,
            })
        } else {
            return Promise.resolve({
                success: false,
            })
        }
    } catch (error) {
        return getErrorMessage(error)
    }
}

type CheckUpdateOfTargetIdParams = {
    targetId?: ID
    targetIds?: ID[]
    accountId?: ID
    targetScreenName?: ScreenNameType
    localUpdateScreens?: UpdateScreenType[]
}

/**
 * 作成編集削除により、キャッシュと表示内容が異なる場合にDBフェッチする必要があるかを判別する
 * @param params
 * @returns DBフェッチの必要があればtrueなければfalse
 */
export const checkUpdateOfTargetScreen = async (params: CheckUpdateOfTargetIdParams): Promise<CustomResponse> => {
    try {
        const { targetId, targetIds, accountId, targetScreenName, localUpdateScreens } = params

        if (targetId && localUpdateScreens?.some((screen) => screen.screenName == targetScreenName && screen.ids?.includes(targetId))) {
            /**
             * 作成編集者本人はUpdateScreensが更新される前に遷移するため、Storeで対応
             */
            return Promise.resolve({
                success: true,
            })
        } else if (targetIds && localUpdateScreens?.some((screen) => screen.screenName == targetScreenName && screen.ids?.some((id) => targetIds.includes(id)))) {
            return Promise.resolve({
                success: true,
            })
        } else {
            const updateResult = await getUpdateScreenOfTargetAccountAndScreen({
                accountId: accountId,
                screenName: targetScreenName,
            })
            const updateScreen = updateResult.success
            if (updateScreen?.screenName && (targetId == undefined || updateScreen.ids?.includes(targetId))) {
                return Promise.resolve({
                    success: true,
                })
            }
            return Promise.resolve({
                success: false,
            })
        }
    } catch (error) {
        return getErrorMessage(error)
    }
}
