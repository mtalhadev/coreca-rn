import React, { useState, useEffect, useMemo, useContext, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { View, StyleSheet, ListRenderItem, ListRenderItemInfo, Alert, Pressable, Platform, FlatList } from 'react-native'
import { useNavigation, useRoute, RouteProp, useIsFocused } from '@react-navigation/core'
import { RootStackParamList } from '../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { CustomDate, dayBaseTextWithoutDate, getDailyStartTime } from '../../../models/_others/CustomDate'
import { AppButton } from '../../../components/atoms/AppButton'
import { CustomResponse } from '../../../models/_others/CustomResponse'
import { Line } from '../../../components/atoms/Line'
import { IconParam } from '../../../components/organisms/IconParam'
import { BottomMargin } from '../../../components/atoms/BottomMargin'
import { DateArrangement } from '../../../components/organisms/date/DateArrangement'
import { StoreType } from '../../../stores/Store'
import { setIsBottomOff, setLoading, setToastMessage, ToastMessage } from '../../../stores/UtilSlice'
import { getDateArrangedWorkersCount, setSiteCertainInTargetDate, updateDateArrangementsCache } from '../../../usecases/arrangement/DateArrangementCase'
import { AlertType } from '../../../usecases/AlertCase'
import { DateDataType } from '../../../models/date/DateDataType'
import { SiteType } from '../../../models/site/Site'
import { checkLockOfTarget, updateLockOfTarget } from '../../../usecases/lock/CommonLockCase'
import { updateCachedData, getCachedData, genKeyName } from '../../../usecases/CachedDataCase'
import { DateRouterContext } from './DateRouter'
import { getErrorMessage, getErrorToastMessage } from '../../../services/_others/ErrorService'
import { useSafeUnmount, useSafeLoadingUnmount } from '../../../fooks/useUnmount'
import cloneDeep from 'lodash/cloneDeep'
import { setIsNavUpdating } from '../../../stores/NavigationSlice'
import { useTextTranslation } from './../../../fooks/useTextTranslation'
import { SwitchPage } from '../../../components/template/SwitchPage'
import { InvRequestType } from '../../../models/invRequest/InvRequestType'
import { ReplaceAnd } from '../../../models/_others/Common'
import { _getFirestore } from '../../../services/firebase/FirestoreService'
import { InvRequestWithSites } from '../../../components/organisms/invRequest/InvRequestWithSites'
import { THEME_COLORS } from '../../../utils/Constants'
import { SiteArrangementModel } from '../../../models/arrangement/SiteArrangement'
import { ID } from '../../../models/_others/ID'
import { DateSiteArrangementManage } from '../../../components/organisms/date/DateSiteArrangementManage'
import { LocalSiteArrangementDataType, SiteArrangementCompanyType, SiteArrangementDataType, SiteArrangementWorkerType } from '../../../models/arrangement/SiteArrangementDataType'
import {
    applyDraftSiteArrangementData,
    deleteLocalSiteArrangement,
    getDraftArrangementDataOfTargetId,
    onPressAtPreSelfContent,
    setPreviousArrangements,
    updateDraftData,
    updateRequestsApplication,
    writeLocalSiteArrangement,
    setToHolidayAtSite,
    onPressAtPreOtherContent,
    updateSiteArrangementCache,
    updateInvRequestArrangementCache,
    ApplyDraftSiteArrangementDataResponse,
} from '../../../usecases/arrangement/SiteArrangementCase'
import flatten from 'lodash/flatten'
import uniq from 'lodash/uniq'
import { addUpdateScreens, toIdAndMonthFromTotalSeconds } from '../../../models/updateScreens/UpdateScreens'
import { updateRequestIsApproval } from '../../../usecases/request/CommonRequestCase'
import { RequestType } from '../../../models/request/Request'
import PreArrangeBox from '../../../components/organisms/arrangement/PreArrangeBox'
import { SiteManageSetting } from '../../../components/template/ArrangementManage'
import { match } from 'ts-pattern'
import { BottomSheetArrangementDetailType, WorkerDetailBottomSheet } from '../../../components/organisms/WorkerDetailBottomSheet'
import { _addInvRequestLocalInsideWorker, _deleteLocalReservation } from '../../../components/template/ArrangementManageUtils'
import { EmptyScreen } from '../../../components/template/EmptyScreen'
import { InvRequestArrangementModel } from '../../../models/invRequest/InvRequestArrangement'
import { getSiteArrangement } from '../../../usecases/ssg/SiteArrangementSSGCase'
import { getInvRequestArrangement } from '../../../usecases/ssg/InvRequestArrangementSSGCase'
import pull from 'lodash/pull'
import uniqBy from 'lodash/uniqBy'
import xor from 'lodash/xor'
import sum from 'lodash/sum'
import { deleteReservation } from '../../../usecases/reservation/ReservationCase'
import { WorkerType } from '../../../models/worker/Worker'
import { ApplyDraftInvRequestArrangementDataResponse, applyDraftInvRequestArrangementData } from '../../../usecases/invRequest/InvRequestArrangementCase'
import { BaseModal } from '../../../components/organisms/BaseModal'
import { TodoList } from '../../../components/organisms/TodoList'
import { approveInvRequest } from '../../../usecases/invRequest/invRequestCase'
import { onUpdateArrangementUpdateSiteAttendanceCache } from '../../../usecases/attendance/CommonAttendanceCase'
import { SiteAttendanceDataType } from '../../../models/attendance/SiteAttendanceDataType'
import { AllSiteAttendancesMangeCacheDataType } from '../attendance/AllSiteAttendancesManage'
import { SiteAttendanceModel } from '../../../models/attendance/SiteAttendance'
import { ArrangementType } from '../../../models/arrangement/Arrangement'
import { ArrangementWorkerType } from '../../../models/worker/ArrangementWorkerListType'
import { _writeLocalSiteArrangements } from '../../../services/arrangement/ArrangementService'

// import { createLogger } from '../../../services/_others/LoggerServiceNative' // for log rerendering
type NavProps = StackNavigationProp<RootStackParamList, 'DateRouter'>
type RouteProps = RouteProp<RootStackParamList, 'DateRouter'>
/**
 * isSiteArrangeFetching - ローディング中を表示させるため
 * isInvArrangeFetching - ローディング中を表示させるため
 * arrangementDetail - 手配詳細表示用
 * isWaiting - 手配情報のSSGが更新されるのを待つ必要がある場合
 * isHideDateSwitch - 手配変集中は日付切り替えできなくする
 * isDisplayTodo - 未承認の依頼と常用で来る一覧を表示する
 * draftData - 以下三つをまとめたもの。これを一つのトリガーとして扱うためまとめる。
 * draftDateData - その日の下書きの手配情報を反映したdateData
 * draftSiteArrangements - その日の下書きの手配情報
 * daftInvRequestArrangements - その日の下書きの手配情報
 * isSiteDraftUpdate - Site下書き情報を更新した場合にtrueにする。これをトリガーにして、再度draftDateDataを更新する。
 * isInvDraftUpdate - Inv下書き情報を更新した場合にtrueにする。これをトリガーにして、再度draftDateDataを更新する。
 * displayIds - 初回のみ現場を並び替える
 */
type InitialStateType = {
    date?: CustomDate
    update: number
    isSiteArrangeFetching?: boolean
    isInvArrangeFetching?: boolean
    deletingIds?: string[]
    dateData?: DateDataType
    isArrangeMode?: boolean
    siteArrangements?: DateSiteArrangementType[]
    invRequestArrangements?: DateInvRequestArrangementType[]
    selectedId?: ID
    arrangementDetail?: BottomSheetArrangementDetailType
    isWaiting?: boolean
    isHideDateSwitch?: boolean
    isDisplayTodo?: boolean
    draftData?: {
        draftDateData?: DateDataType
        draftSiteArrangements?: LocalSiteArrangementDataType[]
        daftInvRequestArrangements?: LocalSiteArrangementDataType[]
    }
    isSiteDraftUpdate?: boolean
    isInvDraftUpdate?: boolean
    displayIds?: string[]
}

export type DateSiteArrangementType = {
    keepSiteArrangementData?: SiteArrangementDataType
    setting?: SiteManageSetting
    cantManage?: boolean
    // respondRequest?: RequestType
    localPresentNum?: number
} & SiteArrangementModel

export type DateInvRequestArrangementType = {
    keepInvRequestArrangementData?: SiteArrangementDataType
    setting?: SiteManageSetting
    cantManage?: boolean
    // respondRequest?: RequestType
    localPresentNum?: number
} & InvRequestArrangementModel

const initialState: InitialStateType = {
    update: 0,
    isArrangeMode: false,
    isHideDateSwitch: false,
    isSiteDraftUpdate: false,
    isInvDraftUpdate: false,
    displayIds: [],
}

export type AlertUIType = {
    message?: AlertType
    batchCount?: number
    screenName?: string
    params?: Record<string, string | number | undefined>
}

/**
 * 日付手配編集
 * isFetchingを使わない代わりに、データの再取得が必要な場合は、dispatch(setIsNavUpdating(true))を行う。
 * dateDataのデータはそのままでいい場合はisArrangeFetching
 */
// const logger = createLogger() // for log rerendering
type DateArrangementType = ReplaceAnd<SiteType, InvRequestType>

/**
 * 流れ
 * dateData取得
 * 下書き手配を取得して変更点を反映する。
 * dateDataと手配の下書きを照らし合わせてdraftDateDataを更新。→表示
 * 下書きデータだけ渡してサーバー側と手配データの整合性を更新。手配キャッシュも更新。
 * その際に更新があった場合のみフラグを立てて、下書きを新しくしてdraftDateDataを更新。→表示(この時フェッチフラグはいじらない。フェッチフラグもいじってしまうとまた手配を更新することになる)
 * フラグ基準:下書きデータと更新後のデータで、手配が違っている場合。常用予約や常用できているが手配されていない場合は含まない。
 * 下書きがない現場のdailyArrangements,dailyInvRequestsを他現場の下書きを元に反映。
 * フラグ立った時だけ、下書きがない手配は更新する。
 *
 * 画面リロード時
 * 再度下書きの取得からやり直す。
 *
 * 自社作業員の手配の変更を行った場合
 * dailyArrangementsまたはdailyInvRequestが変わるため、他現場の下書きも都度更新する。setStateでもsiteArrangementsとinvRequestsを更新する。（選択現場変更時までに反映されていればよく、即時性がそこまで求められないため、手配の変更のようなシャローコピーは行わない）
 * 前回現場複製も同様に下書きに反映してリロードする。
 *
 * いっそ全てを日付ごとの管理にしてしまった方が楽かもしれない。ただし部署ごとに日毎の現場は変わるので、現場に部署idをつける必要がある。
 */
const DateArrangements = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const [
        {
            date,
            isSiteArrangeFetching,
            isInvArrangeFetching,
            deletingIds,
            isArrangeMode,
            siteArrangements,
            invRequestArrangements,
            selectedId,
            update,
            arrangementDetail,
            isWaiting,
            isHideDateSwitch,
            isDisplayTodo,
            draftData,
            isSiteDraftUpdate,
            isInvDraftUpdate,
            displayIds,
        },
        setState,
    ] = useState(initialState)
    const dispatch = useDispatch()
    const myCompanyId = useSelector((state: StoreType) => state?.account.belongCompanyId)
    const signInUser = useSelector((state: StoreType) => state?.account.signInUser)
    const holidays = useSelector((state: StoreType) => state.util.holidays)
    const isFocused = useIsFocused()
    //dateDataを最新に更新したい場合は、setIsNavUpdating(true)をする
    const { setDate, dateData, setDeletingIds, initDate, setDisplayScreen, toDoRequests, toDoInvRequests, setToDoInvRequests, setToDoRequests } = useContext(DateRouterContext)
    const loading = useSelector((state: StoreType) => state.util.loading)
    const activeDepartments = useSelector((state: StoreType) => state.account?.activeDepartments)
    const activeDepartmentIds = useMemo(() => activeDepartments?.map((dep) => dep?.departmentId).filter((data) => data != undefined) as string[], [activeDepartments])
    const localUpdateScreens = useSelector((state: StoreType) => state?.util?.localUpdateScreens)
    const myWorkerId = useSelector((state: StoreType) => state.account.signInUser?.workerId)
    const myCompany = useSelector((state: StoreType) => state.account.signInUser?.worker?.company)

    const [dateUpdate, setDateUpdate] = useState(0)
    const flatListRef = useRef<FlatList<ListRenderItem<DateArrangementType>>>(null)
    const cachedKeyRef = useRef<string | null>(null)
    const adminHomeCacheKeyRef = useRef<string | null>(null)
    const dateSiteArrangement = useMemo(() => siteArrangements?.filter((data) => data?.siteId == selectedId)[0], [selectedId, siteArrangements])
    const dateInvRequestArrangement = useMemo(() => invRequestArrangements?.filter((data) => data?.invRequestId == selectedId)[0], [selectedId, invRequestArrangements])

    useEffect(() => {
        if (isFocused) {
            setState((prev) => ({
                ...prev,
                date: initDate,
            }))
        }
    }, [initDate, isFocused])

    useMemo(() => {
        if (isFocused && (toDoRequests?.length ?? 0) + (toDoInvRequests?.length ?? 0) > 0) {
            setState((prev) => ({
                ...prev,
                isDisplayTodo: true,
            }))
        }
    }, [])

    /**
     * その日の手配下書きを全て取得して保存。draftDateDataへも反映させる。
     */
    useEffect(() => {
        ;(async () => {
            try {
                if (isFocused) {
                    const siteDraftResults = await Promise.all(
                        dateData?.sites?.totalSites?.items?.map((site) =>
                            getDraftArrangementDataOfTargetId(site.companyRequests?.receiveRequests?.items?.find((req) => req.requestedCompanyId == myCompanyId)?.requestId ?? site?.siteId),
                        ) ?? [],
                    )
                    siteDraftResults.forEach((siteDraft) => {
                        if (siteDraft.error) {
                            throw {
                                error: siteDraft.error,
                                errorCode: siteDraft.errorCode,
                            }
                        }
                    })
                    const siteDrafts = siteDraftResults.map((result) => result.success?.targetArrangementData).filter((data) => data != undefined) as LocalSiteArrangementDataType[]
                    const invRequestDraftResults = await Promise.all(dateData?.invRequests?.totalInvRequests?.items?.map((inv) => getDraftArrangementDataOfTargetId(inv.invRequestId)) ?? [])
                    invRequestDraftResults.forEach((invRequestDraft) => {
                        if (invRequestDraft.error) {
                            throw {
                                error: invRequestDraft.error,
                                errorCode: invRequestDraft.errorCode,
                            }
                        }
                    })
                    const invRequestDrafts = invRequestDraftResults.map((result) => result.success?.targetArrangementData).filter((data) => data != undefined) as LocalSiteArrangementDataType[]
                    const __draftDateData: DateDataType = {
                        ...dateData,
                        sites: {
                            ...dateData?.sites,
                            totalSites: {
                                items: dateData?.sites?.totalSites?.items?.map((site) => {
                                    const draftData =
                                        siteDrafts.find(
                                            (draft) => draft.siteArrangementId == site.companyRequests?.receiveRequests?.items?.find((req) => req.requestedCompanyId == myCompanyId)?.requestId,
                                        ) ?? siteDrafts.find((draft) => draft.siteArrangementId == site.siteId)
                                    const _presentArrangements =
                                        (draftData?.selfSide
                                            ?.filter((self) => self.targetArrangement != undefined)
                                            .map((data) => {
                                                return {
                                                    ...data?.targetArrangement,
                                                    worker: data?.worker,
                                                }
                                            })
                                            .filter((data) => data != undefined) as ArrangementType[]) ?? []

                                    const _presentRequests =
                                        (draftData?.otherSide
                                            ?.filter((other) => (other.targetRequest?.requestCount ?? 0) > 0)
                                            .map((data) => {
                                                return {
                                                    ...data?.targetRequest,
                                                    requestedCompany: data?.requestedCompany,
                                                } as RequestType
                                            })
                                            .filter((data) => data != undefined) as RequestType[]) ?? []
                                    if (draftData) {
                                        const _site: SiteType = {
                                            ...site,
                                            siteArrangementData: {
                                                //ここを更新しても、表示には影響ない。しかし、dateDataでここ持っているのならば、すべてのデータをdateDataで統一して、SiteArrangementやInvRequestSSGをなくすことができそう。
                                                ...site.siteArrangementData,
                                                ...draftData,
                                            },
                                            allArrangements: {
                                                //手配数カウント用に更新
                                                items: uniqBy(
                                                    [..._presentArrangements, ...(site?.allArrangements?.items?.filter((data) => data.createCompanyId != myCompanyId) ?? [])],
                                                    'arrangementId',
                                                ),
                                            },
                                            siteMeter: {
                                                ...site.siteMeter,
                                                companyPresentNum:
                                                    (draftData.selfSide?.filter((data) => data.targetArrangement != undefined).length ?? 0) +
                                                    sum(draftData.otherSide?.map((data) => data.targetRequest?.requestCount).filter((data) => data != undefined)),
                                                presentArrangements: {
                                                    items: _presentArrangements,
                                                },
                                                presentRequests: {
                                                    items: _presentRequests,
                                                },
                                            },
                                            companyRequests: {
                                                ...site?.companyRequests,
                                                receiveRequests: {
                                                    items:
                                                        site.companyRequests?.receiveRequests?.items && site.companyRequests?.receiveRequests?.items[0]
                                                            ? [
                                                                  {
                                                                      ...site.companyRequests?.receiveRequests?.items[0],
                                                                      requestMeter: {
                                                                          ...site.companyRequests?.receiveRequests?.items[0]?.requestMeter,
                                                                          companyPresentNum:
                                                                              _presentArrangements.length +
                                                                              sum(_presentRequests?.filter((req) => req != undefined).map((req) => req.requestCount ?? 0)),
                                                                          presentArrangements: {
                                                                              items: _presentArrangements,
                                                                          },
                                                                          presentRequests: {
                                                                              items: _presentRequests,
                                                                          },
                                                                      },
                                                                  } as RequestType,
                                                              ]
                                                            : [],
                                                },
                                                totalRequests: {
                                                    items:
                                                        (site.companyRequests?.totalRequests?.items?.filter((req) => req.requestedCompanyId == myCompanyId).length ?? 0) > 0
                                                            ? [
                                                                  ...(site.companyRequests?.totalRequests?.items ?? []),
                                                                  {
                                                                      ...site.companyRequests?.totalRequests?.items?.find((req) => req.requestedCompanyId == myCompanyId),
                                                                      requestMeter: {
                                                                          ...site.companyRequests?.totalRequests?.items?.find((req) => req.requestedCompanyId == myCompanyId)?.requestMeter,
                                                                          companyPresentNum:
                                                                              _presentArrangements.length +
                                                                              sum(_presentRequests?.filter((req) => req != undefined).map((req) => req.requestCount ?? 0)),
                                                                          presentArrangements: {
                                                                              items: _presentArrangements,
                                                                          },
                                                                          presentRequests: {
                                                                              items: _presentRequests,
                                                                          },
                                                                      },
                                                                  } as RequestType,
                                                              ]
                                                            : site.companyRequests?.totalRequests?.items,
                                                },
                                                orderRequests: {
                                                    items: draftData?.otherSide
                                                        ?.map((other) => {
                                                            return {
                                                                ...other.targetRequest,
                                                                requestedCompany: other.requestedCompany,
                                                            } as RequestType
                                                        })
                                                        .filter((data) => (data?.requestCount ?? 0) > 0),
                                                },
                                            },
                                        }
                                        return _site
                                    } else {
                                        return site
                                    }
                                }),
                            },
                        },
                        invRequests: {
                            orderInvRequests: {
                                items: dateData?.invRequests?.orderInvRequests?.items?.map((inv) => {
                                    const draftData = invRequestDrafts.find((draft) => draft.siteArrangementId == inv.invRequestId)
                                    if (draftData) {
                                        return updateInvRequest(inv, draftData)
                                    } else {
                                        return inv
                                    }
                                }),
                            },
                            totalInvRequests: {
                                items: dateData?.invRequests?.totalInvRequests?.items?.map((inv) => {
                                    const draftData = invRequestDrafts.find((draft) => draft.siteArrangementId == inv.invRequestId)
                                    if (draftData) {
                                        return updateInvRequest(inv, draftData)
                                    } else {
                                        return inv
                                    }
                                }),
                            },
                        },
                    }
                    const arrangedWorkersCount = getDateArrangedWorkersCount({
                        data: __draftDateData,
                    })
                    const _draftDateData = {
                        ...__draftDateData,
                        arrangementSummary: {
                            ...dateData?.arrangementSummary,
                            arrangedWorkersCount,
                        },
                    }

                    setState((prev) => ({
                        ...prev,
                        isSiteArrangeFetching: isSiteDraftUpdate || isInvDraftUpdate ? false : true,
                        isInvArrangeFetching: isSiteDraftUpdate || isInvDraftUpdate ? false : true,
                        isSiteDraftUpdate: false,
                        isInvDraftUpdate: false,
                        draftData: {
                            draftDateData: _draftDateData,
                            draftSiteArrangements: siteDrafts,
                            daftInvRequestArrangements: invRequestDrafts,
                        },
                        //selfSideの母数は共通している。targetのみがそれぞれの現場で違う。otherSideも母数を共通して、工事ごとにフィルターを受けるやり方のほうがReservationを保持するよりも良いかもしれない。
                    }))
                }
            } catch (error) {
                const _error = error as CustomResponse
                dispatch(
                    setToastMessage({
                        text: getErrorToastMessage(_error),
                        type: 'error',
                    }),
                )
            }
        })()
    }, [dateData, isFocused, isSiteDraftUpdate, isInvDraftUpdate])

    const updateInvRequest = (inv: InvRequestType, draftData: LocalSiteArrangementDataType) => {
        const _invRequest: InvRequestType = {
            ...inv,
            workerIds: draftData.selfSide?.filter((data) => data.targetInvRequest?.invRequestId == inv.invRequestId).map((data) => data.worker?.workerId ?? '') ?? [],
            workers: {
                items: (draftData.selfSide?.filter((data) => data.targetInvRequest?.invRequestId == inv.invRequestId).map((data) => data.worker) as ArrangementWorkerType[]) ?? [],
            },
            site: {
                ...inv?.site,
                siteMeter: {
                    ...inv?.site?.siteMeter,
                    companyPresentNum:
                        (draftData.selfSide?.filter((data) => data.targetInvRequest?.invRequestId == inv.invRequestId).map((data) => data.worker?.workerId ?? '')?.length ?? 0) +
                        sum(draftData?.otherSide?.map((data) => data.targetRequest?.requestCount ?? 0)),
                },
                companyRequests: {
                    ...inv?.site?.companyRequests,
                    orderRequests: {
                        items: draftData?.otherSide
                            ?.map((other) => {
                                return {
                                    ...other.targetRequest,
                                    requestedCompany: other.requestedCompany,
                                } as RequestType
                            })
                            .filter((data) => (data?.requestCount ?? 0) > 0),
                    },
                    totalRequests: {
                        items: uniqBy(
                            [
                                ...(draftData?.otherSide
                                    ?.map((other) => {
                                        return {
                                            ...other.targetRequest,
                                            requestedCompany: other.requestedCompany,
                                        } as RequestType
                                    })
                                    .filter((data) => (data?.requestCount ?? 0) > 0) ?? []),
                                ...(inv.site?.companyRequests?.totalRequests?.items ?? []),
                            ],
                            'requestId',
                        ),
                    },
                },
            },
        }
        return _invRequest
    }

    useEffect(() => {
        if (isFocused) {
            setDateUpdate(dateUpdate + 1)
        }

        return () => {
            setState(initialState)
            dispatch(setIsBottomOff(false))
        }
    }, [isFocused])

    useSafeUnmount(setState, initialState, () => setDateUpdate(dateUpdate + 1))

    /**
     * DB fetchして良いかどうか
     */
    const __isAvailable = useMemo(() => date != undefined && myCompanyId != undefined, [date, myCompanyId])

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        // __DEV__ && logger.logAccessInfo('1. mount時の副作用フック（ステートを初期化）')
        return () => setState(initialState)
    }, [myCompanyId])

    useEffect(() => {
        if (setDate && date && date?.totalSeconds != initDate?.totalSeconds) {
            setDate(date)
        }
        if (isFocused) {
            cachedKeyRef.current = genKeyName({
                screenName: 'DateRouter',
                accountId: signInUser?.accountId ?? '',
                companyId: myCompanyId ?? '',
                /** "/" はKVSのキーに使えない文字のため "-" に置き換え */
                date: date ? dayBaseTextWithoutDate(date).replace(/\//g, '-') : '',
            })
        }
    }, [date])

    //未手配と手配済みに分けてから合わせている理由は日付管理画面の手配タブにて、手配が0の現場を上に優先表示するため
    const displayData: (SiteType | InvRequestType)[] = useMemo(() => {
        if (displayIds?.length == 0 && draftData) {
            const _unArrangedSites = [
                ...(draftData?.draftDateData?.sites?.totalSites?.items ?? []).filter(
                    (site) =>
                        !(site.siteRelation == 'fake-company-manager' && site.fakeCompanyInvRequestId != undefined) &&
                        (site?.siteMeter?.companyPresentNum == undefined || site?.siteMeter?.companyPresentNum == 0),
                ),
                ...(draftData?.draftDateData?.invRequests?.totalInvRequests?.items ?? []).filter(
                    (data) => data.site?.siteMeter?.companyPresentNum == undefined || data.site?.siteMeter?.companyPresentNum == 0,
                ),
            ].sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0))
            const _arrangedSites = [
                ...(draftData?.draftDateData?.sites?.totalSites?.items ?? []).filter(
                    (site) =>
                        !(site.siteRelation == 'fake-company-manager' && site.fakeCompanyInvRequestId != undefined) && site?.siteMeter?.companyPresentNum && site?.siteMeter?.companyPresentNum > 0,
                ),
                ...(draftData?.draftDateData?.invRequests?.totalInvRequests?.items ?? []).filter((data) => data.site?.siteMeter?.companyPresentNum && data.site?.siteMeter?.companyPresentNum > 0),
            ].sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0))
            setState((prev) => ({
                ...prev,
                displayIds,
            }))
            const displayIds =
                ([..._unArrangedSites, ..._arrangedSites]?.map((data) => (data as InvRequestType)?.invRequestId ?? (data as SiteType)?.siteId).filter((data) => data != undefined) as string[]) ?? []
            return [..._unArrangedSites, ..._arrangedSites]
        } else {
            return [
                ...(draftData?.draftDateData?.sites?.totalSites?.items ?? []).filter((site) => !(site.siteRelation == 'fake-company-manager' && site.fakeCompanyInvRequestId != undefined)),
                ...(draftData?.draftDateData?.invRequests?.totalInvRequests?.items ?? []),
            ].sort((a, b) => {
                const indexA = displayIds?.indexOf((a as InvRequestType)?.invRequestId ?? ((a as SiteType)?.siteId as string)) ?? 0
                const indexB = displayIds?.indexOf((b as InvRequestType)?.invRequestId ?? ((b as SiteType)?.siteId as string)) ?? 0
                return indexA - indexB
            })
        }
    }, [draftData?.draftDateData, isArrangeMode])

    useEffect(() => {
        if (isDisplayTodo == false) {
            dispatch(setIsNavUpdating(true))
        }
    }, [isDisplayTodo])

    const _header = useMemo(() => {
        if (isArrangeMode) {
            return (
                <View
                    style={{
                        marginHorizontal: 10,
                    }}>
                    {siteArrangements != undefined && (
                        <AppButton
                            isGray={true}
                            height={25}
                            fontSize={12}
                            title={t('common:DuplicatePreviousArrangement')}
                            style={{
                                marginHorizontal: 10,
                                marginTop: 10,
                            }}
                            onPress={() => {
                                Alert.alert(t('common:OverwrittenByPreviousSite'), '', [
                                    { text: t('common:Superscription'), onPress: () => _setPreviousArrangements() },
                                    {
                                        text: t('common:Cancel'),
                                        style: 'cancel',
                                    },
                                ])
                            }}
                        />
                    )}
                </View>
            )
        }
        const todoCount = (toDoRequests?.length ?? 0) + (toDoInvRequests?.length ?? 0)
        const arrangedCount = draftData?.draftDateData?.arrangementSummary?.arrangedWorkersCount ?? 0
        return (
            <View>
                <View
                    style={{
                        paddingHorizontal: 10,
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: 63,
                    }}>
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}></View>
                    <View
                        style={{
                            paddingHorizontal: 10,
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}>
                        <IconParam
                            paramName={t('common:NoOfSites')}
                            onPress={() => {
                                navigation.push('ConstructionList', {
                                    targetDate: date,
                                })
                            }}
                            iconName={'site'}
                            count={dateData?.arrangementSummary?.sitesCount}
                        />
                        <IconParam
                            hasBorder={true}
                            paramName={t('common:Arrangements')}
                            suffix={t('common:Name')}
                            onPress={() => {
                                navigation.push('SelectCompany', {
                                    selectCompany: {
                                        withoutMyCompany: true,
                                        title: t('admin:CompanyRequestingSupport'),
                                    },
                                    initStartDate: date,
                                    routeNameFrom: 'DateArrangements',
                                    constructionIds: displayData
                                        .filter((data: DateArrangementType) => data.siteRelation != 'intermediation')
                                        .map((data: DateArrangementType) => data?.constructionId ?? data.site?.constructionId)
                                        .filter((data) => data != undefined) as string[],
                                })
                            }}
                            iconName={'worker'}
                            count={arrangedCount}
                        />
                    </View>
                    {todoCount > 0 && (
                        <Pressable
                            style={{
                                paddingHorizontal: 10,
                                flexDirection: 'row',
                            }}
                            onPress={() =>
                                setState((prev) => ({
                                    ...prev,
                                    isDisplayTodo: true,
                                }))
                            }>
                            <IconParam paramName={t('admin:unapproved')} iconName={'transaction'} withBatch={true} count={todoCount} />
                        </Pressable>
                    )}
                </View>
                <Line style={{ marginTop: 5 }} />
            </View>
        )
    }, [
        draftData?.draftDateData,
        displayData,
        dateData?.arrangementSummary?.sitesCount,
        dateData?.arrangementSummary?.arrangedWorkersCount,
        isArrangeMode,
        myCompanyId,
        date,
        siteArrangements,
        toDoRequests,
        toDoInvRequests,
    ])

    useEffect(() => {
        if (selectedId) {
            setState((prev) => ({
                ...prev,
                isArrangeMode: true,
            }))
        }
    }, [selectedId])

    const _footer = () =>
        useMemo(() => {
            return (
                <View style={{ marginBottom: 500 }}>
                    <BottomMargin />
                </View>
            )
        }, [])

    const _update = () => {
        setState((prev) => ({ ...prev, update: prev.update + 1 }))
    }

    const _setIsDeleting = (id?: string) => {
        if (id) {
            setState((prev) => ({ ...prev, deletingIds: [...(deletingIds ?? []), id] }))
            if (setDeletingIds) {
                setDeletingIds([...(deletingIds ?? []), id] ?? [])
            }
            dispatch(setIsNavUpdating(true))
        }
    }

    const _approveRequest = async (respondRequest: RequestType, _isApproval: boolean) => {
        try {
            dispatch(setLoading(true))
            const isApprovalResult = await updateRequestIsApproval({ requestId: respondRequest?.requestId, isApproval: _isApproval })
            if (isApprovalResult.error) {
                throw {
                    error: isApprovalResult.error,
                    errorCode: isApprovalResult.errorCode,
                }
            }
            const _dateArrangementData: DateSiteArrangementType = {
                ...dateSiteArrangement,
                request: {
                    ...dateSiteArrangement?.request,
                    isApproval: _isApproval,
                },
            }

            const _siteArrangements: DateSiteArrangementType[] = [...(siteArrangements?.filter((data) => data.site?.siteId != dateSiteArrangement?.siteId) ?? []), _dateArrangementData]
            setState((prev) => ({
                ...prev,
                update: update + 1,
                siteArrangements: _siteArrangements,
            }))
            const targetRequest = toDoRequests?.filter((request) => request?.siteId == respondRequest?.siteId)[0]
            //DateDataキャッシュを更新
            const _newSite: SiteType | undefined = targetRequest
                ? {
                      ...targetRequest.site,
                      companyRequests: {
                          receiveRequests: {
                              items: [...(targetRequest.site?.companyRequests?.receiveRequests?.items ?? [])].map((req) => {
                                  return { ...req, isApproval: _isApproval }
                              }),
                          },
                          totalRequests: {
                              items: [...(targetRequest.site?.companyRequests?.totalRequests?.items ?? [])].map((req) => {
                                  return { ...req, isApproval: _isApproval }
                              }),
                          },
                      },
                  }
                : undefined

            const newDateData: DateDataType = {
                ...dateData,
                sites: {
                    ...dateData?.sites,
                    totalSites: {
                        items: uniqBy([...(dateData?.sites?.totalSites?.items ?? []), _newSite], 'siteId').filter((data) => data != undefined) as SiteType[],
                    },
                },
                arrangementSummary: {
                    ...dateData?.arrangementSummary,
                    sitesCount: (dateData?.arrangementSummary?.sitesCount ?? 0) + (_isApproval ? 1 : 0),
                },
                updatedAt: Number(new Date()),
            }

            if (cachedKeyRef.current) {
                const cachedResult = await updateCachedData({ key: cachedKeyRef.current, value: newDateData })
                if (cachedResult.error) {
                    const _error = cachedResult as CustomResponse
                    dispatch(
                        setToastMessage({
                            text: getErrorToastMessage(_error),
                            type: 'error',
                        }),
                    )
                }
            }
            //この場合、dateDataを更新してリロードする必要があるので下書きの更新はいらない。リロードしないと追加した現場に下書き手配状況が反映されない。リロードはこのモーダルを閉じた時に実行される。
            if (toDoRequests?.length == 1 && (toDoInvRequests?.length ?? 0) == 0) {
                setState((prev) => ({
                    ...prev,
                    isDisplayTodo: false,
                }))
            } else if (setToDoRequests) {
                setToDoRequests(toDoRequests?.filter((data) => data.requestId != respondRequest?.requestId) ?? [])
            }
            dispatch(
                setToastMessage({
                    text: _isApproval ? t('admin:Approved') : t('admin:Disapproved'),
                    type: 'success',
                } as ToastMessage),
            )
            if (isFocused) {
                dispatch(setLoading(false))
            }
            const companyIdAndDate = toIdAndMonthFromTotalSeconds(respondRequest?.companyId, respondRequest?.date)
            addUpdateScreens({
                dispatch,
                localUpdateScreens,
                updateScreens: [
                    {
                        screenName: 'CompanyInvoice',
                        idAndDates: [companyIdAndDate],
                    },
                    {
                        screenName: 'SiteDetail',
                        ids: [respondRequest?.siteId].filter((data) => data != undefined) as string[],
                    },
                ],
            })
        } catch (error) {
            const _error = error as CustomResponse
            dispatch(
                setToastMessage({
                    text: getErrorToastMessage(_error),
                    type: 'error',
                } as ToastMessage),
            )
        } finally {
            if (isFocused) {
                dispatch(setLoading(false))
            }
        }
    }

    const _approveInvRequest = async (invRequest: InvRequestType, _isApproval: boolean) => {
        try {
            if (invRequest?.invRequestId == undefined) {
                throw {
                    error: 'IDがありません',
                    errorCode: 'APPROVE_INV_REQUEST',
                }
            }
            dispatch(setLoading(true))
            const isApprovalResult = await approveInvRequest({ invRequestId: invRequest?.invRequestId, isApproval: _isApproval })
            if (isApprovalResult.error) {
                dispatch(
                    setToastMessage({
                        text: isApprovalResult.error,
                    } as ToastMessage),
                )
            }

            //DateDataキャッシュを更新
            const _invRequest: InvRequestType = {
                ...invRequest,
                isApproval: _isApproval,
                invRequestStatus: _isApproval ? 'approval' : 'unauthorized',
            }
            const newDateData: DateDataType = {
                ...dateData,
                invRequests: {
                    ...dateData?.invRequests,
                    totalInvRequests: {
                        items: [
                            ...(dateData?.invRequests?.totalInvRequests?.items ?? []),
                            ...(toDoInvRequests?.filter((data) => data.invRequestId != _invRequest.invRequestId) ?? []),
                            _invRequest,
                        ].filter((data) => data != undefined) as InvRequestType[],
                    },
                    receiveInvRequests: {
                        items: [
                            ...(dateData?.invRequests?.receiveInvRequests?.items ?? []),
                            ...(toDoInvRequests?.filter((data) => data.invRequestId != _invRequest.invRequestId) ?? []),
                            _invRequest,
                        ].filter((data) => data != undefined) as InvRequestType[],
                    },
                },
                updatedAt: Number(new Date()),
            }
            if (cachedKeyRef.current) {
                const cachedResult = await updateCachedData({ key: cachedKeyRef.current, value: newDateData })
                if (cachedResult.error) {
                    const _error = cachedResult as CustomResponse
                    dispatch(
                        setToastMessage({
                            text: getErrorToastMessage(_error),
                            type: 'error',
                        }),
                    )
                }
            }
            if (toDoInvRequests?.length == 1 && (toDoRequests?.length ?? 0) == 0) {
                setState((prev) => ({
                    ...prev,
                    isDisplayTodo: false,
                }))
            } else if (setToDoInvRequests) {
                setToDoInvRequests(toDoInvRequests?.filter((data) => data.invRequestId != invRequest?.invRequestId) ?? [])
            }
            if (isFocused) {
                dispatch(setLoading(false))
            }
            dispatch(
                setToastMessage({
                    text: _isApproval ? t('admin:Approved') : t('admin:Disapproved'),
                    type: 'success',
                } as ToastMessage),
            )
            const companyIdAndDate = toIdAndMonthFromTotalSeconds(invRequest?.myCompanyId, invRequest?.date)
            addUpdateScreens({
                dispatch,
                localUpdateScreens,
                updateScreens: [
                    {
                        screenName: 'CompanyInvoice',
                        idAndDates: [companyIdAndDate],
                    },
                    {
                        screenName: 'InvRequestDetail',
                        ids: [invRequest?.invRequestId].filter((data) => data != undefined) as string[],
                    },
                ],
            })
        } catch (error) {
            const _error = error as CustomResponse
            dispatch(
                setToastMessage({
                    text: getErrorToastMessage(_error),
                    type: 'error',
                } as ToastMessage),
            )
        } finally {
            if (isFocused) {
                dispatch(setLoading(false))
            }
        }
    }

    //常用予約作成・削除と、自社作業員の追加くらいなので、そこはローカル更新で対応する。あとは現場の編集もだ。
    useEffect(() => {
        ;(async () => {
            try {
                if (!isFocused) return
                if ((date == undefined && initDate == undefined) || myCompanyId == undefined) {
                    return
                }
                if (isSiteArrangeFetching == false) {
                    return
                }

                dispatch(setLoading(true))
                /**
                 * 下書きの手配情報がサーバー側のデータによって書き換えられた際にtrueとなる。
                 * trueになった場合、draftDateDataを更新する。
                 */
                let isUpdated = false
                const __siteArrangements: (DateSiteArrangementType | undefined)[] = await Promise.all(
                    draftData?.draftDateData?.sites?.totalSites?.items
                        ?.filter(
                            //他社現場からの常用依頼で、自社が承認していない場合は表示しない。
                            (site) => !(site.siteRelation == 'other-company' && site.companyRequests?.receiveRequests?.items && site.companyRequests?.receiveRequests?.items[0]?.isApproval != true),
                        )
                        ?.map(async (site) => {
                            const result = await getSiteArrangement({
                                companyId: myCompanyId,
                                date: getDailyStartTime(date ?? (initDate as CustomDate)).totalSeconds,
                                siteId: site?.siteId,
                            })
                            let siteArrangement = result.success
                            if (siteArrangement?.site?.fakeCompanyInvRequestId != undefined) {
                                return undefined
                            }
                            const arrCachedKey = genKeyName({
                                screenName: 'SiteArrangement',
                                accountId: signInUser?.accountId as string,
                                companyId: myCompanyId as string,
                                siteId: site?.siteId as string,
                            })
                            const siteArrangementCacheData = await getCachedData<SiteArrangementModel>(arrCachedKey)
                            if (siteArrangementCacheData.success) {
                                if (siteArrangementCacheData.success.updatedAt && siteArrangement?.updatedAt && siteArrangementCacheData.success.updatedAt > siteArrangement.updatedAt) {
                                    // キャッシュよりDBが古い場合、更新しない
                                    siteArrangement = siteArrangementCacheData.success
                                }
                            }

                            if (siteArrangement == undefined) {
                                return undefined
                            }
                            siteArrangement = {
                                ...siteArrangement,
                                siteArrangementData: {
                                    ...siteArrangement?.siteArrangementData,
                                    selfSide: siteArrangement.siteArrangementData?.selfSide?.map((self) => {
                                        const _self: SiteArrangementWorkerType = {
                                            ...self,
                                            //稼働数がダブるので
                                            dailyArrangements: { items: self.dailyArrangements?.items?.filter((data) => data.site?.fakeCompanyInvRequestId == undefined) },
                                        }
                                        return _self
                                    }),
                                },
                            }
                            const respondRequest = siteArrangement?.request
                            const _setting =
                                respondRequest == undefined
                                    ? (match(siteArrangement?.siteArrangementData?.siteRelation)
                                          .with('intermediation', 'owner', 'order-children', () => ({
                                              hideArrangeableWorkers: true,
                                              perspective: 'other-company',
                                          }))
                                          .with('manager', 'fake-company-manager', () => ({}))
                                          .with('other-company', () => ({
                                              displayNothing: true,
                                          }))
                                          .otherwise(() => ({
                                              displayNothing: true,
                                          })) as SiteManageSetting)
                                    : {
                                          hideCopyHistory: true,
                                      }

                            const targetDraft = draftData.draftSiteArrangements?.find(
                                (draft) =>
                                    draft?.siteArrangementId ==
                                    (site.siteRelation == 'manager' ? site?.siteId : site.companyRequests?.receiveRequests?.items && site.companyRequests?.receiveRequests?.items[0]?.requestId),
                            )
                            const updateData = await updateDraftData({
                                draftData: targetDraft,
                                updateData: siteArrangement?.siteArrangementData,
                                draftMeter: targetDraft?.meter,
                                updateMeter: siteArrangement?.targetMeter,
                                deleteSiteIds: deletingIds,
                                siteArrangementIds: [
                                    ...((draftData?.draftDateData?.sites?.totalSites?.items
                                        ?.map((_site) =>
                                            _site?.siteRelation == 'manager'
                                                ? _site?.siteId
                                                : _site?.companyRequests?.receiveRequests?.items && _site.companyRequests?.receiveRequests?.items[0]?.requestId,
                                        )
                                        .filter((data) => data != undefined) as string[]) ?? []),
                                    ...((draftData?.draftDateData?.invRequests?.orderInvRequests?.items?.map((inv) => inv?.invRequestId).filter((data) => data != undefined) as string[]) ?? []),
                                ],
                                arrDrafts: draftData?.draftSiteArrangements,
                                invDrafts: draftData?.daftInvRequestArrangements,
                            })
                            const _dateArrangementData: DateSiteArrangementType = {
                                ...siteArrangement,
                                keepSiteArrangementData: cloneDeep(siteArrangement?.siteArrangementData),
                                setting: _setting,
                                cantManage: _setting?.hideArrangeableWorkers == true || _setting?.displayNothing == true || _setting == undefined,
                                site: siteArrangement?.site,
                                siteArrangementData: updateData.targetArrangementData,
                                localPresentNum: updateData?.targetMeter?.companyPresentNum,
                                targetMeter: updateData.targetMeter,
                            }
                            if (updateData?.isUpdated) {
                                isUpdated = true
                                //ここで更新フラグをつけても下書きが更新されていないとdraftDateDataが最新状況を反映できないため更新。この場合以外でも更新しても問題ないが、更新するメリットがなく時間がかかるので更新しない。
                                const result = await writeLocalSiteArrangement({
                                    siteArrangement: _dateArrangementData.siteArrangementData,
                                    siteArrangementId: _dateArrangementData?.request?.requestId ?? _dateArrangementData?.siteId,
                                    meter: _dateArrangementData.targetMeter,
                                    companyRequiredNum: _dateArrangementData?.request?.requestCount ?? _dateArrangementData.site?.requiredNum,
                                })
                                if (result.error) {
                                    throw {
                                        error: result.error,
                                        errorCode: result.errorCode,
                                    }
                                }
                            }
                            const cachedResult = await updateCachedData({ key: arrCachedKey, value: _dateArrangementData ?? {} })
                            if (cachedResult.error) {
                                const _error = cachedResult as CustomResponse
                                dispatch(
                                    setToastMessage({
                                        text: getErrorToastMessage(_error),
                                        type: 'error',
                                    }),
                                )
                            }
                            return _dateArrangementData
                        }) ?? [],
                )
                const _siteArrangements = __siteArrangements.filter((data) => data != undefined) as DateSiteArrangementType[]

                setState((prev) => ({
                    ...prev,
                    siteArrangements: _siteArrangements,
                    isSiteDraftUpdate: isUpdated,
                }))
            } catch (error) {
                const _error = error as CustomResponse
                dispatch(
                    setToastMessage({
                        text: getErrorToastMessage(_error),
                        type: 'error',
                    } as ToastMessage),
                )
            } finally {
                if (isFocused) {
                    setState((prev) => ({
                        ...prev,
                        isSiteArrangeFetching: false,
                    }))
                    dispatch(setLoading(false))
                    dispatch(setIsNavUpdating(false))
                }
            }
        })()
    }, [isSiteArrangeFetching])

    /**
     * 下書きの手配情報がサーバー側のデータによって書き換えられた際に下書きを持っていない現場の手配を更新する。
     */
    useEffect(() => {
        ;(async () => {
            try {
                if (!isFocused && !isSiteDraftUpdate && !isInvDraftUpdate) return
                const draftSelf =
                    (draftData?.draftSiteArrangements && draftData?.draftSiteArrangements[0]?.selfSide) ?? (draftData?.daftInvRequestArrangements && draftData?.daftInvRequestArrangements[0]?.selfSide)
                if (draftSelf == undefined) {
                    return
                }
                const __siteArrangements: (DateSiteArrangementType | undefined)[] = await Promise.all(
                    siteArrangements?.map(async (siteArrangement) => {
                        if (siteArrangement == undefined) {
                            return undefined
                        }
                        const siteArrangementId = siteArrangement.request?.requestId ?? siteArrangement?.siteId
                        if (draftData?.draftSiteArrangements?.find((draft) => draft?.siteArrangementId == siteArrangementId)) {
                            return siteArrangement
                        }

                        const _dateArrangementData: DateSiteArrangementType = {
                            ...siteArrangement,
                            keepSiteArrangementData: cloneDeep(siteArrangement?.siteArrangementData),
                            siteArrangementData: {
                                ...siteArrangement?.siteArrangementData,
                                selfSide:
                                    siteArrangement.siteArrangementData?.selfSide?.map((self) => {
                                        const _self = draftSelf.find((draft) => draft?.worker?.workerId == self?.worker?.workerId)
                                        return {
                                            ...self,
                                            dailyArrangements: _self?.dailyArrangements,
                                            dailyInvRequests: _self?.dailyInvRequests,
                                        }
                                    }) ?? [],
                            },
                        }
                        const arrCachedKey = genKeyName({
                            screenName: 'SiteArrangement',
                            accountId: signInUser?.accountId as string,
                            companyId: myCompanyId as string,
                            siteId: siteArrangement?.siteId as string,
                        })
                        const cachedResult = await updateCachedData({ key: arrCachedKey, value: _dateArrangementData ?? {} })
                        if (cachedResult.error) {
                            const _error = cachedResult as CustomResponse
                            dispatch(
                                setToastMessage({
                                    text: getErrorToastMessage(_error),
                                    type: 'error',
                                }),
                            )
                        }
                        return _dateArrangementData
                    }) ?? [],
                )
                const _siteArrangements = __siteArrangements.filter((data) => data != undefined) as DateSiteArrangementType[]
                const __invRequestArrangements: (DateInvRequestArrangementType | undefined)[] = await Promise.all(
                    invRequestArrangements?.map(async (invRequestArrangement) => {
                        if (invRequestArrangement == undefined) {
                            return undefined
                        }
                        const siteArrangementId = invRequestArrangement.invRequestId
                        if (draftData?.daftInvRequestArrangements?.find((draft) => draft?.siteArrangementId == siteArrangementId)) {
                            return invRequestArrangement
                        }

                        const _dateArrangementData: DateInvRequestArrangementType = {
                            ...invRequestArrangement,
                            keepInvRequestArrangementData: cloneDeep(invRequestArrangement?.keepInvRequestArrangementData),
                            invRequestArrangementData: {
                                ...invRequestArrangement?.invRequestArrangementData,
                                selfSide:
                                    invRequestArrangement.invRequestArrangementData?.selfSide?.map((self) => {
                                        const _self = draftSelf.find((draft) => draft?.worker?.workerId == self?.worker?.workerId)
                                        return {
                                            ...self,
                                            dailyArrangements: _self?.dailyArrangements,
                                            dailyInvRequests: _self?.dailyInvRequests,
                                        }
                                    }) ?? [],
                            },
                        }
                        const arrCachedKey = genKeyName({
                            screenName: 'InvRequestArrangement',
                            accountId: signInUser?.accountId as string,
                            companyId: myCompanyId as string,
                            invRequestId: invRequestArrangement?.invRequestId as string,
                        })
                        const cachedResult = await updateCachedData({ key: arrCachedKey, value: _dateArrangementData ?? {} })
                        if (cachedResult.error) {
                            const _error = cachedResult as CustomResponse
                            dispatch(
                                setToastMessage({
                                    text: getErrorToastMessage(_error),
                                    type: 'error',
                                }),
                            )
                        }
                        return _dateArrangementData
                    }) ?? [],
                )
                const _invRequestArrangements = __invRequestArrangements.filter((data) => data != undefined) as DateInvRequestArrangementType[]
                setState((prev) => ({
                    ...prev,
                    siteArrangements: _siteArrangements,
                    invRequestArrangements: _invRequestArrangements,
                }))
            } catch (error) {
                const _error = error as CustomResponse
                dispatch(
                    setToastMessage({
                        text: getErrorToastMessage(_error),
                        type: 'error',
                    } as ToastMessage),
                )
            }
        })()
    }, [isSiteDraftUpdate, isInvDraftUpdate])

    useEffect(() => {
        ;(async () => {
            try {
                if (myCompanyId == undefined || !isFocused) {
                    return
                }
                dispatch(setLoading(true))

                /**
                 * 下書きの手配情報がサーバー側のデータによって書き換えられた際にtrueとなる。
                 * trueになった場合、draftDateDataを更新する。
                 */
                let isUpdated = false
                const targetInvRequestIds =
                    draftData?.draftDateData?.invRequests?.totalInvRequests?.items
                        ?.filter((item) => item.myCompanyId == myCompanyId)
                        .map((item) => item.invRequestId)
                        ?.filter((data) => data != undefined) ?? []
                if (targetInvRequestIds.length > 0) {
                    if (isInvArrangeFetching == false) {
                        return
                    }
                    const __invRequestArrangements: (DateInvRequestArrangementType | undefined)[] = await Promise.all(
                        draftData?.draftDateData?.invRequests?.totalInvRequests?.items?.map(async (inv) => {
                            const result = await getInvRequestArrangement({
                                companyId: myCompanyId,
                                invRequestId: inv?.invRequestId,
                            })
                            let invRequestArrangement = result.success
                            const arrCachedKey = genKeyName({
                                screenName: 'InvRequestArrangement',
                                accountId: signInUser?.accountId as string,
                                companyId: myCompanyId as string,
                                invRequestId: inv?.invRequestId as string,
                            })
                            const invRequestArrangementCacheData = await getCachedData<InvRequestArrangementModel>(arrCachedKey)
                            if (invRequestArrangementCacheData.success) {
                                if (
                                    invRequestArrangementCacheData.success.updatedAt &&
                                    invRequestArrangement?.updatedAt &&
                                    invRequestArrangementCacheData.success.updatedAt > invRequestArrangement.updatedAt
                                ) {
                                    // キャッシュよりDBが古い場合、更新しない
                                    invRequestArrangement = invRequestArrangementCacheData.success
                                }
                            }
                            if (invRequestArrangement == undefined) return undefined
                            invRequestArrangement = {
                                ...invRequestArrangement,
                                invRequestArrangementData: {
                                    ...invRequestArrangement?.invRequestArrangementData,
                                    selfSide: invRequestArrangement.invRequestArrangementData?.selfSide?.map((self) => {
                                        const _self: SiteArrangementWorkerType = {
                                            ...self,
                                            //稼働数がダブるので
                                            dailyArrangements: { items: self.dailyArrangements?.items?.filter((data) => data.site?.fakeCompanyInvRequestId == undefined) },
                                        }
                                        return _self
                                    }),
                                },
                            }
                            const _setting: SiteManageSetting = {
                                hideMeter: false,
                                hideArrangeableWorkers: invRequestArrangement?.invRequest?.myCompanyId == myCompanyId ? false : true,
                                hideCopyHistory: true,
                                // perspective?: "my-company" | "other-company" | undefined;
                                displayNothing: false,
                            }
                            const _invRequestArrangement: InvRequestArrangementModel = {
                                ...invRequestArrangement,
                                ...(invRequestArrangement?.fakeSite
                                    ? {
                                          fakeSite: {
                                              ...invRequestArrangement?.fakeSite,
                                              siteNameData: {
                                                  ...invRequestArrangement.fakeSite?.siteNameData,
                                                  construction: undefined,
                                                  project: undefined,
                                              },
                                          },
                                      }
                                    : {}),
                                targetMeter: {
                                    ...invRequestArrangement?.targetMeter,
                                    presentArrangements: undefined,
                                    presentRequests: undefined,
                                },
                            }
                            const targetDraft = draftData.daftInvRequestArrangements?.find((draft) => draft?.siteArrangementId == inv?.invRequestId)
                            const updateData = await updateDraftData({
                                draftData: targetDraft,
                                updateData: invRequestArrangement?.invRequestArrangementData,
                                draftMeter: targetDraft?.meter,
                                updateMeter: invRequestArrangement?.targetMeter,
                                deleteSiteIds: deletingIds,
                                siteArrangementIds: [
                                    ...((draftData?.draftDateData?.sites?.totalSites?.items
                                        ?.map((_site) =>
                                            _site.siteRelation == 'manager'
                                                ? _site?.siteId
                                                : _site.companyRequests?.receiveRequests?.items && _site.companyRequests?.receiveRequests?.items[0]?.requestId,
                                        )
                                        .filter((data) => data != undefined) as string[]) ?? []),
                                    ...((draftData.draftDateData?.invRequests?.orderInvRequests?.items?.map((inv) => inv.invRequestId).filter((data) => data != undefined) as string[]) ?? []),
                                ],
                                arrDrafts: draftData?.draftSiteArrangements,
                                invDrafts: draftData?.daftInvRequestArrangements,
                            })
                            const updateSelfSideWorkers = updateData?.targetArrangementData?.selfSide?.map((data) => data).filter((worker) => worker.targetInvRequest?.invRequestId != undefined)
                            const _updateInvRequest = updateSelfSideWorkers?.map((side) => side.targetInvRequest).filter((data) => data != undefined)[0] ?? _invRequestArrangement.invRequest
                            const updateInvRequest: InvRequestType = {
                                ..._updateInvRequest,
                                workers: {
                                    items: updateSelfSideWorkers
                                        ?.filter((side) => side.targetInvRequest != undefined)
                                        .map((side) => side.worker)
                                        .filter((data) => data != undefined) as WorkerType[],
                                },
                            }
                            const keepArrangement = cloneDeep(_invRequestArrangement?.invRequestArrangementData)

                            const _dateArrangementData: DateInvRequestArrangementType = {
                                ...invRequestArrangement,
                                keepInvRequestArrangementData: keepArrangement,
                                setting: _setting,
                                cantManage: _setting?.hideArrangeableWorkers == true || _setting?.displayNothing == true || _setting == undefined,
                                localPresentNum: updateData?.targetMeter?.companyPresentNum,
                                invRequestArrangementData: updateData?.targetArrangementData,
                                targetMeter: updateData?.targetMeter,
                                invRequest: updateInvRequest,
                                fakeSite: _invRequestArrangement?.fakeSite,
                                respondRequest: _invRequestArrangement?.respondRequest,
                            }
                            if (updateData?.isUpdated) {
                                isUpdated = true
                                //ここで更新フラグをつけても下書きが更新されていないとdraftDateDataが最新状況を反映できないため更新。この場合以外でも更新しても問題ないが、更新するメリットがなく時間がかかるので更新しない。
                                const result = await writeLocalSiteArrangement({
                                    siteArrangement: _dateArrangementData.invRequestArrangementData,
                                    siteArrangementId: _dateArrangementData?.invRequestId,
                                    meter: _dateArrangementData.targetMeter,
                                    companyRequiredNum: _dateArrangementData?.invRequest?.workerCount,
                                })
                                if (result.error) {
                                    throw {
                                        error: result.error,
                                        errorCode: result.errorCode,
                                    }
                                }
                            }
                            const cachedResult = await updateCachedData({ key: arrCachedKey, value: _dateArrangementData ?? {} })
                            if (cachedResult.error) {
                                const _error = cachedResult as CustomResponse
                                dispatch(
                                    setToastMessage({
                                        text: getErrorToastMessage(_error),
                                        type: 'error',
                                    }),
                                )
                            }
                            return _dateArrangementData
                        }) ?? [],
                    )
                    const _invRequestArrangements = __invRequestArrangements.filter((data) => data != undefined) as DateInvRequestArrangementType[]

                    setState((prev) => ({
                        ...prev,
                        invRequestArrangements: _invRequestArrangements,
                        isInvDraftUpdate: isUpdated,
                    }))
                }
            } catch (error) {
                const _error = error as CustomResponse
                dispatch(
                    setToastMessage({
                        text: getErrorToastMessage(_error),
                        type: 'error',
                    } as ToastMessage),
                )
            } finally {
                if (isFocused) {
                    setState((prev) => ({
                        ...prev,
                        isInvArrangeFetching: false,
                    }))
                    dispatch(setLoading(false))
                    dispatch(setIsNavUpdating(false))
                }
            }
        })()
    }, [isInvArrangeFetching])

    const _content: ListRenderItem<DateArrangementType> = (info: ListRenderItemInfo<DateArrangementType>) => {
        const { item, index } = info
        const site = item
        const invRequest = item
        const isReceive = invRequest.targetCompanyId == myCompanyId ? true : false

        if (
            isArrangeMode &&
            selectedId != undefined &&
            (site.siteId == selectedId || invRequest.invRequestId == selectedId) &&
            //作業指示が存在する場合は手配編集画面が表示されない
            dateSiteArrangement?.instruction?.instructionStatus !== 'created' &&
            dateSiteArrangement?.instruction?.instructionStatus !== 'edited' &&
            dateSiteArrangement?.instruction?.instructionStatus !== 'deleted'
        ) {
            return (
                <>
                    <DateSiteArrangementManage
                        style={{
                            marginHorizontal: 10,
                            marginTop: 10,
                        }}
                        siteArrangements={siteArrangements}
                        invRequestArrangements={invRequestArrangements}
                        dateSiteArrangement={dateSiteArrangement}
                        dateInvRequestArrangement={dateInvRequestArrangement}
                        site={item.siteId ? site : undefined}
                        invRequest={item.invRequestId ? invRequest : undefined}
                        routeNameFrom="DateArrangements"
                        displayDetail={(type, item) => {
                            setState((prev) => ({ ...prev, arrangementDetail: { type, [type]: { ...item } } }))
                        }}
                        onPress={(arrangementData) => {
                            const __draftDateData = onPressWorkerOrCompany('other')
                            dateInvRequestArrangement
                                ? setState((prev) => ({
                                      ...prev,
                                      invRequestArrangements: [
                                          ...(invRequestArrangements?.filter((data) => data.invRequestArrangementId != dateInvRequestArrangement.invRequestArrangementId) ?? []),
                                          {
                                              ...arrangementData,
                                              localPresentNum: Math.max(0, (dateInvRequestArrangement?.localPresentNum ?? 0) - 1),
                                          },
                                      ],
                                      draftData: {
                                          ...draftData,
                                          draftDateData: __draftDateData,
                                      },
                                      update: update + 1,
                                  }))
                                : dateSiteArrangement &&
                                  setState((prev) => ({
                                      ...prev,
                                      siteArrangements: [
                                          ...(siteArrangements?.filter((data) => data.siteArrangementId != dateSiteArrangement.siteArrangementId) ?? []),
                                          {
                                              ...arrangementData,
                                              localPresentNum: Math.max(0, (dateSiteArrangement?.localPresentNum ?? 0) - 1),
                                          },
                                      ],
                                      draftData: {
                                          ...draftData,
                                          draftDateData: __draftDateData,
                                      },
                                      update: update + 1,
                                  }))
                        }}
                        onPressSelf={(updateSiteArrangementsData: DateSiteArrangementType[], updateInvArrangementsData: DateSiteArrangementType[]) => {
                            const __draftDateData = onPressWorkerOrCompany('self')
                            setState((prev) => ({
                                ...prev,
                                draftData: {
                                    ...draftData,
                                    draftDateData: __draftDateData,
                                },
                                siteArrangements: updateSiteArrangementsData,
                                invRequestArrangements: updateInvArrangementsData,
                                update: update + 1,
                            }))
                        }}
                        update={update}
                        onUpdate={_update}
                    />
                </>
            )
        } else {
            return (
                <View>
                    {item.siteId && (
                        <>
                            <DateArrangement
                                style={{
                                    marginHorizontal: 10,
                                    marginTop: 10,
                                }}
                                key={site?.siteId ?? index}
                                data={site}
                                routeNameFrom="DateArrangements"
                                dateCacheKey={cachedKeyRef.current as string}
                                adminHomeCacheKey={adminHomeCacheKeyRef.current as string}
                                date={date}
                                update={_update}
                                isDeleting={site?.siteId && deletingIds?.includes(site?.siteId) ? true : false}
                                setIsDeleting={_setIsDeleting}
                                onPress={() => {
                                    scrollToIndex(index)
                                    setState((prev) => ({
                                        ...prev,
                                        selectedId: item.siteId,
                                    }))
                                }}
                            />
                        </>
                    )}
                    {
                        /**
                         * 常用を受ける側は、未申請を非表示にする。
                         */
                        item.invRequestId && (!isReceive || (invRequest.isApplication == true && invRequest.isApproval != false)) && (
                            <InvRequestWithSites
                                style={{
                                    marginHorizontal: 10,
                                    marginTop: 10,
                                }}
                                key={invRequest?.invRequestId ?? index}
                                invRequest={invRequest}
                                myCompanyId={myCompanyId}
                                contentsType={'arrangement'}
                                onPress={() => {
                                    scrollToIndex(index)
                                    setState((prev) => ({
                                        ...prev,
                                        selectedId: item.invRequestId,
                                    }))
                                }}
                            />
                        )
                    }
                </View>
            )
        }
    }

    /**
     * タップした現場までスクロールする
     * @param index
     */
    const scrollToIndex = (index: number) => {
        flatListRef.current?.scrollToIndex({ index, animated: true, viewOffset: 120 })
    }

    /**
     * 手配変更時にシャローコピーによって変更された手配情報をもとにdraftDateDataを更新する。
     */
    const onPressWorkerOrCompany = (side: 'self' | 'other') => {
        const targetSite = draftData?.draftDateData?.sites?.totalSites?.items?.find((site) => site.siteId == dateSiteArrangement?.siteId)
        const targetInvRequest = draftData?.draftDateData?.invRequests?.totalInvRequests?.items?.find((inv) => inv.invRequestId == dateInvRequestArrangement?.invRequestId)
        const _presentArrangements =
            (dateSiteArrangement?.siteArrangementData?.selfSide
                ?.filter((self) => self.targetArrangement != undefined)
                .map((data) => {
                    return {
                        ...data?.targetArrangement,
                        worker: data?.worker,
                    }
                })
                .filter((data) => data != undefined) as ArrangementType[]) ??
            (dateInvRequestArrangement?.invRequestArrangementData?.selfSide
                ?.filter((self) => self.targetInvRequest != undefined)
                .map((data) => {
                    return {
                        ...data?.targetInvRequest,
                        worker: data?.worker,
                    }
                })
                .filter((data) => data != undefined) as ArrangementType[])

        const _presentRequests =
            (dateSiteArrangement?.siteArrangementData?.otherSide
                ?.filter((other) => (other.targetRequest?.requestCount ?? 0) > 0)
                .map((data) => {
                    return {
                        ...data?.targetRequest,
                        requestedCompany: data?.requestedCompany,
                    } as RequestType
                })
                .filter((data) => data != undefined) as RequestType[]) ??
            (dateInvRequestArrangement?.invRequestArrangementData?.otherSide
                ?.filter((other) => (other.targetRequest?.requestCount ?? 0) > 0)
                .map((data) => {
                    return {
                        ...data?.targetRequest,
                        requestedCompany: data?.requestedCompany,
                    } as RequestType
                })
                .filter((data) => data != undefined) as RequestType[])

        const __draftDateData: DateDataType = {
            ...draftData?.draftDateData,
            sites: {
                ...draftData?.draftDateData?.sites,
                totalSites: {
                    items: uniqBy(
                        [
                            targetSite
                                ? ({
                                      ...targetSite,
                                      siteArrangementData: {
                                          //ここを更新しても、表示には影響ない。しかし、dateDataでここ持っているのならば、すべてのデータをdateDataで統一して、SiteArrangementやInvRequestSSGをなくすことができそう。
                                          ...targetSite?.siteArrangementData,
                                          ...dateSiteArrangement?.siteArrangementData,
                                      },
                                      allArrangements: {
                                          //手配数カウント用に更新
                                          items:
                                              side == 'self'
                                                  ? uniqBy(
                                                        [..._presentArrangements, ...(targetSite?.allArrangements?.items?.filter((data) => data.createCompanyId != myCompanyId) ?? [])],
                                                        'arrangementId',
                                                    )
                                                  : targetSite?.allArrangements?.items,
                                      },
                                      siteMeter: {
                                          ...targetSite?.siteMeter,
                                          companyPresentNum: _presentArrangements.length + sum(_presentRequests?.filter((req) => req != undefined).map((req) => req.requestCount ?? 0)),
                                          presentArrangements: {
                                              items: _presentArrangements,
                                          },
                                          presentRequests: {
                                              items: _presentRequests,
                                          },
                                      },
                                      companyRequests: {
                                          ...targetSite?.companyRequests,
                                          receiveRequests: {
                                              items:
                                                  targetSite.companyRequests?.receiveRequests?.items && targetSite.companyRequests?.receiveRequests?.items[0]
                                                      ? [
                                                            {
                                                                ...targetSite.companyRequests?.receiveRequests?.items[0],
                                                                requestMeter: {
                                                                    ...targetSite.companyRequests?.receiveRequests?.items[0]?.requestMeter,
                                                                    companyPresentNum:
                                                                        _presentArrangements.length + sum(_presentRequests?.filter((req) => req != undefined).map((req) => req.requestCount ?? 0)),
                                                                    presentArrangements: {
                                                                        items: _presentArrangements,
                                                                    },
                                                                    presentRequests: {
                                                                        items: _presentRequests,
                                                                    },
                                                                },
                                                            } as RequestType,
                                                        ]
                                                      : [],
                                          },
                                          totalRequests: {
                                              items:
                                                  (targetSite.companyRequests?.totalRequests?.items?.filter((req) => req.requestedCompanyId == myCompanyId).length ?? 0) > 0
                                                      ? [
                                                            ...(targetSite.companyRequests?.totalRequests?.items ?? []),
                                                            {
                                                                ...targetSite.companyRequests?.totalRequests?.items?.find((req) => req.requestedCompanyId == myCompanyId),
                                                                requestMeter: {
                                                                    ...targetSite.companyRequests?.totalRequests?.items?.find((req) => req.requestedCompanyId == myCompanyId)?.requestMeter,
                                                                    companyPresentNum:
                                                                        _presentArrangements.length + sum(_presentRequests?.filter((req) => req != undefined).map((req) => req.requestCount ?? 0)),
                                                                    presentArrangements: {
                                                                        items: _presentArrangements,
                                                                    },
                                                                    presentRequests: {
                                                                        items: _presentRequests,
                                                                    },
                                                                },
                                                            } as RequestType,
                                                        ]
                                                      : targetSite.companyRequests?.totalRequests?.items,
                                          },
                                          orderRequests: {
                                              items: _presentRequests,
                                          },
                                      },
                                  } as SiteType)
                                : undefined,
                            ...(draftData?.draftDateData?.sites?.totalSites?.items ?? []),
                        ].filter((data) => data != undefined) as SiteType[],
                        'siteId',
                    ),
                },
            },
            invRequests: {
                orderInvRequests: {
                    items: uniqBy(
                        [
                            targetInvRequest
                                ? {
                                      ...targetInvRequest,
                                      workerIds: side == 'self' ? dateInvRequestArrangement?.invRequest?.workerIds ?? [] : targetInvRequest?.workerIds,
                                      workers: side == 'self' ? dateInvRequestArrangement?.invRequest?.workers ?? [] : targetInvRequest.workers,
                                      site: {
                                          ...targetInvRequest?.site,
                                          siteMeter: {
                                              ...targetInvRequest?.site?.siteMeter,
                                              companyPresentNum: (_presentArrangements?.length ?? 0) + sum(_presentRequests?.filter((req) => req != undefined).map((req) => req.requestCount ?? 0)),
                                          },
                                          companyRequests:
                                              side == 'other'
                                                  ? {
                                                        ...targetInvRequest?.site?.companyRequests,
                                                        orderRequests: {
                                                            //これは更新されていない
                                                            // items: dateInvRequestArrangement?.fakeSite?.companyRequests?.orderRequests?.items ?? [],
                                                            items: dateInvRequestArrangement?.invRequestArrangementData?.otherSide
                                                                ?.map((other) => {
                                                                    return {
                                                                        ...other.targetRequest,
                                                                        requestedCompany: other.requestedCompany,
                                                                    } as RequestType
                                                                })
                                                                .filter((data) => (data?.requestCount ?? 0) > 0),
                                                        },
                                                        totalRequests: {
                                                            // items: dateInvRequestArrangement?.fakeSite?.companyRequests?.totalRequests?.items ?? [],
                                                            items: uniqBy(
                                                                [
                                                                    ...(dateInvRequestArrangement?.invRequestArrangementData?.otherSide
                                                                        ?.map((other) => {
                                                                            return {
                                                                                ...other.targetRequest,
                                                                                requestedCompany: other.requestedCompany,
                                                                            } as RequestType
                                                                        })
                                                                        .filter((data) => (data?.requestCount ?? 0) > 0) ?? []),
                                                                    ...(targetInvRequest.site?.companyRequests?.totalRequests?.items ?? []),
                                                                ],
                                                                'requestId',
                                                            ),
                                                        },
                                                    }
                                                  : targetInvRequest.site?.companyRequests,
                                      },
                                      attendances: targetInvRequest.attendances?.map((att) => {
                                          return {
                                              ...att,
                                              arrangement: {
                                                  ...att.arrangement,
                                                  site: {
                                                      ...att.arrangement?.site,
                                                      siteMeter: {
                                                          ...att.arrangement?.site?.siteMeter,
                                                          companyPresentNum: side == 'self' ? dateInvRequestArrangement?.invRequest?.workerIds?.length : targetInvRequest?.workerIds?.length,
                                                      },
                                                  },
                                              },
                                          }
                                      }),
                                  }
                                : undefined,
                            ...(draftData?.draftDateData?.invRequests?.orderInvRequests?.items ?? []),
                        ].filter((data) => data != undefined) as InvRequestType[],
                        'invRequestId',
                    ),
                },
                totalInvRequests: {
                    items: uniqBy(
                        [
                            targetInvRequest
                                ? {
                                      ...targetInvRequest,
                                      workerIds: side == 'self' ? dateInvRequestArrangement?.invRequest?.workerIds ?? [] : targetInvRequest?.workerIds,
                                      workers: side == 'self' ? dateInvRequestArrangement?.invRequest?.workers ?? [] : targetInvRequest.workers,
                                      site: {
                                          ...targetInvRequest?.site,
                                          siteMeter: {
                                              ...targetInvRequest?.site?.siteMeter,
                                              companyPresentNum: (_presentArrangements?.length ?? 0) + sum(_presentRequests?.filter((req) => req != undefined).map((req) => req.requestCount ?? 0)),
                                          },
                                          companyRequests:
                                              side == 'other'
                                                  ? {
                                                        ...targetInvRequest?.site?.companyRequests,
                                                        orderRequests: {
                                                            //↓これは更新されていない
                                                            // items: dateInvRequestArrangement?.fakeSite?.companyRequests?.orderRequests?.items ?? [],
                                                            items: dateInvRequestArrangement?.invRequestArrangementData?.otherSide
                                                                ?.map((other) => {
                                                                    return {
                                                                        ...other.targetRequest,
                                                                        requestedCompany: other.requestedCompany,
                                                                    } as RequestType
                                                                })
                                                                .filter((data) => (data?.requestCount ?? 0) > 0),
                                                        },
                                                        totalRequests: {
                                                            // items: dateInvRequestArrangement?.fakeSite?.companyRequests?.totalRequests?.items ?? [],
                                                            items: uniqBy(
                                                                [
                                                                    ...(dateInvRequestArrangement?.invRequestArrangementData?.otherSide
                                                                        ?.map((other) => {
                                                                            return {
                                                                                ...other.targetRequest,
                                                                                requestedCompany: other.requestedCompany,
                                                                            } as RequestType
                                                                        })
                                                                        .filter((data) => (data?.requestCount ?? 0) > 0) ?? []),
                                                                    ...(targetInvRequest.site?.companyRequests?.totalRequests?.items ?? []),
                                                                ],
                                                                'requestId',
                                                            ),
                                                        },
                                                    }
                                                  : targetInvRequest.site?.companyRequests,
                                      },
                                      attendances: targetInvRequest.attendances?.map((att) => {
                                          return {
                                              ...att,
                                              arrangement: {
                                                  ...att.arrangement,
                                                  site: {
                                                      ...att.arrangement?.site,
                                                      siteMeter: {
                                                          ...att.arrangement?.site?.siteMeter,
                                                          companyPresentNum: side == 'self' ? dateInvRequestArrangement?.invRequest?.workerIds?.length : targetInvRequest?.workerIds?.length,
                                                      },
                                                  },
                                              },
                                          }
                                      }),
                                  }
                                : undefined,
                            ...(draftData?.draftDateData?.invRequests?.totalInvRequests?.items ?? []),
                        ].filter((data) => data != undefined) as InvRequestType[],
                        'invRequestId',
                    ),
                },
            },
        }

        const arrangedWorkersCount = getDateArrangedWorkersCount({
            data: __draftDateData,
        })

        const _draftDateData = {
            ...__draftDateData,
            arrangementSummary: {
                ...dateData?.arrangementSummary,
                arrangedWorkersCount,
            },
        }
        return _draftDateData
    }

    const _setAllSiteCertain = async () => {
        try {
            const _updatedAt = Number(new Date())

            dispatch(setLoading('unTouchable'))
            const lockResults = await Promise.all([
                ...(draftData?.draftDateData?.sites?.totalSites?.items
                    ?.filter((site) => (site.siteMeter?.companyPresentNum ? site.siteMeter?.companyPresentNum > 0 : false))
                    .map((site) =>
                        updateLockOfTarget({
                            myWorkerId: signInUser?.workerId ?? 'no-id',
                            targetId: site.siteId ?? 'no-id',
                            modelType: 'site',
                        }),
                    ) ?? []),
                ...(draftData?.draftDateData?.invRequests?.totalInvRequests?.items
                    ?.filter((inv) => inv.myCompanyId == myCompanyId)
                    .map((inv) =>
                        updateLockOfTarget({
                            myWorkerId: signInUser?.workerId ?? 'no-id',
                            targetId: inv.invRequestId ?? 'no-id',
                            modelType: 'invRequest',
                        }),
                    ) ?? []),
            ])
            lockResults.forEach((lockResults) => {
                if (lockResults?.error) {
                    throw {
                        error: lockResults.error,
                    }
                }
            })

            siteArrangements
                ?.filter(
                    (siteArrangement) =>
                        siteArrangement?.siteArrangementData != undefined &&
                        siteArrangement?.site?.fakeCompanyInvRequestId == undefined &&
                        (siteArrangement.request == undefined || siteArrangement.request?.isApproval === true),
                )
                .map((siteArrangement) => {
                    if (siteArrangement?.localPresentNum != undefined && siteArrangement?.localPresentNum < 1) {
                        throw {
                            error: '作業員が手配されていない現場があります。',
                            errorCode: 'SET_ALL_SITE_CERTAIN_ERROR',
                        }
                    }
                })
            invRequestArrangements?.map((invArr) => {
                if ((invArr?.localPresentNum == undefined || invArr?.localPresentNum < 1) && invArr?.invRequest?.targetCompany?.isFake != true && invArr.companyId == myCompanyId) {
                    throw {
                        error: '作業員が手配されていない常用申請があります。',
                        errorCode: 'SET_ALL_SITE_CERTAIN_ERROR',
                    }
                }
            })
            dispatch(setLoading('unTouchable'))

            const _siteArrangements = siteArrangements?.filter((sArr) => {
                //sArrのkeepSiteArrangementDataのselfSideかotherSideに違いがある場合のみ
                if (sArr?.keepSiteArrangementData == undefined || sArr?.siteArrangementData == undefined) return true
                const keepSelfSide = sArr?.keepSiteArrangementData?.selfSide?.map((data) => data?.targetArrangement?.arrangementId).filter((data) => data != undefined) ?? []
                const keepOtherSideRequest = sArr?.keepSiteArrangementData?.otherSide?.map((data) => data?.targetRequest).filter((data) => data != undefined) ?? []
                const selfSide = sArr?.siteArrangementData?.selfSide?.map((data) => data?.targetArrangement?.arrangementId).filter((data) => data != undefined) ?? []
                const otherSideRequest = sArr?.siteArrangementData?.otherSide?.map((data) => data?.targetRequest).filter((data) => data != undefined) ?? []
                //keepOtherSideとotherSideの比較でtargetRequestのrequestCountが変わっているかどうかで判定する
                const keepOtherFlag = keepOtherSideRequest.map(
                    (request) => request?.requestCount == otherSideRequest?.find((otherRequest) => otherRequest?.requestId == request?.requestId)?.requestCount,
                )
                const otherFlag = otherSideRequest.map((request) => request?.requestCount == keepOtherSideRequest?.find((otherRequest) => otherRequest?.requestId == request?.requestId)?.requestCount)
                const flag = [...keepOtherFlag, ...otherFlag].every((flag) => flag == true)

                if (
                    xor(keepSelfSide, selfSide).length > 0 ||
                    !flag ||
                    (sArr.request == undefined && sArr.site?.isConfirmed != true) ||
                    (sArr.request != undefined && sArr.request.isConfirmed != true)
                ) {
                    return true
                } else {
                    return false
                }
            })
            const _invRequestArrangements = invRequestArrangements
                ?.filter((invArr) => {
                    if (invArr?.keepInvRequestArrangementData == undefined || invArr?.invRequestArrangementData == undefined) return true
                    if (invArr.companyId != myCompanyId) false
                    const keepSelfSide =
                        invArr?.keepInvRequestArrangementData?.selfSide
                            ?.filter((self) => self.targetInvRequest != undefined)
                            .map((self) => self?.worker?.workerId)
                            .filter((data) => data != undefined) ?? []
                    const keepOtherSideRequest = invArr?.keepInvRequestArrangementData?.otherSide?.map((data) => data?.targetRequest).filter((data) => data != undefined) ?? []
                    const selfSide =
                        invArr?.invRequestArrangementData?.selfSide
                            ?.filter((self) => self.targetInvRequest != undefined)
                            .map((self) => self?.worker?.workerId)
                            .filter((data) => data != undefined) ?? []
                    const otherSideRequest = invArr?.invRequestArrangementData?.otherSide?.map((data) => data?.targetRequest).filter((data) => data != undefined) ?? []
                    //keepOtherSideとotherSideの比較でtargetRequestのrequestCountが変わっているかどうかで判定する
                    const keepOtherFlag = keepOtherSideRequest.map(
                        (request) => request?.requestCount == otherSideRequest?.find((otherRequest) => otherRequest?.requestId == request?.requestId)?.requestCount,
                    )
                    const otherFlag = otherSideRequest.map(
                        (request) => request?.requestCount == keepOtherSideRequest?.find((otherRequest) => otherRequest?.requestId == request?.requestId)?.requestCount,
                    )
                    const flag = [...keepOtherFlag, ...otherFlag].every((flag) => flag == true)

                    if (xor(keepSelfSide, selfSide).length > 0 || !flag || invArr.invRequest?.isApplication != true) {
                        return true
                    } else {
                        return false
                    }
                })
                .map((invArr) => {
                    const _invRequest = draftData?.draftDateData?.invRequests?.totalInvRequests?.items?.find((invR) => invR.invRequestId == invArr?.invRequestId)
                    const _invArr: DateInvRequestArrangementType = {
                        ...invArr,
                        invRequestArrangementData: {
                            ...invArr.invRequestArrangementData,
                            selfSide: invArr.invRequestArrangementData?.selfSide?.map((self) => {
                                if (self.targetInvRequest) {
                                    return {
                                        ...self,
                                        targetInvRequest: {
                                            ...self.targetInvRequest,
                                            attendances: _invRequest?.attendances ?? [],
                                        },
                                    }
                                } else {
                                    return self
                                }
                            }),
                        },
                    }
                    return _invArr
                })

            //現場の手配を適用する
            const applyResults = await Promise.all([
                //発注管理下のみは除外したいが、依頼が来ている可能性もあるためsiteRelationではフィルターしない
                //手配をDBに反映
                ...(_siteArrangements
                    ?.filter((siteArrangement) => siteArrangement?.siteArrangementData != undefined)
                    ?.map((data) =>
                        applyDraftSiteArrangementData({
                            keepSiteArrangementData: data.keepSiteArrangementData,
                            siteArrangementData: data.siteArrangementData,
                            siteId: data.siteId,
                            site: data.site,
                            myCompanyId,
                            myWorkerId,
                            respondRequestId: data.request?.requestId,
                            activeDepartmentIds,
                        }),
                    ) ?? []),
                //手配をDBに反映
                ...(_invRequestArrangements?.map((data) =>
                    applyDraftInvRequestArrangementData({
                        keepInvRequestArrangementData: data?.keepInvRequestArrangementData,
                        invRequestArrangementData: data?.invRequestArrangementData,
                        invRequestId: data?.invRequestId,
                        myCompanyId,
                        myWorkerId,
                        fakeSite: data?.fakeSite,
                        respondRequestId: data?.respondRequest?.requestId,
                        activeDepartmentIds,
                    }),
                ) ?? []),
            ])
            applyResults.forEach((applyResult) => {
                if (applyResult?.error) {
                    throw {
                        error: applyResult.error,
                        errorCode: applyResult.errorCode,
                    }
                }
            })
            const allAttendanceCachedKey = genKeyName({
                screenName: 'AllSiteAttendancesManage',
                accountId: signInUser?.accountId ?? '',
                companyId: myCompanyId ?? '',
                /** "/" はKVSのキーに使えない文字のため "-" に変換 */
                date: date ? dayBaseTextWithoutDate(date).replace(/\//g, '-') : '',
            })
            const allSiteAttendancesCacheData = await getCachedData<AllSiteAttendancesMangeCacheDataType>(allAttendanceCachedKey)

            //一度その日の勤怠キャッシュを引っ張ってきて、それぞれ更新した勤怠を返してもらって、更新する。
            const results = applyResults
                .map((applyResult: CustomResponse<ApplyDraftSiteArrangementDataResponse & ApplyDraftInvRequestArrangementDataResponse>) => {
                    if (applyResult?.success?.siteId) {
                        return onUpdateArrangementUpdateSiteAttendanceCache({
                            addAttendances: applyResult?.success.addAttendances,
                            myCompanyId,
                            accountId: signInUser?.accountId,
                            siteId: applyResult?.success.siteId,
                            deleteArrangementIds: applyResult?.success.deleteArrangementIds,
                            siteArrangementData: _siteArrangements?.find((siteArrangement) => siteArrangement?.siteId == applyResult?.success?.siteId)?.siteArrangementData,
                            site: _siteArrangements?.find((siteA) => siteA?.siteId == applyResult?.success?.siteId)?.site,
                        })
                    }
                    if (applyResult.success?.fakeSiteId) {
                        //仮会社へ常用で送る場合にはInvRequestとSiteのそれぞれに紐ずくSiteAttendancesが存在するが、利用するのは常用依頼も確認できるSite側のみ。
                        return onUpdateArrangementUpdateSiteAttendanceCache({
                            addAttendances: applyResult?.success.addAttendances,
                            myCompanyId,
                            accountId: signInUser?.accountId,
                            siteId: applyResult?.success.fakeSiteId,
                            deleteArrangementIds: applyResult?.success.deleteArrangementIds,
                            site: _invRequestArrangements?.find((invR) => invR.fakeSite?.siteId == applyResult?.success?.fakeSiteId)?.fakeSite,
                            siteArrangementData: _invRequestArrangements?.find((siteArrangement) => siteArrangement.fakeSite?.siteId == applyResult?.success?.fakeSiteId)?.invRequestArrangementData,
                            myCompany,
                        })
                    }
                    if (applyResult?.success?.invRequestId) {
                        return onUpdateArrangementUpdateSiteAttendanceCache({
                            addAttendances: applyResult?.success.addAttendances,
                            myCompanyId,
                            accountId: signInUser?.accountId,
                            invRequestId: applyResult?.success.invRequestId,
                            deleteArrangementIds: applyResult?.success.deleteArrangementIds,
                            siteArrangementData: _invRequestArrangements?.find((invR) => invR.invRequestId == applyResult?.success?.invRequestId)?.invRequestArrangementData,
                            invRequest: _invRequestArrangements?.find((invR) => invR.invRequestId == applyResult?.success?.invRequestId)?.invRequest,
                            myCompany,
                        })
                    }
                })
                .filter((data) => data != undefined) as CustomResponse<SiteAttendanceModel>[]

            let _allSiteAttendances: SiteAttendanceDataType[]
            let _invRequests: InvRequestType[]
            let _sites: SiteType[]

            if (allSiteAttendancesCacheData.success) {
                _allSiteAttendances = allSiteAttendancesCacheData?.success?.allSiteAttendances
                    ?.map((siteAttendance) => {
                        const _siteId =
                            (siteAttendance?.subArrangements?.items && siteAttendance?.subArrangements?.items[0]?.siteId) ??
                            (siteAttendance?.subRequests?.items && siteAttendance?.subRequests?.items[0]?.siteId)
                        return results.find((result) => result.success?.siteId == _siteId)?.success?.siteAttendanceData ?? siteAttendance
                    })
                    .filter((data) => data != undefined) as SiteAttendanceDataType[]
                _invRequests = allSiteAttendancesCacheData.success.invRequests
                    ?.map((invRequest) => {
                        const _invRequestId = invRequest?.invRequestId
                        return results.find((result) => result.success?.invRequest?.invRequestId == _invRequestId)?.success?.invRequest ?? invRequest
                    })
                    .filter((data) => data != undefined) as InvRequestType[]
                _sites = allSiteAttendancesCacheData.success.sites
                    ?.map((site) => {
                        return results.find((result) => result.success?.site?.siteId == site?.siteId)?.success?.site ?? site
                    })
                    .filter((data) => data != undefined) as SiteType[]
            } else {
                _allSiteAttendances = results.map((result) => result.success?.siteAttendanceData).filter((data) => data != undefined) as SiteAttendanceDataType[]
                _invRequests = results.map((result) => result.success?.invRequest).filter((data) => data != undefined) as InvRequestType[]
                _sites = results.map((result) => result.success?.site).filter((data) => data != undefined) as SiteType[]
            }

            const _allSiteAttendancesCacheData: AllSiteAttendancesMangeCacheDataType = {
                allSiteAttendances: _allSiteAttendances,
                invRequests: _invRequests,
                sites: _sites,
                updatedAt: Number(new Date()),
            }

            const cachedResult = await updateCachedData({ key: allAttendanceCachedKey, value: _allSiteAttendancesCacheData })
            if (cachedResult.error) {
                const _error = cachedResult as CustomResponse
                dispatch(
                    setToastMessage({
                        text: getErrorToastMessage(_error),
                        type: 'error',
                    }),
                )
            }

            //手配反映でエラーが起きた場合に、現場確定に進まないように処理を分割している。
            //現場の手配を適用する(ここが重い)
            dispatch(setLoading('unTouchable'))
            const certainResults = await Promise.all([
                //常用依頼を申請する//TODO:仕様が変わり、手配と同時に確定するのでここではなく、setSiteCertainInTargetDateでやったほうが良いかもしれない
                ...(_siteArrangements
                    ?.filter((siteArrangement) => siteArrangement?.siteArrangementData != undefined)
                    ?.map((data) =>
                        updateRequestsApplication({
                            requests: data.siteArrangementData?.otherSide?.map((other) => other?.targetRequest).filter((request) => request?.requestId != undefined) as RequestType[],
                        }),
                    ) ?? []),
                ...(_invRequestArrangements?.map((data) =>
                    updateRequestsApplication({
                        requests: data.invRequestArrangementData?.otherSide?.map((other) => other?.targetRequest).filter((request) => request?.requestId != undefined) as RequestType[],
                    }),
                ) ?? []),
                //現場を確定
                setSiteCertainInTargetDate({
                    sites: _siteArrangements
                        ?.filter((sArr) => sArr.request == undefined)
                        .map((sArr) => sArr.site)
                        .filter((data) => data != undefined) as SiteType[],
                    requests: _siteArrangements
                        ?.filter((sArr) => sArr.request != undefined)
                        .map((sArr) => {
                            return { ...sArr?.request, site: sArr.site } as RequestType
                        })
                        .filter((data) => data != undefined) as RequestType[],
                    invRequestIds: _invRequestArrangements
                        ?.filter((iArr) => iArr.invRequest?.myCompanyId == myCompanyId)
                        ?.map((iArr) => iArr?.invRequestId)
                        .filter((data) => data != undefined) as string[],
                    date,
                    myCompanyId,
                    signInUser,
                    isConfirmed: true,
                }),
                //現場の下書きデータを削除
                ...(_siteArrangements
                    ?.filter((siteArrangement) => siteArrangement?.siteArrangementData != undefined)
                    ?.map((data) => deleteLocalSiteArrangement(data.request?.requestId ?? data.siteId)) ?? []),
                //常用で送る下書きデータの削除
                ...(_invRequestArrangements?.map((data) => deleteLocalSiteArrangement(data.invRequestId)) ?? []),
            ])
            certainResults.forEach((certainResult) => {
                if (certainResult?.error) {
                    throw {
                        error: certainResult.error,
                        errorCode: certainResult.errorCode,
                    }
                }
            })
            dispatch(setLoading('unTouchable'))
            //負荷分散のためにPromiseを分ける
            const certainResults2 = await Promise.all([
                // DB挿入されるまでに時間かかるため、先に手配更新の内容を画面に表示させる。
                ...(_siteArrangements?.map(
                    (data) =>
                        data?.site &&
                        data?.siteArrangementData &&
                        updateSiteArrangementCache({
                            site: data?.site,
                            siteArrangementData: data?.siteArrangementData,
                            myCompanyId: myCompanyId ?? 'no-id',
                            accountId: signInUser?.accountId ?? 'no-id',
                            localPresentNum: data?.localPresentNum,
                            updatedAt: _updatedAt,
                        }),
                ) ?? []),
                ...(_invRequestArrangements?.map(
                    (data) =>
                        data?.invRequest &&
                        data?.invRequestArrangementData &&
                        updateInvRequestArrangementCache({
                            invRequest: data?.invRequest,
                            invRequestArrangementData: data?.invRequestArrangementData,
                            myCompanyId: myCompanyId ?? 'no-id',
                            accountId: signInUser?.accountId ?? 'no-id',
                            updatedAt: _updatedAt,
                        }),
                ) ?? []),
                //TODO:これを、手配ではなく手配を反映したdraftDateDataをもとに作成すればあまり変更なく更新できるはず
                updateDateArrangementsCache({
                    siteArrangements: siteArrangements?.filter((siteArrangement) => siteArrangement?.siteArrangementData != undefined),
                    invRequestArrangements,
                    date: date,
                    myCompanyId: myCompanyId ?? 'no-id',
                    accountId: signInUser?.accountId ?? 'no-id',
                    updatedAt: _updatedAt,
                }),
            ])
            certainResults2.forEach((certainResult) => {
                if (certainResult?.error) {
                    throw {
                        error: certainResult.error,
                        errorCode: certainResult.errorCode,
                    }
                }
            })

            //画面遷移して戻ってきた時にキャッシュが更新されているようにするため。イレギュラーな場合で手配済み未確定を即時反映させるため。
            dispatch(setIsNavUpdating(true))

            const lockResults2 = await Promise.all([
                ...(draftData?.draftDateData?.sites?.totalSites?.items
                    ?.filter((site) => (site.siteMeter?.companyPresentNum ? site.siteMeter?.companyPresentNum > 0 : false))
                    .map((site) =>
                        updateLockOfTarget({
                            myWorkerId: signInUser?.workerId ?? 'no-id',
                            targetId: site.siteId ?? 'no-id',
                            modelType: 'site',
                            unlock: true,
                        }),
                    ) ?? []),
            ])
            lockResults2.forEach((lockResults2) => {
                if (lockResults2?.error) {
                    throw {
                        error: lockResults2.error,
                    }
                }
            })
            dispatch(
                setToastMessage({
                    text: t('common:ArrangementsFinalizedAndNotify'),
                    type: 'success',
                } as ToastMessage),
            )

            const constructionIdAndDates = _siteArrangements?.map((sArr) => toIdAndMonthFromTotalSeconds(sArr.site?.constructionId, date?.totalSeconds ?? 0))
            const requestedCompanyIds = flatten(_siteArrangements?.map((sArr) => sArr?.siteArrangementData?.otherSide?.map((other) => other.targetRequest?.requestedCompanyId) ?? [])).filter(
                (data) => data != undefined,
            ) as string[]
            const keepRequestedCompanyIds = flatten(_siteArrangements?.map((sArr) => sArr?.keepSiteArrangementData?.otherSide?.map((other) => other.targetRequest?.requestedCompanyId) ?? [])).filter(
                (data) => data != undefined,
            ) as string[]
            const changeCompanyIds = uniq([...(requestedCompanyIds ?? []), ...(keepRequestedCompanyIds ?? [])].filter((data) => data != undefined))
            const companyIdAndDates = changeCompanyIds?.map((id) => toIdAndMonthFromTotalSeconds(id, date?.totalSeconds ?? 0)).filter((data) => data != undefined)
            const siteIds = draftData?.draftDateData?.sites?.totalSites?.items?.map((site) => site.siteId).filter((data) => data != undefined) as string[]
            const result = addUpdateScreens({
                dispatch,
                updateScreens: [
                    {
                        screenName: 'ConstructionSiteList',
                        idAndDates: constructionIdAndDates,
                    },
                    {
                        screenName: 'SiteDetail',
                        ids: siteIds,
                    },
                    {
                        screenName: 'CompanyInvoice',
                        ids: companyIdAndDates,
                    },
                ],
            })
            if (setDisplayScreen) setDisplayScreen('AllSiteAttendancesManage')
        } catch (error) {
            setState((prev) => ({ ...prev, update: update + 1, isArrangeMode: false }))
            const _error = error as CustomResponse
            dispatch(
                setToastMessage({
                    text: getErrorToastMessage(_error),
                    type: 'error',
                } as ToastMessage),
            )
        } finally {
            if (isFocused) {
                dispatch(setLoading(false))
            }
        }
    }

    const _onDateChange = async (_date: CustomDate) => {
        // __DEV__ && logger.logAccessInfo('\n5. onDateChangeイベントハンドラ')

        setState((prev) => ({ ...prev, date: _date, selectedId: undefined, siteArrangements: [], invRequestArrangements: [] }))
    }

    const _onRefresh = async () => {
        if (isFocused) dispatch(setLoading(true))
        dispatch(setIsNavUpdating(true))
    }

    // const _siteNumber = (a: SiteType | InvRequestType): number => {
    //     const siteId = (a as SiteType)?.siteId
    //     const invRequestId = (a as InvRequestType)?.invRequestId

    //     if (siteId !== undefined) {
    //         const { siteNameData } = a as SiteType
    //         return siteNameData?.siteNumber !== undefined ? siteNameData.siteNumber : 1
    //     } else if (invRequestId !== undefined) {
    //         const { site } = a as InvRequestType
    //         return site?.siteNameData?.siteNumber !== undefined ? site?.siteNameData?.siteNumber : 1
    //     }
    //     return 1
    // }

    /**
     * 以下、手配に関する関数
     */

    const _onPressAtPreSelfContent = async (item: SiteArrangementWorkerType, arrangeCount: number): Promise<CustomResponse> => {
        try {
            if (myCompanyId == undefined || item?.worker?.workerId == undefined) {
                throw {
                    error: t('common:Reload'),
                    errorCode: 'UPDATE_ARRANGEMENT_ERROR',
                }
            }
            const result = await onPressAtPreSelfContent({
                item,
                arrangeCount,
                siteArrangementData: dateSiteArrangement?.siteArrangementData,
                keepSiteArrangementData: dateSiteArrangement?.keepSiteArrangementData,
                invRequestArrangementData: dateInvRequestArrangement?.invRequestArrangementData,
                site: dateSiteArrangement?.site,
                respondRequest: dateSiteArrangement?.request ?? dateInvRequestArrangement?.respondRequest,
                myCompanyId: myCompanyId,
                activeDepartmentIds,
                t,
                _approveRequest,
                dispatch,
                targetMeter: dateSiteArrangement?.targetMeter ?? dateInvRequestArrangement?.targetMeter,
                localPresentNum: dateSiteArrangement?.localPresentNum ?? dateInvRequestArrangement?.localPresentNum,
                invRequest: dateInvRequestArrangement?.invRequest,
                onSetData: (updateSiteArrangementsData: DateSiteArrangementType[], updateInvArrangementsData: DateSiteArrangementType[]) => {
                    const __draftDateData = onPressWorkerOrCompany('self')
                    setState((prev) => ({
                        ...prev,
                        draftData: {
                            ...draftData,
                            draftDateData: __draftDateData,
                        },
                        siteArrangements: updateSiteArrangementsData,
                        invRequestArrangements: updateInvArrangementsData,
                        update: update + 1,
                    }))
                },
                siteArrangements,
                invRequestArrangements,
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

    const _onPressAtPreOtherContent = async (item: SiteArrangementCompanyType): Promise<CustomResponse> => {
        try {
            if (myCompanyId == undefined) {
                throw {
                    error: t('common:Reload'),
                    errorCode: 'UPDATE_ARRANGEMENT_ERROR',
                }
            }
            const result = await onPressAtPreOtherContent({
                item,
                siteArrangementData: dateSiteArrangement?.siteArrangementData,
                keepSiteArrangementData: dateSiteArrangement?.keepSiteArrangementData ?? dateInvRequestArrangement?.keepInvRequestArrangementData,
                invRequestArrangementData: dateInvRequestArrangement?.invRequestArrangementData,
                site: dateSiteArrangement?.site,
                respondRequest: dateSiteArrangement?.request ?? dateInvRequestArrangement?.respondRequest,
                myCompanyId: myCompanyId,
                activeDepartmentIds,
                t,
                _approveRequest,
                dispatch,
                targetMeter: dateSiteArrangement?.targetMeter ?? dateInvRequestArrangement?.targetMeter,
                localPresentNum: dateSiteArrangement?.localPresentNum ?? dateInvRequestArrangement?.localPresentNum,
                invRequest: dateInvRequestArrangement?.invRequest,
                onSetData: (data: SiteArrangementDataType) => {
                    const __draftDateData = onPressWorkerOrCompany('other')
                    if (dateInvRequestArrangement) {
                        const _dateInvRequestArrangementData: DateInvRequestArrangementType = {
                            ...dateInvRequestArrangement,
                            invRequestArrangementData: data,
                            localPresentNum: (dateInvRequestArrangement?.localPresentNum ?? 0) + 1,
                        }
                        setState((prev) => ({
                            ...prev,
                            invRequestArrangements: [
                                ...(invRequestArrangements?.filter((data) => data.invRequestArrangementId != dateInvRequestArrangement?.invRequestArrangementId) ?? []),
                                _dateInvRequestArrangementData,
                            ],
                            draftData: {
                                ...draftData,
                                draftDateData: __draftDateData,
                            },
                            update: update + 1,
                        }))
                    }
                    if (dateSiteArrangement) {
                        const _dateSiteArrangementData: DateSiteArrangementType = {
                            ...dateSiteArrangement,
                            siteArrangementData: data,
                            localPresentNum: (dateSiteArrangement?.localPresentNum ?? 0) + 1,
                        }
                        setState((prev) => ({
                            ...prev,
                            siteArrangements: [...(siteArrangements?.filter((data) => data.siteArrangementId != dateSiteArrangement?.siteArrangementId) ?? []), _dateSiteArrangementData],
                            draftData: {
                                ...draftData,
                                draftDateData: __draftDateData,
                            },
                            update: update + 1,
                        }))
                    }
                },
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

    const __onInvisibleLoad = () => {
        if (isFocused) dispatch(setLoading(true))
        dispatch(
            setToastMessage({
                text: t('common:Updating'),
                type: 'warn',
            } as ToastMessage),
        )
    }

    /**
     * 前回手配を複製
     * 分割するならこれだけではなくて、ボタンごとコンポーネントを新規作成するほうが良さそう
     */
    const _setPreviousArrangements = async () => {
        try {
            if (loading) {
                __onInvisibleLoad()
                return
            }
            if (myCompanyId == undefined || signInUser?.workerId == undefined) {
                throw {
                    error: t('common:NoInfoAvailable'),
                    errorCode: 'SET_PREVIOUS_ARRANGEMENTS_ERROR',
                }
            }
            //前回現場を手配できる現場に限定する
            const updateSiteArrangements = siteArrangements?.filter(
                (data) => data.siteId != undefined && data?.siteArrangementData?.siteRelation != undefined && data?.setting?.hideArrangeableWorkers != true && data?.setting?.hideCopyHistory != true,
            )
            if (updateSiteArrangements?.length == 0) {
                throw {
                    error: t('admin:ThereWasNoSiteThatCouldBeDuplicated'),
                    errorCode: 'SET_PREVIOUS_ARRANGEMENTS_ERROR',
                }
            }
            dispatch(setLoading('unTouchable'))
            // TODO: requestのあるなしで変わる。
            const results = await Promise.all(
                updateSiteArrangements?.map((data) =>
                    setPreviousArrangements({
                        myCompanyId,
                        siteId: data?.siteId as string,
                        myWorkerId: signInUser?.workerId as string,
                        respondRequestId: data?.request?.requestId,
                        targetArrange: data?.siteArrangementData as SiteArrangementDataType,
                        keepArrange: data?.keepSiteArrangementData as SiteArrangementDataType,
                        targetMeter: data?.targetMeter,
                        site: data?.site,
                    }),
                ) ?? [],
            )
            results.forEach((result) => {
                if (result.error) {
                    if (result.error != '前の現場がありません。') {
                        //前回現場があるもののみを複製するので、前回現場がない場合はエラーにしない
                        throw {
                            error: result.error,
                            errorCode: result.errorCode,
                        }
                    }
                }
            })
            //複製できるのは今の所自社現場だけなので、invRequestに増減はない。
            const addArrangements = flatten(results.map((result) => result.success?.addArrangements).filter((data) => data != undefined)) as ArrangementType[]
            const deleteArrangementIds = flatten(results.map((result) => result.success?.deleteArrangementIds).filter((data) => data != undefined)) as string[]
            const _siteArrangements = siteArrangements?.map((dateSiteArrangement) => {
                return {
                    ...dateSiteArrangement,
                    siteArrangementData: {
                        ...dateSiteArrangement.siteArrangementData,
                        selfSide: dateSiteArrangement.siteArrangementData?.selfSide?.map((data) => {
                            const _data: SiteArrangementWorkerType = {
                                ...data,
                                dailyArrangements: {
                                    items: uniqBy(
                                        [
                                            ...(data.dailyArrangements?.items?.filter((arr) => arr.arrangementId && !deleteArrangementIds.includes(arr.arrangementId)) ?? []),
                                            ...(addArrangements.filter((arr) => arr.workerId == data.worker?.workerId) ?? []),
                                        ],
                                        'arrangementId',
                                    ),
                                },
                            }
                            return _data
                        }),
                    },
                } as DateSiteArrangementType
            })
            const newLocalSiteArrangements = _siteArrangements?.map((dateSiteArrangement) => {
                return {
                    ...dateSiteArrangement.siteArrangementData,
                    siteArrangementId: dateSiteArrangement.request?.requestId ?? (dateSiteArrangement.siteId as string),
                    meter: dateSiteArrangement.targetMeter,
                } as LocalSiteArrangementDataType
            })
            const _invArrangements = invRequestArrangements?.map((dateInvArrangement) => {
                return {
                    ...dateInvArrangement,
                    invRequestArrangementData: {
                        ...dateInvArrangement.invRequestArrangementData,
                        selfSide: dateInvArrangement.invRequestArrangementData?.selfSide?.map((data) => {
                            const _data: SiteArrangementWorkerType = {
                                ...data,
                                dailyArrangements: {
                                    items: [
                                        ...(data.dailyArrangements?.items?.filter((arr) => arr.arrangementId && !deleteArrangementIds.includes(arr.arrangementId)) ?? []),
                                        ...(addArrangements.filter((arr) => arr.workerId == data.worker?.workerId) ?? []),
                                    ],
                                },
                            }
                            return _data
                        }),
                    },
                } as DateInvRequestArrangementType
            })
            const newLocalInvArrangements = _invArrangements?.map((dateInvArrangement) => {
                return {
                    ...dateInvArrangement.invRequestArrangementData,
                    siteArrangementId: dateInvArrangement.invRequestId,
                    meter: dateInvArrangement.targetMeter,
                } as LocalSiteArrangementDataType
            })
            if (newLocalSiteArrangements || newLocalInvArrangements) {
                const result = await _writeLocalSiteArrangements([...(newLocalSiteArrangements ?? []), ...(newLocalInvArrangements ?? [])])
                if (result.error) {
                    dispatch(setIsNavUpdating(true))
                    throw {
                        error: result.error,
                        errorCode: result.errorCode,
                    }
                }
            }
            setState((prev) => ({ ...prev, siteArrangements: _siteArrangements, invRequestArrangements: _invArrangements }))
            dispatch(setIsNavUpdating(true))
            dispatch(
                setToastMessage({
                    text: `${t('common:OverrideSiteWithPreviousArrangements')}`,
                    type: 'success',
                } as ToastMessage),
            )
        } catch (error) {
            const _error = error as CustomResponse
            dispatch(
                setToastMessage({
                    text: getErrorToastMessage(_error),
                    type: 'error',
                } as ToastMessage),
            )
        } finally {
            if (isFocused) {
                dispatch(setLoading(false))
            }
        }
    }

    /**
     * 以下WorkerDetailBottomSheetで利用する関数
     */
    /**
     * BottomSheetから何か更新した際に利用する
     */
    const bottomUpdate = () => {
        if (dateSiteArrangement) {
            const _siteArrangementData: DateSiteArrangementType = {
                ...dateSiteArrangement,
            }
            setState((prev) => ({
                ...prev,
                siteArrangements: [...(siteArrangements?.filter((data) => data.siteArrangementId != dateSiteArrangement?.siteArrangementId) ?? []), _siteArrangementData],
                update: update + 1,
                arrangementDetail: undefined,
            }))
        }
        if (dateInvRequestArrangement) {
            const _invRequestArrangementData: DateInvRequestArrangementType = {
                ...dateInvRequestArrangement,
            }
            setState((prev) => ({
                ...prev,
                invRequestArrangements: [
                    ...(invRequestArrangements?.filter((data) => data.invRequestArrangementId != dateInvRequestArrangement?.invRequestArrangementId) ?? []),
                    _invRequestArrangementData,
                ],
                update: update + 1,
                arrangementDetail: undefined,
            }))
        }
    }

    const _setToHoliday = async (localWorker?: SiteArrangementWorkerType) => {
        try {
            if (loading) {
                __onInvisibleLoad()
                return
            }
            const _workerId = localWorker?.worker?.workerId
            if (!_workerId) {
                throw {
                    error: t('common:NoWorkerId'),
                }
            }
            if (isFocused) dispatch(setLoading(true))

            const result = await setToHolidayAtSite({
                localWorker,
                myCompanyId,
                myWorkerId,
                siteArrangementData: dateSiteArrangement?.siteArrangementData,
                invRequestArrangementData: dateInvRequestArrangement?.invRequestArrangementData,
                targetMeter: dateSiteArrangement?.targetMeter ?? dateInvRequestArrangement?.targetMeter,
                respondRequestId: dateSiteArrangement?.request?.requestId ?? dateInvRequestArrangement?.respondRequest?.requestId,
                siteId: dateSiteArrangement?.siteId,
                invRequest: dateInvRequestArrangement?.invRequest,
            })
            if (result?.error) {
                throw {
                    error: result.error,
                    errorCode: result.errorCode,
                }
            }
            bottomUpdate()
            //ローカルで即時反映
            const _siteArrangements: DateSiteArrangementType[] =
                siteArrangements?.map((data) => {
                    const _data: DateSiteArrangementType = {
                        ...data,
                        siteArrangementData: {
                            ...data.siteArrangementData,
                            selfSide: data.siteArrangementData?.selfSide?.map((data) => {
                                if (data.worker?.workerId == _workerId && data.worker.workerTags) {
                                    const _data: SiteArrangementWorkerType = {
                                        ...data,
                                        worker: {
                                            ...data.worker,
                                            workerTags: [...(data.worker.workerTags ?? []), 'is-holiday'],
                                        },
                                    }
                                    return _data
                                } else {
                                    return data
                                }
                            }),
                        },
                    }
                    return _data
                }) ?? []
            const _invRequestArrangements: DateInvRequestArrangementType[] =
                invRequestArrangements?.map((data) => {
                    const _data: DateInvRequestArrangementType = {
                        ...data,
                        invRequestArrangementData: {
                            ...data.invRequestArrangementData,
                            selfSide: data.invRequestArrangementData?.selfSide?.map((data) => {
                                if (data.worker?.workerId == _workerId && data.worker.workerTags) {
                                    const _data: SiteArrangementWorkerType = {
                                        ...data,
                                        worker: {
                                            ...data.worker,
                                            workerTags: [...(data.worker.workerTags ?? []), 'is-holiday'],
                                        },
                                    }
                                    return _data
                                } else {
                                    return data
                                }
                            }),
                        },
                    }
                    return _data
                }) ?? []

            setState((prev) => ({
                ...prev,
                siteArrangements: _siteArrangements,
                invRequestArrangements: _invRequestArrangements,
                update: update + 1,
                arrangementDetail: undefined,
            }))

            if (isFocused) dispatch(setLoading(false))
        } catch (error) {
            const _error = error as CustomResponse
            dispatch(
                setToastMessage({
                    text: getErrorToastMessage(_error),
                    type: 'error',
                } as ToastMessage),
            )
        }
    }

    const _setToSiteManager = async (worker?: SiteArrangementWorkerType) => {
        try {
            if (dateSiteArrangement?.site == undefined) {
                throw {
                    error: '現場情報がありません。',
                } as CustomResponse
            }
            if (myCompanyId == undefined) {
                throw {
                    error: '自社情報がありません。ログインし直してください。',
                } as CustomResponse
            }
            if (dateSiteArrangement?.siteId == undefined || worker?.worker?.workerId == undefined) {
                throw {
                    error: '情報が足りません。',
                } as CustomResponse
            }
            if (dateSiteArrangement?.site?.siteRelation != 'manager') {
                throw {
                    error: '自社施工現場でしか責任者を設定できません。',
                }
            }
            /**
             * 他の作業員が責任者だった場合に責任者タグを外す
             * Local情報を更新する
             */
            dateSiteArrangement?.siteArrangementData?.selfSide?.map((self) => pull(self.worker?.workerTags ?? [], 'is-site-manager'))
            dateSiteArrangement?.siteArrangementData?.otherSide?.map((other) => other.targetRequest?.subAttendances?.items?.map((att) => pull(att.worker?.workerTags ?? [], 'is-site-manager')))
            if (worker?.worker?.workerTags == undefined) {
                worker.worker.workerTags = []
            }
            worker.worker.workerTags[worker.worker.workerTags.length] = 'is-site-manager'
            bottomUpdate()
            const localUpdateResult = await writeLocalSiteArrangement({
                siteArrangement: dateSiteArrangement?.siteArrangementData,
                siteArrangementId: dateSiteArrangement?.request?.requestId ?? dateSiteArrangement?.siteId,
                meter: dateSiteArrangement?.targetMeter,
                companyRequiredNum: dateSiteArrangement?.request?.requestCount ?? dateSiteArrangement?.site?.requiredNum,
            })
            if (localUpdateResult.error) {
                throw {
                    error: localUpdateResult.error,
                    errorCode: localUpdateResult.errorCode,
                }
            }
        } catch (error) {
            const _error = error as CustomResponse
            dispatch(
                setToastMessage({
                    text: getErrorToastMessage(_error),
                    type: 'error',
                } as ToastMessage),
            )
        }
    }

    const onDeleteReservation = async (reservationId?: string, siteRequestCount?: number) => {
        try {
            if ((siteRequestCount ?? 0) > 0) {
                throw {
                    error: '常用依頼済みです',
                    errorCode: 'ON_DELETE_RESERVATION_ERROR',
                }
            }
            dispatch(setLoading('unTouchable'))
            const result = await deleteReservation({ reservationId })
            if (isFocused) dispatch(setLoading(false))
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: result.errorCode,
                }
            }
            /**
             * ローカルから常用予約を削除する
             */
            _deleteLocalReservation(dateSiteArrangement?.siteArrangementData ?? dateInvRequestArrangement?.invRequestArrangementData, reservationId)
            const localUpdateResult = await writeLocalSiteArrangement({
                siteArrangement: dateSiteArrangement?.siteArrangementData ?? dateInvRequestArrangement?.invRequestArrangementData,
                siteArrangementId: dateSiteArrangement?.request?.requestId ?? dateSiteArrangement?.siteId ?? dateInvRequestArrangement?.invRequestId,
                meter: dateSiteArrangement?.targetMeter ?? dateInvRequestArrangement?.targetMeter,
                companyRequiredNum: dateSiteArrangement?.request?.requestCount ?? dateSiteArrangement?.site?.requiredNum,
            })
            if (localUpdateResult.error) {
                throw {
                    error: localUpdateResult.error,
                    errorCode: localUpdateResult.errorCode,
                }
            }
            dispatch(
                setToastMessage({
                    text: t('admin:ReservationDeleted'),
                    type: 'success',
                } as ToastMessage),
            )
            bottomUpdate()
        } catch (error) {
            const _error = error as CustomResponse
            dispatch(
                setToastMessage({
                    text: getErrorToastMessage(_error),
                    type: 'error',
                } as ToastMessage),
            )
        }
    }

    const onSetSiteManagerOtherSide = async (worker?: WorkerType) => {
        try {
            if (dateSiteArrangement?.site == undefined) {
                throw {
                    error: '現場情報がありません。',
                } as CustomResponse
            }
            if (dateSiteArrangement?.siteId == undefined || worker?.workerId == undefined) {
                throw {
                    error: '情報が足りません。',
                } as CustomResponse
            }
            const lockResult = await checkLockOfTarget({
                myWorkerId: myWorkerId ?? 'no-id',
                targetId: dateSiteArrangement?.siteId,
                modelType: 'site',
            })
            if (lockResult.error) {
                throw {
                    error: lockResult.error,
                    errorCode: lockResult.errorCode,
                }
            }
            if (dateSiteArrangement?.site?.siteRelation != 'manager') {
                throw {
                    error: '自社施工現場でしか責任者を設定できません。',
                }
            }
            /**
             * 他の作業員が責任者だった場合に責任者タグを外す
             * Local情報を更新する
             */
            dateSiteArrangement?.siteArrangementData?.selfSide?.map((self) => pull(self.worker?.workerTags ?? [], 'is-site-manager'))
            dateSiteArrangement?.siteArrangementData?.otherSide?.map((other) => other.targetRequest?.subAttendances?.items?.map((att) => pull(att.worker?.workerTags ?? [], 'is-site-manager')))
            if (worker?.workerTags == undefined) {
                worker.workerTags = []
            }
            worker.workerTags[worker.workerTags.length] = 'is-site-manager'

            const localUpdateResult = await writeLocalSiteArrangement({
                siteArrangement: dateSiteArrangement?.siteArrangementData,
                siteArrangementId: dateSiteArrangement?.siteId,
                meter: dateSiteArrangement?.targetMeter,
                companyRequiredNum: dateSiteArrangement?.site?.requiredNum,
            })
            if (localUpdateResult.error) {
                throw {
                    error: localUpdateResult.error,
                    errorCode: localUpdateResult.errorCode,
                }
            }
            bottomUpdate()
        } catch (error) {
            const _error = error as CustomResponse
            dispatch(
                setToastMessage({
                    text: getErrorToastMessage(_error),
                    type: 'error',
                } as ToastMessage),
            )
        }
    }

    useEffect(() => {
        if (displayData.length == 0) {
            setState((prev) => ({
                ...prev,
                isArrangeMode: false,
            }))
        }
    }, [displayData])

    useEffect(() => {
        if (isArrangeMode && isFocused) {
            dispatch(setIsBottomOff(true))
            setState((prev) => ({
                ...prev,
                isHideDateSwitch: true,
            }))
        } else {
            dispatch(setIsBottomOff(false))
            setState((prev) => ({
                ...prev,
                isHideDateSwitch: false,
            }))
        }
        return () => {
            dispatch(setIsBottomOff(false))
            setState((prev) => ({
                ...prev,
                isHideDateSwitch: false,
            }))
        }
    }, [isArrangeMode])

    useEffect(() => {
        return () => {
            dispatch(setIsBottomOff(false))
        }
    }, [])

    return (
        <>
            <SwitchPage
                isHideDateSwitch={isHideDateSwitch}
                dateUpdate={dateUpdate}
                dateInitValue={date ?? initDate} //route.params?.dateもつけておかないと、初回undefinedになって表示時にスライドしてしまう
                dateType={'day'}
                data={displayData}
                header={_header}
                content={_content}
                emptyProps={
                    loading
                        ? undefined
                        : {
                              text: t('common:SiteNotExist'),
                              addButtonText: t('common:CreateASiteAndACaseAndAnApplication'),
                              onPress: () => {
                                  navigation.push('ConstructionList', {
                                      targetDate: date,
                                  })
                              },
                              style: {
                                  marginVertical: 10,
                              },
                          }
                }
                onRefresh={_onRefresh}
                footer={_footer}
                onDateChange={_onDateChange}
                style={{
                    position: 'relative',
                }}
                onScroll={() => {
                    setState((prev) => ({ ...prev, isArrangeMode: false, selectedId: undefined }))
                }}
                flatListRef={flatListRef}
            />
            {isArrangeMode && (
                <>
                    {dateSiteArrangement || (dateInvRequestArrangement && dateInvRequestArrangement.invRequest?.myCompanyId == myCompanyId) ? (
                        <PreArrangeBox
                            style={{
                                shadowOpacity: 0.2,
                                shadowColor: '#000',
                                shadowRadius: 8,
                                shadowOffset: { width: 0, height: 1 },
                                backgroundColor: '#fff',
                                elevation: 8,
                                borderWidth: 1,
                                borderColor: THEME_COLORS.OTHERS.BORDER_COLOR,
                            }}
                            UIUpdate={update}
                            cantManage={dateSiteArrangement?.cantManage ?? dateInvRequestArrangement?.cantManage}
                            site={dateSiteArrangement?.site ?? dateInvRequestArrangement?.fakeSite}
                            invRequestId={dateInvRequestArrangement?.invRequestId}
                            setting={dateSiteArrangement?.setting ?? dateInvRequestArrangement?.setting}
                            arrangementData={dateSiteArrangement?.siteArrangementData ?? dateInvRequestArrangement?.invRequestArrangementData}
                            navigation={navigation}
                            myWorkerId={myWorkerId}
                            _onPressAtPreSelfContent={_onPressAtPreSelfContent}
                            _onPressAtPreOtherContent={_onPressAtPreOtherContent}
                            displayDetail={(type, item) => {
                                setState((prev) => ({ ...prev, arrangementDetail: { type, [type]: { ...item } } }))
                            }}
                            onUIUpdate={_update}
                            setClose={() => setState((prev) => ({ ...prev, isArrangeMode: false, selectedId: undefined }))}
                            // isHideUnArrange={true}
                            // isHideSearch={true}
                            instruction={dateSiteArrangement?.instruction}
                        />
                    ) : (
                        <EmptyScreen
                            style={{
                                shadowOpacity: 0.2,
                                shadowColor: '#000',
                                shadowRadius: 8,
                                shadowOffset: { width: 0, height: 1 },
                                backgroundColor: '#fff',
                                elevation: 8,
                                borderWidth: 1,
                                borderColor: THEME_COLORS.OTHERS.BORDER_COLOR,
                                width: '100%',
                                margin: 0,
                                marginTop: 0,
                                paddingTop: 40,
                            }}
                            text={
                                selectedId
                                    ? dateInvRequestArrangement?.invRequest?.targetCompanyId == myCompanyId
                                        ? t('admin:TheseAreTheWorkersThatWereSent')
                                        : isWaiting
                                        ? t('admin:FixAndNotifyTheSiteOfThisDate')
                                        : isSiteArrangeFetching || isInvArrangeFetching
                                        ? t('common:Loading')
                                        : t('common:Reload')
                                    : t('admin:PleaseSelectASite')
                            }
                        />
                    )}
                </>
            )}
            <WorkerDetailBottomSheet
                arrangementDetail={arrangementDetail}
                isOpen={arrangementDetail != undefined}
                onClose={() => setState((prev) => ({ ...prev, arrangementDetail: undefined }))}
                onSetToHoliday={(worker) => _setToHoliday(worker)}
                onSetToSiteManager={(worker) => _setToSiteManager(worker)}
                myCompanyId={myCompanyId}
                onDeleteReservation={onDeleteReservation}
                onSetSiteManagerOtherSide={onSetSiteManagerOtherSide}
            />
            {isDisplayTodo && (
                <BaseModal style={{ borderRadius: 10 }} onClose={() => setState((prev) => ({ ...prev, isDisplayTodo: false }))} isVisible={isDisplayTodo}>
                    <TodoList toDoInvRequests={toDoInvRequests} toDoRequests={toDoRequests} _approveRequest={_approveRequest} _approveInvRequest={_approveInvRequest} />
                </BaseModal>
            )}
            {((draftData?.draftDateData?.sites != undefined && (draftData?.draftDateData?.sites?.totalSites?.items?.length ?? 0) > 0) ||
                (draftData?.draftDateData?.invRequests != undefined && (draftData?.draftDateData?.invRequests?.totalInvRequests?.items?.length ?? 0) > 0)) &&
                !isArrangeMode && (
                    <AppButton
                        style={{
                            marginHorizontal: 10,
                            position: 'absolute',
                            bottom: 20,
                            right: 0,
                            zIndex: 1000,
                            elevation: Platform.OS === 'android' ? 10 : 0,
                            width: 80,
                        }}
                        disabled={sum(siteArrangements?.map((data) => data.localPresentNum)) + sum(invRequestArrangements?.map((data) => data.localPresentNum)) == 0}
                        onPress={() => {
                            _setAllSiteCertain()
                        }}
                        title={t('admin:FinalizeArrangements')}
                    />
                )}
        </>
    )
}
export default DateArrangements

const styles = StyleSheet.create({})
