import sum from 'lodash/sum'
import uniq from 'lodash/uniq'
import React from 'react'
import { ListRenderItem, ListRenderItemInfo, View, FlatList, Text, StyleSheet } from 'react-native'
import { useSelector, useDispatch } from 'react-redux'
import { match } from 'ts-pattern'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { SiteArrangementDataType, SiteArrangementWorkerType, SiteArrangementCompanyType } from '../../../models/arrangement/SiteArrangementDataType'
import { InvRequestType } from '../../../models/invRequest/InvRequestType'
import { WorkerTagType } from '../../../models/worker/WorkerTagType'
import { ID } from '../../../models/_others/ID'
import { StoreType } from '../../../stores/Store'
import { setToastMessage, ToastMessage } from '../../../stores/UtilSlice'
import { WINDOW_WIDTH, THEME_COLORS } from '../../../utils/Constants'
import { FontStyle } from '../../../utils/Styles'
import { workerSortMethod } from '../../template/ArrangementManageUtils'
import { WorkerArrangeIcon } from '../worker/WorkerArrangeIcon'
import { CustomResponse } from '../../../models/_others/CustomResponse'
import { getErrorToastMessage } from '../../../services/_others/ErrorService'
import { SiteManageSetting } from '../../template/ArrangementManage'

export type ArrangementManageProps = {
    UIUpdate: number

    setting?: SiteManageSetting
    cantManage?: boolean
    invRequest?: InvRequestType | InvRequestType

    arrangementData?: SiteArrangementDataType

    /**
     * ここからpropsになって追加された分
     */
    siteId?: ID
    invRequestId?: ID
    invReservationId?: ID

    /**
     * ここからcomponentになって追加された部分
     */
    _onPressAtPostSelfContent?: (item: SiteArrangementWorkerType) => Promise<CustomResponse>
    _onPressAtPostOtherContent?: (item: SiteArrangementCompanyType, arrangeCount: number) => Promise<CustomResponse>
    displayDetail?: (type: 'company' | 'worker', item: SiteArrangementCompanyType | SiteArrangementWorkerType) => void
    isEdit?: boolean
    onUIUpdate?: () => void
    onConfirmed?: (item: boolean) => void
}

const IMAGE_WIDTH_RATIO = 1.2
const MAX_COLUMN_NUM = 7.5
const MARGIN = 45
const WIDTH = (WINDOW_WIDTH - MARGIN) / MAX_COLUMN_NUM

const ArrangedBox = (props: ArrangementManageProps) => {
    const { t } = useTextTranslation()

    const {
        UIUpdate,
        cantManage,
        setting,
        arrangementData,
        invRequest,
        siteId,
        invRequestId,
        invReservationId,
        _onPressAtPostSelfContent,
        _onPressAtPostOtherContent,
        displayDetail,
        isEdit,
        onUIUpdate,
        onConfirmed,
    } = props
    const myWorkerId = useSelector((state: StoreType) => state.account.signInUser?.workerId)
    const myCompanyId = useSelector((state: StoreType) => state.account?.belongCompanyId)
    const dispatch = useDispatch()

    const __onPressAtPostSelfContent = async (item: SiteArrangementWorkerType) => {
        try {
            if (item.worker?.workerId && arrangementData && _onPressAtPostSelfContent) {
                /**
                 * 各スクリーンごとに自動更新するページやLocalでの情報変更が違うため、propsでその部分のみ受け取る。
                 */
                const result = await _onPressAtPostSelfContent(item)
                if (onUIUpdate) {
                    onUIUpdate()
                }
                if (onConfirmed) {
                    onConfirmed(false)
                }
                if (result.error) {
                    throw {
                        error: result.error,
                        errorCode: result.errorCode,
                        type: result.type,
                    }
                }
            }
        } catch (error) {
            const _error = error as CustomResponse
            dispatch(
                setToastMessage({
                    text: getErrorToastMessage(_error),
                    type: _error.type,
                } as ToastMessage),
            )
        }
    }

    const __onPressAtPostOtherContent = async (item: SiteArrangementCompanyType, arrangeCount: number) => {
        try {
            if (arrangeCount >= 1 && arrangementData && _onPressAtPostOtherContent) {
                const result = await _onPressAtPostOtherContent(item, arrangeCount)
                if (result.error) {
                    throw {
                        error: result.error,
                        errorCode: result.errorCode,
                        type: result.type,
                    }
                }
                if (onUIUpdate) {
                    onUIUpdate()
                }
                if (onConfirmed) {
                    onConfirmed(false)
                }
            }
        } catch (error) {
            const _error = error as CustomResponse
            dispatch(
                setToastMessage({
                    text: getErrorToastMessage(_error),
                    type: _error.type,
                } as ToastMessage),
            )
        }
    }

    // 左上
    const _postSelfContent: ListRenderItem<SiteArrangementWorkerType> = (info: ListRenderItemInfo<SiteArrangementWorkerType>) => {
        const { item, index } = info
        if (invRequest && invRequest?.isApplication == false && myCompanyId != invRequest.myCompanyId) {
            return <></>
        }
        return (
            <WorkerArrangeIcon
                style={{
                    marginBottom: 5,
                }}
                onPress={
                    cantManage ? undefined : displayDetail && isEdit != true ? () => displayDetail('worker', item) : __onPressAtPostSelfContent ? () => __onPressAtPostSelfContent(item) : undefined
                }
                onLongPress={cantManage || invReservationId || displayDetail == undefined || isEdit != true ? undefined : () => displayDetail('worker', item)}
                update={UIUpdate}
                arrangeType={'post'}
                worker={{
                    ...item.worker,
                    workerTags: uniq([...(item.worker?.workerTags ?? []), myWorkerId == item.worker?.workerId ? 'is-mine' : undefined].filter((data) => data != undefined)) as WorkerTagType[],
                    dailyArrangeCount: (item.dailyArrangements?.items?.filter((arr) => arr.site?.fakeCompanyInvRequestId == undefined)?.length ?? 0) + (item.dailyInvRequests?.items?.length ?? 0),
                    type: 'worker',
                }}
                imageSize={WIDTH / IMAGE_WIDTH_RATIO}
            />
        )
    }

    // 右上
    const _postOtherContent: ListRenderItem<SiteArrangementCompanyType> = (info: ListRenderItemInfo<SiteArrangementCompanyType>) => {
        const { item, index } = info
        const arrangeCount = item?.targetRequest?.requestCount ?? 0
        // const dailyArrangeCount = sum(item.dailyRequests?.items?.map((req) => req.requestCount))
        const respondCount = item.targetRequest?.subRespondCount ?? 0
        // item.requestingWorkersなければ0。そんなことはケースはありえないが。
        return (
            <View
                style={{
                    flex: 0.5,
                    alignItems: 'center',
                }}>
                <WorkerArrangeIcon
                    style={{
                        marginBottom: 5,
                    }}
                    onPress={
                        cantManage
                            ? undefined
                            : isEdit != true && displayDetail
                            ? () => displayDetail('company', item)
                            : __onPressAtPostOtherContent != undefined
                            ? () => {
                                  if (arrangeCount - respondCount <= 0 && !item.requestedCompany?.isFake) {
                                      dispatch(
                                          setToastMessage({
                                              text: t('common:CannotBeReducedBelowNoOfResponses'),
                                              type: 'warn',
                                          } as ToastMessage),
                                      )
                                      return
                                  }
                                  __onPressAtPostOtherContent(item, arrangeCount)
                              }
                            : undefined
                    }
                    update={UIUpdate}
                    onLongPress={cantManage || invReservationId || displayDetail == undefined || isEdit != true ? undefined : () => displayDetail('company', item)}
                    arrangeType={'post'}
                    worker={{
                        ...item.requestedCompany,
                        type: 'company',
                        arrangeCount,
                        // dailyArrangeCount,
                        respondCount: respondCount,
                        isFakeCompany: item.requestedCompany?.isFake,
                        isApplication: item?.targetRequest?.isApplication,
                        isApproval: item?.targetRequest?.isApproval,
                    }}
                    imageSize={WIDTH / IMAGE_WIDTH_RATIO}
                    isChargeCompany={(item.targetRequest?.subAttendances?.items?.filter((att) => att.worker?.workerTags?.includes('is-site-manager')).length ?? 0) > 0}
                />
            </View>
        )
    }

    return (
        <View
            style={{
                flexDirection: 'row',
                flex: 1,
                marginRight: 5,
            }}>
            <View
                style={{
                    flex: 2,
                    borderColor: THEME_COLORS.OTHERS.BORDER_COLOR,
                    borderWidth: 1,
                    borderRadius: 10,
                    marginLeft: 5,
                }}>
                {/* 左上 */}
                <FlatList
                    listKey="selfArranged" // 一意のlistKeyを指定する
                    style={{
                        padding: 5,
                    }}
                    ListHeaderComponent={() => {
                        return (
                            <Text style={styles.workerTitle}>
                                {match(setting?.perspective)
                                    .with('other-company', () => t('common:ArrangementWorker'))
                                    .otherwise(() => t('common:InHouseWorkers'))}
                            </Text>
                        )
                    }}
                    ListFooterComponent={() => {
                        return (
                            <View
                                style={{
                                    marginBottom: 100,
                                }}></View>
                        )
                    }}
                    data={
                        //TODO:ここもtargetArrangementで統一できそう
                        invRequestId
                            ? [...[...(arrangementData?.selfSide ?? [])].filter((side) => side.targetInvRequest?.invRequestId == invRequestId).sort(workerSortMethod)]
                            : siteId
                            ? [...[...(arrangementData?.selfSide ?? [])].filter((side) => side.targetArrangement != undefined).sort(workerSortMethod)]
                            : invReservationId
                            ? [...[...(arrangementData?.selfSide ?? [])].filter((side) => side.targetInvRequest?.invRequestId == invReservationId).sort(workerSortMethod)]
                            : []
                    }
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={_postSelfContent}
                    numColumns={5}
                    extraData={UIUpdate}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                />
            </View>
            {/* 右上 */}
            {siteId && (
                <View
                    style={{
                        flex: 1,
                        borderColor: THEME_COLORS.OTHERS.BORDER_COLOR,
                        borderWidth: 1,
                        borderRadius: 10,
                        marginLeft: 5,
                    }}>
                    <FlatList
                        listKey="otherArranged" // 一意のlistKeyを指定する
                        style={{
                            padding: 5,
                        }}
                        ListHeaderComponent={() => {
                            return (
                                <Text style={styles.workerTitle}>
                                    {match(setting?.perspective)
                                        .with('other-company', () => t('common:RequestForSupportArranged'))
                                        .otherwise(() => t('common:WorkersForCompanies'))}
                                </Text>
                            )
                        }}
                        ListFooterComponent={() => {
                            return (
                                <View
                                    style={{
                                        marginBottom: 100,
                                    }}></View>
                            )
                        }}
                        data={[...[...(arrangementData?.otherSide ?? [])].filter((side) => (side.targetRequest?.requestCount ?? 0) > 0)]}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={_postOtherContent}
                        numColumns={2}
                        extraData={UIUpdate}
                        showsHorizontalScrollIndicator={false}
                        showsVerticalScrollIndicator={false}
                    />
                </View>
            )}
        </View>
    )
}
export default ArrangedBox

const styles = StyleSheet.create({
    workerTitle: {
        fontFamily: FontStyle.regular,
        fontSize: 10,
        lineHeight: 12,
        marginBottom: 5,
        color: THEME_COLORS.OTHERS.GRAY,
    },
})
