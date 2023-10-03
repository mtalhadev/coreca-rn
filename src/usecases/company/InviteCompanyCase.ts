import ENV from '../../../env/env'
import { ACTION_CODE_SETTINGS } from '../../utils/Constants'
import { getExpoHostUrl } from '../../utils/Utils'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../../services/_others/ErrorService'

export type GetInviteCompanyUrlParam = {
    myCompanyId?: string
    fakeCompanyId?: string
    metroPort?: string
}

export const getInviteUrl = async (params: GetInviteCompanyUrlParam): Promise<CustomResponse<string | undefined>> => {
    try {
        const { myCompanyId, fakeCompanyId, metroPort } = params
        if (myCompanyId == undefined) {
            throw {
                error: '自社情報がありません。ログインし直してください。',
            } as CustomResponse
        }

        if (__DEV__) {
            let shortLink: string = await getExpoHostUrl(metroPort)
            shortLink += `/--/inviteCompany/?companyId=${myCompanyId}`
            if (fakeCompanyId != undefined) {
                shortLink += `&fakeCompanyId=${fakeCompanyId}`
            }
            return Promise.resolve({
                success: shortLink,
            })
        } else {
            const endPoint = 'https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=' + ENV.PROD_FIREBASE_CONFIG.apiKey
            let longDynamicLink = `https://${ACTION_CODE_SETTINGS.dynamicLinkDomain}/`
            longDynamicLink += `?link=https://${ENV.PROD_FIREBASE_CONFIG.dynamicLinksDomain}/inviteCompany%2F%3FcompanyId%3D${myCompanyId}`
            //longDynamicLink += '?link=https://coreca.jp/inviteCompany/?companyId=' + myCompanyId
            if (fakeCompanyId != undefined) {
                longDynamicLink += `%26fakeCompanyId%3D${fakeCompanyId}`
            }
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

                //const shortLink = (responseJson.shortLink as string).replace('https', 'itms-beta')
                return Promise.resolve({
                    success: responseJson.shortLink as string | undefined,
                    //success: shortLink as string | undefined,
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
