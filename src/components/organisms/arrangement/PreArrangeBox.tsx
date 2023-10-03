/* eslint-disable indent */
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Text, View, StyleSheet, FlatList, ListRenderItem, ListRenderItemInfo, ViewStyle, Pressable, Animated, Dimensions } from 'react-native'
import { useIsFocused } from '@react-navigation/core'
import { StackNavigationProp } from '@react-navigation/stack'
import { ifIphoneX } from 'react-native-iphone-screen-helper'
import { match } from 'ts-pattern'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { toCustomDateFromTotalSeconds } from '../../../models/_others/CustomDate'
import { CustomResponse } from '../../../models/_others/CustomResponse'
import { ID } from '../../../models/_others/ID'
import { SiteArrangementDataType, SiteArrangementWorkerType, SiteArrangementCompanyType } from '../../../models/arrangement/SiteArrangementDataType'
import { SiteType } from '../../../models/site/Site'
import { RootStackParamList, ScreenNameType } from '../../../screens/Router'
import { getErrorToastMessage } from '../../../services/_others/ErrorService'
import { StoreType } from '../../../stores/Store'
import { setToastMessage, ToastMessage, setLoading } from '../../../stores/UtilSlice'
import { checkMyDepartment } from '../../../usecases/department/DepartmentCase'
import { checkLockOfTarget } from '../../../usecases/lock/CommonLockCase'
import { WINDOW_WIDTH, THEME_COLORS, IPHONEX_BOTTOM_HEIGHT } from '../../../utils/Constants'
import { GlobalStyles, FontStyle } from '../../../utils/Styles'
import { BottomMargin } from '../../atoms/BottomMargin'
import { PlusButton } from '../../atoms/PlusButton'
import { workerSortMethod } from '../../template/ArrangementManageUtils'
import { Search } from '../Search'
import { WorkerArrangeIcon } from '../worker/WorkerArrangeIcon'
import TriangleSvg from '../../../../assets/images/arrangeTriangle.svg'
import { SiteManageSetting } from '../../template/ArrangementManage'
import { AppButton } from '../../atoms/AppButton'
import { Icon } from '../../atoms/Icon'
import { BottomSheet } from '../../template/BottomSheet'
import { InstructionModel } from '../../../models/instruction/Instruction'
import { EmptyScreen } from '../../template/EmptyScreen'

/**
 * ここで持ってきているものは、テンプレート側で値を変更しても反映されないので、こちら側で値を変えてはいけない。
 */
export type ArrangementManageProps = {
    UIUpdate: number

    setting?: SiteManageSetting
    site?: SiteType
    cantManage?: boolean

    arrangementData?: SiteArrangementDataType

    invRequestId?: ID
    invReservationId?: ID

    navigation: StackNavigationProp<RootStackParamList, ScreenNameType>
    myWorkerId?: ID
    _onPressAtPreSelfContent: (item: SiteArrangementWorkerType, arrangeCount: number) => Promise<CustomResponse>
    _onPressAtPreOtherContent?: (item: SiteArrangementCompanyType) => Promise<CustomResponse>

    onUIUpdate?: () => void
    displayDetail?: (type: 'company' | 'worker', item: SiteArrangementCompanyType | SiteArrangementWorkerType) => void
    onConfirmed?: (item: boolean) => void
    style?: ViewStyle
    bottomStyle?: ViewStyle
    // isHideSearch?: boolean
    setClose?: () => void
    instruction?: InstructionModel
}

const IMAGE_WIDTH_RATIO = 1.2
const MAX_COLUMN_NUM = 7.5
const MARGIN = 45
const WIDTH = (WINDOW_WIDTH - MARGIN) / MAX_COLUMN_NUM

const PreArrangeBox = (props: ArrangementManageProps) => {
    const { t } = useTextTranslation()

    const {
        UIUpdate,
        cantManage,
        site,
        setting,
        arrangementData,
        invRequestId,
        invReservationId,
        navigation,
        myWorkerId,
        _onPressAtPreSelfContent,
        _onPressAtPreOtherContent,
        displayDetail,
        onUIUpdate,
        onConfirmed,
        style,
        bottomStyle,
        // isHideSearch,
        setClose,
        instruction,
    } = props

    const myCompanyId = useSelector((state: StoreType) => state.account?.belongCompanyId)
    const dispatch = useDispatch()
    const isFocused = useIsFocused()
    const [textFilter, setTextFilter] = useState<string | undefined>(undefined)
    const activeDepartments = useSelector((state: StoreType) => state.account?.activeDepartments)
    const activeDepartmentIds = useMemo(() => activeDepartments?.map((dep) => dep?.departmentId).filter((data) => data != undefined) as string[], [activeDepartments])

    /**
     * 非推奨の作業員。休みかその日手配１回以上か。
     */
    const __isNotTargetWorker = (item: SiteArrangementWorkerType) => {
        return (
            item.worker?.workerTags?.includes('is-holiday') ||
            (item.dailyArrangements?.items?.length ?? 0) > 0 ||
            (item.dailyInvRequests?.items?.length ?? 0) > 0
        )
    }

    // 左下
    const _preSelfContent: ListRenderItem<SiteArrangementWorkerType> = (info: ListRenderItemInfo<SiteArrangementWorkerType>) => {
        const { item, index } = info
        // siteArrangement=現場への手配、targetArrangement=常用現場or現場への手配（常用現場かどうかで場合分け）。
        // 同じ現場に複数の常用依頼がある場合に対応するためsiteArrangementでもチェック。
        const arrangeCount = (item?.targetArrangement == undefined ? 0 : 1) + (item?.targetInvRequest == undefined ? 0 : 1)

        const isNotTarget = __isNotTargetWorker(item)

        if (index == 0) {
            return <PlusButton size={WIDTH - 20} style={{ margin: 10 }} onPress={() => navigation.push('AddMyWorker')} />
        }

        return (
            <WorkerArrangeIcon
                style={{
                    marginBottom: 5,
                    /**
                     * 管理者の場合はちょっとだけ薄く。
                     */
                    opacity: arrangeCount >= 1 ? 0.2 : isNotTarget ? 0.3 : 1,
                }}
                update={UIUpdate}
                onPress={
                    cantManage
                        ? undefined
                        : () => {
                              __onPressAtPreSelfContent(item, arrangeCount)
                          }
                }
                onLongPress={cantManage || invReservationId || displayDetail == undefined ? undefined : () => displayDetail('worker', item)}
                arrangeType={'pre'}
                worker={{
                    ...item.worker,
                    type: 'worker',
                    dailyArrangeCount: (item.dailyArrangements?.items?.filter((arr) => arr.site?.fakeCompanyInvRequestId == undefined)?.length ?? 0) + (item.dailyInvRequests?.items?.length ?? 0),
                }}
                imageSize={WIDTH / IMAGE_WIDTH_RATIO}
            />
        )
    }

    const __onPressAtPreSelfContent = async (item: SiteArrangementWorkerType, arrangeCount: number) => {
        try {
            if (arrangeCount <= 0 && arrangementData && item?.worker?.workerId) {
                const result = await _onPressAtPreSelfContent(item, arrangeCount)
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
    // 右下
    const _preOtherContent: ListRenderItem<SiteArrangementCompanyType> = (info: ListRenderItemInfo<SiteArrangementCompanyType>) => {
        const { item, index } = info
        // siteArrangement=現場への手配、targetArrangement=常用現場or現場への手配（常用現場かどうかで場合分け）。
        // 同じ現場に複数の常用依頼がある場合に対応するためsiteArrangementでもチェック。（siteArrangements >= targetArrangements）

        // const dailyArrangeCount = sum(item.dailyRequests?.items?.map((req) => req.requestCount ?? 0)) ?? 0
        const respondCount = item.targetRequest?.subRespondCount ?? 0
        // item.requestingWorkersなければ0。そんなことはケースはありえないが。

        if (index == 0) {
            return (
                <View
                    style={{
                        flex: 0.5,
                        alignItems: 'center',
                        marginTop: 10,
                    }}>
                    <PlusButton
                        size={WIDTH - 20}
                        style={{}}
                        onPress={async () => {
                            try {
                                if (
                                    site?.construction?.contract?.receiveCompanyId == myCompanyId &&
                                    !checkMyDepartment({
                                        targetDepartmentIds: site?.construction?.contract?.receiveDepartmentIds,
                                        activeDepartmentIds,
                                    })
                                ) {
                                    throw {
                                        error: t('admin:TheContractIsInAnotherDepartmentPleaseSwitchDepartments'),
                                        errorCode: 'ADD_REQUEST_ERROR',
                                    }
                                }
                                const lockResult = await checkLockOfTarget({
                                    myWorkerId: myWorkerId ?? 'no-id',
                                    targetId: site?.siteId ?? 'no-id',
                                    modelType: 'site',
                                })
                                if (lockResult.error) {
                                    throw {
                                        error: lockResult.error,
                                    }
                                }
                                navigation.push('SelectCompany', {
                                    selectCompany: {
                                        withoutMyCompany: true,
                                        title: t('admin:CompanyRequestingSupport'),
                                    },
                                    initStartDate: site?.siteDate ? toCustomDateFromTotalSeconds(site?.siteDate) : undefined,
                                    routeNameFrom: 'ArrangementManage',
                                    constructionIds: site?.constructionId ? [site?.constructionId] : undefined,
                                    invRequestId,
                                    siteId: site?.siteId,
                                })
                            } catch (error) {
                                const _error = error as CustomResponse
                                if (isFocused) dispatch(setLoading(false))
                                dispatch(
                                    setToastMessage({
                                        text: getErrorToastMessage(_error),
                                        type: 'error',
                                    } as ToastMessage),
                                )
                            }
                        }}
                    />
                </View>
            )
        }

        return (
            <WorkerArrangeIcon
                style={{
                    marginBottom: 5,
                    flex: 0.5,
                    alignItems: 'center',
                }}
                update={UIUpdate}
                onPress={
                    cantManage
                        ? undefined
                        : () => {
                              __onPressAtPreOtherContent(item)
                          }
                }
                onLongPress={cantManage || invReservationId || displayDetail == undefined ? undefined : () => displayDetail('company', item)}
                arrangeType={'pre'}
                worker={{
                    ...item.requestedCompany,
                    type: 'company',
                    // dailyArrangeCount,
                    respondCount: respondCount ?? 0,
                    isFakeCompany: item.requestedCompany?.isFake,
                }}
                imageSize={WIDTH / IMAGE_WIDTH_RATIO}
            />
        )
    }

    const __onPressAtPreOtherContent = async (item: SiteArrangementCompanyType) => {
        try {
            if (_onPressAtPreOtherContent == undefined) return
            const result = await _onPressAtPreOtherContent(item)
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

    /**
     * @param siteWorker {@link SiteArrangementWorkerType}
     * @returns
     *  - 作業員が応援で送られてきている：true
     *  - 自部署と契約の両方に縛りがある場合を除き、全部署作業員は常に表示
     *  - 編集者が全部署かつ契約が全部署：true
     *  - 編集者が全部署かつ応援依頼：true
     *  - 編集者が指定部署かつ応援依頼：編集者の部署で絞り込み
     *  - 編集者が全部署かつ契約が指定部署：契約の部署で絞り込み
     *  - 編集者が指定部署かつ契約が全部署：編集者の部署で絞り込み
     *  - 編集者が指定部署かつ契約が指定部署：編集者と契約の部署で絞り込み
     */
    const departmentsFilter = (siteWorker: SiteArrangementWorkerType) => {
        /**
         * 応援できた作業員は常に表示
         */
        if (siteWorker?.worker?.invRequestId) return true

        /**
         * 全部署作業員は常に表示
         */
        if (siteWorker.worker?.departmentIds == undefined || siteWorker.worker?.departmentIds?.length == 0) {
            return true
        }
        if (activeDepartmentIds == undefined || activeDepartmentIds.length == 0) {
            //編集者が全部署
            if (site?.siteRelation == 'manager') {
                //契約の部署でフィルターする
                const contractDepartmentIds = site?.construction?.contract?.receiveDepartmentIds ?? []
                if (contractDepartmentIds.length == 0) {
                    //契約が全部署
                    return true
                } else {
                    //契約に部署指定あり
                    const contractDepartmentIdsSet = new Set(contractDepartmentIds)
                    return (siteWorker.worker?.departmentIds?.filter((id) => contractDepartmentIdsSet.has(id)).length ?? 0) > 0
                }
            } else {
                //応援依頼では部署フィルターなし
                return true
            }
        } else {
            //編集者に部署指定あり
            if (site?.siteRelation == 'manager') {
                //契約の部署と自部署でフィルターする
                const contractDepartmentIds = site?.construction?.contract?.receiveDepartmentIds ?? []
                if (contractDepartmentIds.length == 0) {
                    //契約が全部署
                    const activeDepartmentIdsSet = new Set(activeDepartmentIds)
                    return (siteWorker.worker?.departmentIds?.filter((id) => activeDepartmentIdsSet.has(id)).length ?? 0) > 0
                } else {
                    //契約に部署指定あり
                    const activeDepartmentIdsSet = new Set(activeDepartmentIds)
                    const contractDepartmentIdsSet = new Set(contractDepartmentIds)
                    return (siteWorker.worker?.departmentIds?.filter((id) => activeDepartmentIdsSet.has(id) && contractDepartmentIdsSet.has(id)).length ?? 0) > 0
                }
            } else {
                //自部署でフィルターする
                const activeDepartmentIdsSet = new Set(activeDepartmentIds)
                return (siteWorker.worker?.departmentIds?.filter((id) => activeDepartmentIdsSet.has(id)).length ?? 0) > 0
            }
        }
    }

    const displaySelfSideWorkers = useMemo(() => {
        let filteredData = arrangementData?.selfSide ?? []
        if (textFilter && textFilter.length > 0) {
            filteredData = arrangementData?.selfSide?.filter((worker) => (worker.worker?.nickname ?? worker.worker?.name)?.includes(textFilter)) ?? []
        }
        return [{}, ...[...(filteredData ?? [])].filter(departmentsFilter).sort(workerSortMethod)] //{}は+ボタン表示用
    }, [arrangementData?.selfSide, textFilter])

    const displayOtherSideWorkers = useMemo(() => {
        let filteredData = arrangementData?.otherSide ?? []
        if (textFilter && textFilter.length > 0) {
            filteredData = arrangementData?.otherSide?.filter((company) => company.requestedCompany?.name?.includes(textFilter)) ?? []
        }
        return [{}, ...[...(filteredData ?? [])]] //{}は+ボタン表示用
    }, [arrangementData?.selfSide, textFilter])

    return (
        <View
            style={{
                height: '50%',
                backgroundColor: 'white',
                width: '100%',
                ...ifIphoneX(
                    {
                        paddingBottom: 5 + IPHONEX_BOTTOM_HEIGHT,
                    },
                    {
                        paddingBottom: 5,
                    },
                ),
                ...style,
            }}>
            {(site?.siteId != undefined || invRequestId != undefined || invReservationId != undefined) && setting?.displayNothing != true && (
                <>
                    {setting?.hideArrangeableWorkers != true ? (
                        <>
                        {
                            (instruction?.instructionStatus== 'created' ||
                            instruction?.instructionStatus == 'edited' ||
                            instruction?.instructionStatus == 'deleted') ? 
                            <EmptyScreen
                                text={t('admin:InstructionsWillBeProvidedOnSiteDetails')}
                                addButtonText={t('admin:SiteDetails')}
                                onPress={
                                    () => navigation.push('SiteDetail', {
                                        title: instruction?.originInfo?.name ?? instruction?.instructionInfo?.name,
                                        siteId: instruction?.originInfo?.siteId ?? instruction?.instructionInfo?.siteId,
                                    })
                                }
                                iconName='none'
                            />
                            :
                            <View
                                style={{
                                    flex: 1,
                                    ...bottomStyle,
                                }}>
                                {/* {isHideSearch != true && (
                                    <Search
                                        style={{ marginBottom: 8, marginHorizontal: 10 }}
                                        text={textFilter}
                                        title={t('common:SearchByWorkerNameOrCompany')}
                                        onChange={setTextFilter}
                                        clearText={() => setTextFilter(undefined)}
                                        placeholder={t('common:SearchByWorkerNameOrCompany')}
                                        onBlur={undefined}
                                    />
                                )} */}
                                    <Pressable
                                        style={{
                                            backgroundColor: 'white',
                                            width: '100%',
                                            alignItems: 'center'
                                        }}
                                        onPress={() => {
                                            if (setClose) {
                                                setClose()
                                            }
                                        }}>
                                        <Icon
                                        style={{
                                            paddingHorizontal: 10,
                                            paddingVertical: 5,
                                        }}
                                            name={'toggle'}
                                            width={19}
                                            height={19}
                                        />
                                    </Pressable>
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        flex: 1,
                                        marginRight: 5,
                                    }}>
                                    {/* 左下 */}
                                    <View
                                        style={{
                                            flex: 2,
                                            borderColor: THEME_COLORS.OTHERS.BORDER_COLOR,
                                            borderWidth: 1,
                                            borderRadius: 10,
                                            marginLeft: 5,
                                        }}>
                                        <FlatList
                                            listKey="PreSelfSide"
                                            style={{
                                                padding: 5,
                                            }}
                                            ListHeaderComponent={() => {
                                                return (
                                                    <Text style={styles.workerTitle}>
                                                        {match(setting?.perspective)
                                                            .with('other-company', () => '施工主作業員')
                                                            .otherwise(() => '自社作業員')}
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
                                            data={displaySelfSideWorkers}
                                            keyExtractor={(item, index) => index.toString()}
                                            renderItem={_preSelfContent}
                                            numColumns={5}
                                            extraData={UIUpdate}
                                            showsHorizontalScrollIndicator={false}
                                            showsVerticalScrollIndicator={false}
                                        />
                                    </View>
                                    {site?.siteId && (
                                        // 右下
                                        <View
                                            style={{
                                                flex: 1,
                                                borderColor: THEME_COLORS.OTHERS.BORDER_COLOR,
                                                borderWidth: 1,
                                                borderRadius: 10,
                                                marginLeft: 5,
                                            }}>
                                            <FlatList
                                                listKey="PreOtherSide"
                                                style={{
                                                    padding: 5,
                                                }}
                                                ListHeaderComponent={() => {
                                                    return (
                                                        <Text style={styles.workerTitle}>
                                                            {match(setting?.perspective)
                                                                .with('other-company', () => t('common:SupportRequest'))
                                                                .otherwise(() => t('admin:OtherCompanyWorker'))}
                                                        </Text>
                                                    )
                                                }}
                                                ListFooterComponent={() => {
                                                    return <BottomMargin />
                                                }}
                                                // arrangementData?.otherSideを新規作成すること。sortがかかってしまう。
                                                data={displayOtherSideWorkers}
                                                keyExtractor={(item, index) => index.toString()}
                                                renderItem={_preOtherContent}
                                                numColumns={2}
                                                extraData={UIUpdate}
                                                showsHorizontalScrollIndicator={false}
                                                showsVerticalScrollIndicator={false}
                                            />
                                        </View>
                                    )}
                                </View>
                                <Text style={[GlobalStyles.smallGrayText, { marginTop: 5, marginLeft: 10, fontSize: 11, lineHeight: 13 }]}>{t('common:PressAndHoldIconForDetails')}</Text>
                            </View>
                        }
                        </>
                    ) : (
                        <View
                            style={{
                                ...ifIphoneX(
                                    {
                                        paddingBottom: 10 + IPHONEX_BOTTOM_HEIGHT,
                                    },
                                    {
                                        paddingBottom: 10,
                                    },
                                ),
                                ...bottomStyle,
                            }}></View>
                    )}
                </>
            )}
        </View>
    )
}
export default PreArrangeBox

const styles = StyleSheet.create({
    workerTitle: {
        fontFamily: FontStyle.regular,
        fontSize: 10,
        lineHeight: 12,
        marginBottom: 5,
        color: THEME_COLORS.OTHERS.GRAY,
    },
})
