import ENV from '../../../env/env'
import { ACTION_CODE_SETTINGS } from '../../utils/Constants'
import { getExpoHostUrl } from '../../utils/Utils'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../../services/_others/ErrorService'

export type GetInviteWorkerUrlParam = {
    myCompanyId?: string
    workerId?: string
    workerName?: string
    workerNickname?: string
    metroPort?: string
}

/**
 *
 * @param params
 * @returns
 */
export const getInviteUrl = async (params: GetInviteWorkerUrlParam): Promise<CustomResponse<string | undefined>> => {
    try {
        const { myCompanyId, workerId, workerName, workerNickname, metroPort } = params
        if (myCompanyId == undefined) {
            throw {
                error: '自社情報がありません。ログインし直してください。',
            } as CustomResponse
        }

        if (workerId == undefined || workerName == undefined) {
            throw {
                error: '作業員情報がありません。',
            } as CustomResponse
        }

        if (__DEV__) {
            let shortLink: string = await getExpoHostUrl(metroPort)
            shortLink += `/--/inviteWorker/?companyId=${myCompanyId}&workerId=${workerId}&workerName=${encodeURIComponent(workerName) ?? ''}&workerNickname=${
                workerNickname ? encodeURIComponent(workerNickname) ?? '' : ''
            }`

            return Promise.resolve({
                success: shortLink,
            })
        } else {
            const endPoint = `https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=${ENV.PROD_FIREBASE_CONFIG.apiKey}`
            let longDynamicLink = `https://${ACTION_CODE_SETTINGS.dynamicLinkDomain}/`
            longDynamicLink += `?link=https://${ENV.PROD_FIREBASE_CONFIG.dynamicLinksDomain}/inviteWorker%2F%3FcompanyId%3D${myCompanyId}%26workerId%3D${workerId}%26workerName%3D${
                encodeURIComponent(workerName) ?? ''
            }%26workerNickname%3D${workerNickname ? encodeURIComponent(workerNickname) ?? '' : ''}`
            longDynamicLink += `&apn=${ACTION_CODE_SETTINGS.android.packageName}`
            longDynamicLink += `&ibi=${ACTION_CODE_SETTINGS.iOS.bundleId}`

            const json = {
                longDynamicLink: longDynamicLink,
            }

            try {
                const response = await fetch(endPoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(json),
                })

                const responseJson = await response.json()

                return Promise.resolve({
                    success: responseJson.shortLink as string | undefined,
                })
            } catch (error: any) {
                throw {
                    error: error.message,
                } as CustomResponse
            }
        }
    } catch (error: any) {
        return getErrorMessage(error)
    }
}
