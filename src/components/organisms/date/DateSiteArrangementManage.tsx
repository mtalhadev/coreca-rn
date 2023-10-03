/* eslint-disable prefer-const */
import React, { useMemo } from 'react'
import { ViewStyle } from 'react-native'

import { FontStyle } from '../../../utils/Styles'
import { THEME_COLORS, WINDOW_WIDTH } from '../../../utils/Constants'
import { getUuidv4 } from '../../../utils/Utils'
import { SiteHeader } from '../site/SiteHeader'
import { ShadowBox } from '../shadowBox/ShadowBox'
import { SiteType } from '../../../models/site/Site'
import { CustomResponse } from '../../../models/_others/CustomResponse'
import { SiteArrangementCompanyType, SiteArrangementWorkerType } from '../../../models/arrangement/SiteArrangementDataType'
import { useSelector } from 'react-redux'
import { StoreType } from '../../../stores/Store'
import { t } from 'i18next'
import { getErrorMessage } from '../../../services/_others/ErrorService'
import { _deleteInvRequestLocalInsideWorker } from '../../template/ArrangementManageUtils'
import ArrangedBox from '../arrangement/ArrangedBox'
import { InvRequestType } from '../../../models/invRequest/InvRequestType'
import { InvRequestHeader } from '../invRequest/InvRequestHeader'
import sum from 'lodash/sum'
import { onPressAtPostOtherContent, onPressAtPostSelfContent } from '../../../usecases/arrangement/SiteArrangementCase'
import { DateInvRequestArrangementType, DateSiteArrangementType } from '../../../screens/adminSide/date/DateArrangements'
// import DatePicker from 'react-native-date-picker'
export type DateArrangementProps = {
    site?: SiteType
    invRequest?: InvRequestType
    routeNameFrom?: string
    style?: ViewStyle
    siteArrangements?: DateSiteArrangementType[]
    invRequestArrangements?: DateInvRequestArrangementType[]
    dateSiteArrangement?: DateSiteArrangementType
    dateInvRequestArrangement?: DateInvRequestArrangementType
    onPress?: (data: DateInvRequestArrangementType | DateSiteArrangementType) => void
    onPressSelf?: (updateSiteArrangementsData: DateSiteArrangementType[], updateInvArrangementsData: DateSiteArrangementType[]) => void
    displayDetail?: (type: 'company' | 'worker', item: SiteArrangementWorkerType | SiteArrangementCompanyType) => void
    update?: number
    onUpdate?: () => void
}

export const DateSiteArrangementManage = React.memo((props: Partial<DateArrangementProps>) => {
    let { site, invRequest, routeNameFrom, style, siteArrangements, invRequestArrangements, dateSiteArrangement, dateInvRequestArrangement, displayDetail, onPress, onPressSelf, update, onUpdate } =
        props
    //シャローコピーにて変更するものは、dateSiteArrangementかdateInvRequestArrangement経由で取得。参照のみの場合は、直接siteまたはinvRequestで良い
    const listKey = useMemo(() => getUuidv4(), [])
    update = update ?? 0
    const myCompanyId = useSelector((state: StoreType) => state.account?.belongCompanyId)
    const activeDepartments = useSelector((state: StoreType) => state.account?.activeDepartments)
    const activeDepartmentIds = useMemo(() => activeDepartments?.map((dep) => dep?.departmentId).filter((data) => data != undefined) as string[], [activeDepartments])
    const presentCount = useMemo(
        () =>
            (dateInvRequestArrangement?.invRequest?.workerIds?.length ?? 0) +
            sum(dateInvRequestArrangement?.invRequest?.site?.companyRequests?.orderRequests?.items?.map((req) => req?.requestCount).filter((data) => data != undefined)),
        [dateInvRequestArrangement?.invRequest],
    )

    const _onPressAtPostSelfContent = async (item: SiteArrangementWorkerType): Promise<CustomResponse> => {
        try {
            if (myCompanyId == undefined) {
                throw {
                    error: t('common:Reload'),
                    errorCode: 'UPDATE_ARRANGEMENT_ERROR',
                }
            }
            const result = await onPressAtPostSelfContent({
                siteArrangementData: dateSiteArrangement?.siteArrangementData,
                invRequestArrangementData: dateInvRequestArrangement?.invRequestArrangementData,
                respondRequest: dateSiteArrangement?.request,
                invRequest: dateInvRequestArrangement?.invRequest,
                item,
                site: dateSiteArrangement?.site,
                myCompanyId,
                activeDepartmentIds,
                t,
                targetMeter: dateSiteArrangement?.targetMeter ?? dateInvRequestArrangement?.targetMeter,
                onSetData: (updateSiteArrangementsData: DateSiteArrangementType[], updateInvArrangementsData: DateSiteArrangementType[]) => {
                    if (onPressSelf) {
                        onPressSelf(updateSiteArrangementsData, updateInvArrangementsData)
                    }
                },
                siteArrangements,
                invRequestArrangements,
                localPresentNum: dateSiteArrangement?.localPresentNum ?? dateInvRequestArrangement?.localPresentNum,
            })
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: result.errorCode,
                }
            }
            return Promise.resolve({ success: true })
        } catch (error) {
            return getErrorMessage(error)
        }
    }

    const _onPressAtPostOtherContent = async (item: SiteArrangementCompanyType, arrangeCount: number): Promise<CustomResponse> => {
        try {
            if (myCompanyId == undefined) {
                throw {
                    error: t('common:Reload'),
                    errorCode: 'UPDATE_ARRANGEMENT_ERROR',
                }
            }
            const result = await onPressAtPostOtherContent({
                item,
                siteArrangementData: dateSiteArrangement?.siteArrangementData,
                keepSiteArrangementData: dateSiteArrangement?.keepSiteArrangementData ?? dateInvRequestArrangement?.keepInvRequestArrangementData,
                invRequestArrangementData: dateInvRequestArrangement?.invRequestArrangementData,
                site: dateSiteArrangement?.site,
                respondRequest: dateSiteArrangement?.request,
                myCompanyId,
                activeDepartmentIds,
                t,
                targetMeter: dateInvRequestArrangement?.targetMeter ?? dateSiteArrangement?.targetMeter,
                invRequest: dateInvRequestArrangement?.invRequest,
                onSetData: (data) => {
                    if (onPress) {
                        if (dateSiteArrangement) {
                            const _dateSiteArrangementData: DateSiteArrangementType = {
                                ...dateSiteArrangement,
                                siteArrangementData: data,
                            }
                            if (onPress) {
                                onPress(_dateSiteArrangementData)
                            }
                        }
                        if (dateInvRequestArrangement) {
                            const _dateInvRequestArrangementData: DateInvRequestArrangementType = {
                                ...dateInvRequestArrangement,
                                invRequestArrangementData: data,
                            }
                            if (onPress) {
                                onPress(_dateInvRequestArrangementData)
                            }
                        }
                    }
                },
                arrangeCount,
            })
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: result.errorCode,
                }
            }
            return Promise.resolve({ success: true })
        } catch (error) {
            return getErrorMessage(error)
        }
    }

    return (
        <ShadowBox
            key={listKey}
            hasShadow={true}
            style={{
                paddingBottom: 5,
                borderColor: THEME_COLORS.BLUE.MIDDLE_DEEP,
                opacity: dateSiteArrangement == undefined && dateInvRequestArrangement == undefined ? 0.5 : 1,
                ...style,
            }}>
            {(site != undefined || invRequest?.site?.siteId != undefined) && (
                <SiteHeader
                    site={site ?? invRequest?.site}
                    style={{
                        backgroundColor: THEME_COLORS.OTHERS.PURPLE_GRAY,
                        padding: 8,
                        borderTopEndRadius: 10,
                        borderTopStartRadius: 10,
                    }}
                    displayMeter={false}
                    titleStyle={
                        {
                            lineHeight: 14,
                            fontSize: 12,
                            fontFamily: FontStyle.regular,
                        } as ViewStyle
                    }
                    siteNameWidth={WINDOW_WIDTH - 40}
                    isDateArrangement={true}
                    displayDay={true}
                    routeNameFrom={routeNameFrom}
                />
            )}
            {invRequest?.invRequestId != undefined && invRequest.site?.siteId == undefined && (
                <InvRequestHeader
                    invRequest={invRequest}
                    presentCount={presentCount}
                    style={{
                        backgroundColor: THEME_COLORS.OTHERS.PURPLE_GRAY,
                        paddingTop: 10,
                        paddingHorizontal: 10,
                        borderTopEndRadius: 10,
                        borderTopStartRadius: 10,
                    }}
                    invRequestNameWidth={WINDOW_WIDTH - 40}
                    displayMeter={false}
                />
            )}
            {(dateSiteArrangement || dateInvRequestArrangement) && (
                <ArrangedBox
                    UIUpdate={update}
                    setting={dateSiteArrangement?.setting ?? dateInvRequestArrangement?.setting}
                    cantManage={dateSiteArrangement?.cantManage ?? dateInvRequestArrangement?.cantManage}
                    arrangementData={dateSiteArrangement?.siteArrangementData ?? dateInvRequestArrangement?.invRequestArrangementData}
                    siteId={site?.siteId ?? invRequest?.site?.siteId}
                    _onPressAtPostSelfContent={_onPressAtPostSelfContent}
                    _onPressAtPostOtherContent={_onPressAtPostOtherContent}
                    displayDetail={displayDetail}
                    isEdit={true}
                    onUIUpdate={onUpdate}
                    invRequest={dateInvRequestArrangement?.invRequest}
                    invRequestId={invRequest?.invRequestId}
                />
            )}
        </ShadowBox>
    )
})
