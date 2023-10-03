import React, { useEffect, useState, useContext, useMemo, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { View, Text, StyleSheet, ListRenderItem, ListRenderItemInfo, Alert } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import '../../../../utils/ext/Date.extensions'
import {
    combineTimeAndDay,
    CustomDate,
    dayBaseTextWithoutDate,
    dayOfWeekText,
    getDailyStartTime,
    getMonthlyDays,
    getMonthlyFinalDay,
    getMonthlyFirstDay,
    isHoliday,
    monthBaseText,
    newCustomDate,
    nextDay,
    nextMonth,
    toCustomDateFromTotalSeconds,
    YYYYMMDateType,
} from '../../../../models/_others/CustomDate'
import cloneDeep from 'lodash/cloneDeep'
import isEmpty from 'lodash/isEmpty'
import range from 'lodash/range'
import { DEFAULT_SITE_END_TIME, DEFAULT_SITE_START_TIME, THEME_COLORS } from '../../../../utils/Constants'
import { GlobalStyles } from '../../../../utils/Styles'
import { StoreType } from '../../../../stores/Store'
import { setLoading, setLocalUpdateScreens, setToastMessage, ToastMessage } from '../../../../stores/UtilSlice'
import { getUuidv4 } from '../../../../utils/Utils'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { SwitchPage } from '../../../../components/template/SwitchPage'
import { SiteDateBox, SiteDateInfoType } from '../../../../components/organisms/site/SiteDateBox'
import { BottomMargin } from '../../../../components/atoms/BottomMargin'
import { writeNewConstructionToCache, getMyConstructionDetail } from '../../../../usecases/construction/MyConstructionCase'
import { MyConstructionDetailUIType } from './ConstructionDetail'
import { deleteConstructionSite, writeConstructionSite } from '../../../../usecases/site/MySiteCase'
import { createDeletingSiteInstruction } from '../../../../usecases/site/MySiteInstructionCase'
import { useIsFocused } from '@react-navigation/native'
import { ConstructionDetailRouterContext } from './ConstructionDetailRouter'
import { AppButton } from '../../../../components/atoms/AppButton'
import { checkIsHolidayOfConstruction } from '../../../../usecases/worker/WorkerListCase'
import { checkLockOfTarget } from '../../../../usecases/lock/CommonLockCase'
import { updateCachedData, getCachedData, genKeyName } from '../../../../usecases/CachedDataCase'
import { getErrorMessage, getErrorToastMessage } from '../../../../services/_others/ErrorService'
import { useSafeUnmount } from '../../../../fooks/useUnmount'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'
import { useTextTranslation } from './../../../../fooks/useTextTranslation'
import { getUpdateScreenOfTargetAccountAndScreen } from '../../../../usecases/updateScreens/CommonUpdateScreensCase'
import { splitIdAndDates, UpdateScreenType } from '../../../../models/updateScreens/UpdateScreens'
import {
    approveTargetInstruction,
    getTargetInstructionSites,
    getTargetInstruction,
    unApproveTargetInstruction,
    deleteTargetInstruction,
} from '../../../../usecases/construction/MyConstructionInstructionCase'
import { ShadowBoxWithHeader } from '../../../../components/organisms/shadowBox/ShadowBoxWithHeader'
import { _getInstructionListByConstructionId } from '../../../../services/instruction/InstructionService'
import { _getFirestore } from '../../../../services/firebase/FirestoreService'
import { MonthlySiteType } from '../../../../models/site/MonthlySiteType'
import { SiteCLType, SiteType, toSiteCLType } from '../../../../models/site/Site'
import flatten from 'lodash/flatten'
import uniqBy from 'lodash/uniqBy'
import { checkMyDepartment } from '../../../../usecases/department/DepartmentCase'
import { departmentsToText } from '../../../../usecases/worker/CommonWorkerCase'
import { setIsCacheReady } from '../../../../stores/CacheSlice'
import { ProjectType } from '../../../../models/project/Project'
import { ConstructionType } from '../../../../models/construction/Construction'
import { toConstructionCLType } from '../../../../models/construction/Construction'
import { RequestCLType } from '../../../../models/request/Request'
import { CompanyCLType } from '../../../../models/company/Company'
import { ContractCLType, ContractType } from '../../../../models/contract/Contract'
import { DateDataType } from '../../../../models/date/DateDataType'
import { SiteArrangementModel } from '../../../../models/arrangement/SiteArrangement'

type NavProps = StackNavigationProp<RootStackParamList, 'ConstructionSiteList'>
type RouteProps = RouteProp<RootStackParamList, 'ConstructionSiteList'>

type InitialStateType = {
    selectedMonth?: CustomDate
    monthlySite?: MonthlySiteType
    construction?: MyConstructionDetailUIType
    updateCache: number
    isConstructionFetching: boolean
    isSitesFetching: boolean
    updateIdAndMonths?: string[]
    updatedMonths?: YYYYMMDateType[]
    instructionSites?: SiteDateObjectUIType // まとめて作成の現場
    isShowApproveButton?: boolean //作業指示の承認ボタンを表示するかどうか
}
type ExtendedDateDataType = {
    monthlyData: DateDataType[]
    projects: ProjectType[]
}
const thisMonth = newCustomDate()

const initialState: InitialStateType = {
    selectedMonth: thisMonth,
    updateCache: 0,
    isConstructionFetching: false,
    isSitesFetching: false,
}

export type SiteDateObjectUIType = { [Day in string]: SiteDateInfoType[] }

type CachedMonthlySiteType = {
    monthlySite: MonthlySiteType
    construction: ConstructionType
}

type CachedSiteDetailType = {
    site?: SiteCLType
    request?: RequestCLType
    contractor?: CompanyCLType
    contract?: ContractCLType
    updatedAt?: number
}

/**
 * 画面を開いたら、データを取得=>取得中にキャッシュを先に表示する。
 * キャッシュはあるけど、工事がなかったら、工事だけDBフェッチ。
 */
const ConstructionSiteList = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const dispatch = useDispatch()
    const loading = useSelector((state: StoreType) => state.util.loading)
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const myWorkerId = useSelector((state: StoreType) => state.account.signInUser?.workerId)
    const accountId = useSelector((state: StoreType) => state.account.signInUser?.accountId ?? '')
    const holidays = useSelector((state: StoreType) => state.util.holidays)
    const [{ selectedMonth, monthlySite, construction, isConstructionFetching, isSitesFetching, updateIdAndMonths, updatedMonths, instructionSites, isShowApproveButton }, setState] =
        useState(initialState)
    const { constructionId, startDate, isNewProject, supportType, contractor } = useContext(ConstructionDetailRouterContext)

    const unsubscribeRef = useRef<any>(null)
    const isScreenOnRef = useRef<boolean>(false)

    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating) //アップデート中として、trueの時はヘッダーのアプデが押せなくなる。
    const localUpdateScreens = useSelector((state: StoreType) => state?.util?.localUpdateScreens)
    const activeDepartments = useSelector((state: StoreType) => state.account?.activeDepartments)
    const activeDepartmentIds = useMemo(() => activeDepartments?.map((dep) => dep?.departmentId).filter((data) => data != undefined) as string[], [activeDepartments])

    const [dateUpdate, setDateUpdate] = useState(0)
    const _getTargetInstructionSites = async () => {
        const instructionType = 'site'
        if (constructionId) {
            const instructionResult = await getTargetInstructionSites({ constructionId, instructionType })
            setState((prev) => ({ ...prev, instructionSites: instructionResult.success }))
        }
    }

    const constructionCL = useMemo(() => (construction ? toConstructionCLType(construction) : undefined), [construction])

    const [isFirstDayCreated, setIsFirstDayCreated] = useState(false)
    const projectStartDate = useMemo(() => {
        if (startDate) {
            if (typeof startDate === 'number') {
                return toCustomDateFromTotalSeconds(startDate)
            }
            return startDate
        }
    }, [startDate])

    useEffect(() => {
        if (isFocused) {
            ;(async () => {
                const updateResult = await getUpdateScreenOfTargetAccountAndScreen({
                    accountId,
                    screenName: 'ConstructionSiteList',
                })
                const updateScreen = updateResult.success
                setState((prev) => ({ ...prev, updateIdAndMonths: updateScreen?.idAndDates ?? [] }))
            })()

            setState((prev) => ({ ...prev, isSitesFetching: true, isConstructionFetching: true }))
        }

        isScreenOnRef.current = isFocused
    }, [isFocused])

    /**
     * 作成編集削除により、キャッシュと表示内容が異なる場合にDBフェッチ
     */
    useEffect(() => {
        ;(async () => {
            if (selectedMonth && constructionId && isFocused) {
                const LocalTargetScreen = localUpdateScreens.filter((screen) => screen.screenName == 'ConstructionSiteList')[0]
                const localIdAndDateObjArr = splitIdAndDates(LocalTargetScreen?.idAndDates)
                const localTargetIdAndDatesObjArr = localIdAndDateObjArr?.filter(
                    (obj) => obj.id == constructionId && obj.date >= getMonthlyFirstDay(selectedMonth).totalSeconds && obj.date <= getMonthlyFinalDay(selectedMonth).totalSeconds,
                )
                if (localTargetIdAndDatesObjArr && localTargetIdAndDatesObjArr.length > 0) {
                    /**
                     * 作成編集者本人はUpdateScreensが更新される前に遷移するため、Storeで対応
                     */
                    setState((prev) => ({ ...prev, isSitesFetching: true, isConstructionFetching: true, updatedMonths: [...(updatedMonths ?? []), monthBaseText(selectedMonth)] }))
                } else {
                    const updateIdAndDateObjArr = splitIdAndDates(updateIdAndMonths)
                    const targetIdAndDatesObjArr = updateIdAndDateObjArr?.filter(
                        (obj) =>
                            obj.id == constructionId &&
                            obj.date >= getMonthlyFirstDay(selectedMonth).totalSeconds &&
                            obj.date <= getMonthlyFinalDay(selectedMonth).totalSeconds &&
                            !updatedMonths?.includes(monthBaseText(toCustomDateFromTotalSeconds(obj.date))),
                    )
                    if (targetIdAndDatesObjArr && targetIdAndDatesObjArr?.length > 0) {
                        dispatch(setIsNavUpdating(true))
                        setState((prev) => ({ ...prev, isSitesFetching: true, isConstructionFetching: true, updatedMonths: [...(updatedMonths ?? []), monthBaseText(selectedMonth)] }))
                    }
                }
            }
        })()
    }, [selectedMonth, updateIdAndMonths])

    /**
     * 内容としては、sitesのようなものだが、実際に表示するための配列であり、現場あるなしに関わらず、日数分存在する。
     */
    const monthlyData = useMemo(() => {
        if (selectedMonth == undefined) {
            return []
        }
        let _monthlyData: SiteDateInfoType[] = []
        if (constructionCL?.project?.startDate == undefined || constructionCL?.project?.endDate == undefined) {
            return _monthlyData
        }
        const monthlyDays = getMonthlyDays(selectedMonth)
        let dateNow = cloneDeep(getMonthlyFirstDay(selectedMonth))
        let instNum = 0
        if (!isEmpty(instructionSites)) {
            range(monthlyDays).forEach(async () => {
                if (instructionSites == undefined) {
                    return
                }
                instNum =
                    (instructionSites[dayBaseTextWithoutDate(dateNow)]?.filter((info) => info.instruction?.instructionStatus != 'approved' && info.instruction?.instructionStatus != 'unapproved')
                        .length ?? 0) + instNum
                // 現場の修正指示が存在していれば工期外でも休みでも表示。
                if (instructionSites[dayBaseTextWithoutDate(dateNow)]) {
                    _monthlyData = [
                        ..._monthlyData,
                        ...(instructionSites[dayBaseTextWithoutDate(dateNow)]
                            ? [
                                  ...instructionSites[dayBaseTextWithoutDate(dateNow)].map((siteDateInfo) => {
                                      return {
                                          ...siteDateInfo,
                                          construction, //instructionにはないconstructionを入れる
                                      }
                                  }),
                              ]
                            : [
                                  {
                                      date: dateNow,
                                  },
                              ]),
                    ]
                    // 既存現場も表示
                } else if (instructionSites[dayBaseTextWithoutDate(dateNow)] == undefined && monthlySite != undefined) {
                    const targetSite = monthlySite?.sites?.items?.find((site) =>
                        site.siteDate ? dayBaseTextWithoutDate(dateNow) == dayBaseTextWithoutDate(toCustomDateFromTotalSeconds(site.siteDate)) : undefined,
                    )
                    // 現場が存在していれば工期外でも休みでも表示。
                    if (targetSite) {
                        _monthlyData = [
                            ..._monthlyData,
                            ...[
                                {
                                    ...targetSite,
                                    date: dateNow,
                                },
                            ],
                        ]
                    }
                } else {
                    if (constructionCL?.project?.startDate == undefined || constructionCL?.project?.endDate == undefined) {
                        return
                    }
                    // 工期判定（日付単位）
                    if (
                        dateNow.totalSeconds >= getDailyStartTime(constructionCL.project?.startDate).totalSeconds &&
                        dateNow.totalSeconds < getDailyStartTime(nextDay(constructionCL.project?.endDate, 1)).totalSeconds
                    ) {
                        // 休み除外
                        if (!checkIsHolidayOfConstruction(constructionCL, dateNow, holidays)) {
                            _monthlyData.push({
                                date: dateNow,
                            })
                        }
                    }
                }

                dateNow = nextDay(dateNow)
            })
            if (instNum > 0) {
                setState((prev) => ({ ...prev, isShowApproveButton: true }))
            } else {
                setState((prev) => ({ ...prev, isShowApproveButton: false }))
            }
        } else {
            range(monthlyDays).forEach(async () => {
                const targetSite = monthlySite?.sites?.items?.find((site) =>
                    site.siteDate ? dayBaseTextWithoutDate(dateNow) == dayBaseTextWithoutDate(toCustomDateFromTotalSeconds(site.siteDate)) : undefined,
                )
                // 現場が存在していれば工期外でも休みでも表示。
                if (targetSite) {
                    _monthlyData = [
                        ..._monthlyData,
                        ...[
                            {
                                ...targetSite,
                                date: dateNow,
                            },
                        ],
                    ]
                } else {
                    if (constructionCL?.project?.startDate == undefined || constructionCL?.project?.endDate == undefined) {
                        return
                    }
                    // 工期判定（日付単位）
                    if (
                        dateNow.totalSeconds >= getDailyStartTime(constructionCL.project?.startDate).totalSeconds &&
                        dateNow.totalSeconds < getDailyStartTime(nextDay(constructionCL.project?.endDate, 1)).totalSeconds
                    ) {
                        // 休み除外
                        if (!checkIsHolidayOfConstruction(constructionCL, dateNow, holidays)) {
                            _monthlyData.push({
                                date: dateNow,
                            })
                        }
                    }
                }

                dateNow = nextDay(dateNow)
            })
        }
        return _monthlyData
    }, [monthlySite, constructionCL, instructionSites]) //月が変わったら、キャッシュなりDBなりから取得したデータでsitesが切り替わって、monthDataが変わるという流れ。

    const sitesExist = useMemo(() => {
        return monthlyData.filter((data) => data?.siteId != undefined).length > 0
    }, [monthlyData])

    useSafeUnmount(setState, initialState)

    useEffect(() => {
        return () => {
            setState({ ...initialState })
        }
    }, [])
    useSafeUnmount(setState, initialState, () => setDateUpdate(dateUpdate + 1))

    useEffect(() => {
        return () => {
            setState(initialState)
            setDateUpdate(dateUpdate + 1)
        }
    }, [myCompanyId])

    useEffect(() => {
        if (isNavUpdating && isFocused) {
            //アプデボタンが押された時・DBフェッチした月が違った時
            setState((prev) => ({ ...prev, isSitesFetching: true, isConstructionFetching: true }))
        }
    }, [isNavUpdating])

    useEffect(() => {
        if (projectStartDate) {
            setState((prev) => ({ ...prev, selectedMonth: projectStartDate }))
        }
    }, [projectStartDate])

    useEffect(() => {
        setState((prev) => ({ ...prev, isSitesFetching: true, isConstructionFetching: true }))
    }, [route])

    /**
     * DBフェッチ（現場）
     */
    useEffect(() => {
        ;(async () => {
            try {
                /**
                 * 更新ロジック用
                 * 初回更新なくす。fetchは数字よりbooleanの方が初回更新を防げて良い。
                 */
                if (!isScreenOnRef.current) return
                if (constructionId == undefined || selectedMonth == undefined || isSitesFetching != true) {
                    return
                }
                if (isFocused) {
                    dispatch(setLoading(true))
                }

                const __startOfMonth = cloneDeep(getMonthlyFirstDay(selectedMonth))

                /**
                 * monthが切り替わる前に先に生成。
                 */
                const __cachedKey = genKeyName({
                    screenName: 'ConstructionSiteList',
                    accountId: accountId,
                    companyId: myCompanyId as string,
                    constructionId: constructionId as string,
                    /** "/" はKVSのキーに使えない文字のため "-" に変換 */
                    month: __startOfMonth ? monthBaseText(__startOfMonth).replace(/\//g, '-') : '',
                })
                const result = await getCachedData<CachedMonthlySiteType>(__cachedKey)

                const db = _getFirestore()
                unsubscribeRef.current = db
                    .collection('MonthlySite')
                    .where('companyId', '==', myCompanyId)
                    .where('constructionId', '==', constructionId)
                    .where('month', '>=', __startOfMonth?.totalSeconds)
                    .where('month', '<', nextMonth(__startOfMonth).totalSeconds)
                    .onSnapshot(async (data) => {
                        const _monthlyData = data.docs.map((doc) => doc.data())[0] as MonthlySiteType | undefined
                        if (_monthlyData == undefined) {
                            dispatch(setLoading(false))
                            dispatch(setIsNavUpdating(false))
                            setState((prev) => ({ ...prev, isSitesFetching: false }))
                            return
                        }
                        if (result.success) {
                            if (result.success.monthlySite && result.success.monthlySite.updatedAt && _monthlyData?.updatedAt && result.success.monthlySite.updatedAt > _monthlyData?.updatedAt) {
                                // キャッシュよりDBが古い場合、更新しない
                                return
                            }
                        }
                        const isMonthlySiteUpdated = JSON.stringify(monthlySite) != JSON.stringify(_monthlyData)
                        if (isMonthlySiteUpdated) {
                            setState((prev) => ({ ...prev, monthlySite: _monthlyData, isSitesFetching: false }))
                            await updateCachedData({
                                key: __cachedKey,
                                value: {
                                    monthlySite: _monthlyData,
                                    construction: result?.success?.construction,
                                },
                            })
                        }
                        dispatch(setLoading(false))
                        dispatch(setIsNavUpdating(false))
                        setState((prev) => ({ ...prev, isSitesFetching: false }))
                    })
                if (result.success) {
                    setState((prev) => ({ ...prev, monthlySite: result.success?.monthlySite }))
                } else {
                    setState((prev) => ({ ...prev, monthlySite: undefined }))
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
                setState((prev) => ({ ...prev, isSitesFetching: false }))
                dispatch(setLoading(false))
                dispatch(setIsNavUpdating(false))
            }
        })()
    }, [isSitesFetching])

    // 画面を閉じたときに時にonSnapshotをunsubscribeする
    useEffect(() => {
        return () => {
            if (unsubscribeRef.current && isScreenOnRef.current) {
                unsubscribeRef.current()
                unsubscribeRef.current = null
                isScreenOnRef.current = false
            }
        }
    }, [isFocused])

    // 月変更時にonSnapshotをunsubscribeする（前月のデータ更新が続くのを防ぐため）
    useEffect(() => {
        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current()
                unsubscribeRef.current = null
            }
        }
    }, [selectedMonth])

    /**
     * キャッシュが不足していた場合DBフェッチ（工事）
     */
    useEffect(() => {
        ;(async () => {
            try {
                /**
                 * 更新ロジック用
                 * 初回更新なくす。fetchは数字よりbooleanの方が初回更新を防げて良い。
                 */
                if (constructionId == undefined || selectedMonth == undefined) {
                    return
                }

                /**
                 * emptyScreenの場合にチラつくので、とりあえず外す
                 */
                // if (isFocused) dispatch(setLoading(true))

                const __startOfMonth = cloneDeep(getMonthlyFirstDay(selectedMonth))
                const __cachedKey = genKeyName({
                    screenName: 'ConstructionSiteList',
                    accountId: accountId,
                    companyId: myCompanyId as string,
                    constructionId: constructionId as string,
                    month: __startOfMonth ? monthBaseText(__startOfMonth).replace(/\//g, '-') : '',
                })
                const cachedResult = await getCachedData<CachedMonthlySiteType>(__cachedKey ?? 'no-id')
                const result = await getMyConstructionDetail({
                    constructionId,
                    myCompanyId,
                    holidays,
                })

                if (cachedResult.success && cachedResult.success.construction) {
                    setState((prev) => ({ ...prev, construction: cachedResult.success?.construction }))
                    if (result.success?.constructionId == undefined) {
                        // サーバからデータ取得できない場合、更新しない
                        return
                    }
                    if (cachedResult.success.construction.updatedAt && result?.success?.updatedAt && cachedResult.success.construction.updatedAt > result?.success?.updatedAt) {
                        // キャッシュよりDBが古い場合、更新しない
                        return
                    }
                }
                if (result.error) {
                    throw {
                        error: result.error,
                    }
                }
                const _construction = result.success
                /**
                 * キャッシュアップデート前に先に表示データを更新。
                 */
                setState((prev) => ({ ...prev, construction: _construction }))
                if (
                    (_construction?.constructionRelation == 'order-children' && _construction?.contract?.orderCompany?.companyPartnership == 'my-company') ||
                    (_construction?.constructionRelation == 'manager' && _construction?.contract?.orderCompany?.companyPartnership == 'partner')
                ) {
                    _getTargetInstructionSites()
                }

                dispatch(setLoading(false))
            } catch (error) {
                const _error = error as CustomResponse
                dispatch(
                    setToastMessage({
                        text: getErrorToastMessage(_error),
                        type: 'error',
                    } as ToastMessage),
                )
            } finally {
                dispatch(setLoading(false))
                setState((prev) => ({ ...prev, isConstructionFetching: false }))
            }
        })()
    }, [isConstructionFetching])

    // 新規案件の場合、初日の現場を自動作成
    useEffect(() => {
        if (!isFirstDayCreated && isNewProject && constructionCL?.project?.startDate && constructionCL?.project?.endDate) {
            try {
                ;(async () => {
                    setIsFirstDayCreated(true)
                    dispatch(setIsCacheReady(false))

                    const addSiteResult = await _addSite(constructionCL.project?.startDate)
                    if (addSiteResult.error) {
                        return
                    }

                    if (isFocused) {
                        dispatch(setLoading(false))
                    }

                    const newConstructionResult = await writeNewConstructionToCache({
                        myCompanyId,
                        accountId,
                        construction: construction,
                        project: construction?.project,
                        date: construction?.project?.startDate,
                        contractId: construction?.contractId,
                        dispatch,
                    })

                    if (newConstructionResult.error) {
                        throw {
                            error: newConstructionResult.error,
                            errorCode: newConstructionResult.errorCode,
                        }
                    }

                    dispatch(setIsCacheReady(true))
                })()
            } catch (error) {
                const _error = error as CustomResponse
                dispatch(
                    setToastMessage({
                        text: getErrorToastMessage(_error),
                        type: 'error',
                    } as ToastMessage),
                )
                dispatch(setIsCacheReady(true))
            } finally {
                if (isFocused) {
                    dispatch(setLoading(false))
                }
            }
        }
    }, [constructionCL, isFirstDayCreated])

    const _onRefresh = async () => {
        setState((prev) => ({ ...prev, isSitesFetching: true, isConstructionFetching: true }))
    }

    const _updateSiteDetailCache = async (site: SiteType, contract?: ContractCLType, contractor?: CompanyCLType, respondRequestId?: string) => {
        const cachedSiteDetailKey = genKeyName({
            screenName: 'SiteDetail',
            accountId: accountId ?? '',
            siteId: site.siteId ?? '',
            companyId: myCompanyId ?? '',
            workerId: myWorkerId ?? '',
            requestId: respondRequestId ?? '',
        })
        const siteDetailCacheData = await getCachedData<CachedSiteDetailType>(cachedSiteDetailKey)

        if (siteDetailCacheData.success?.site) {
            siteDetailCacheData.success.site = toSiteCLType(site)
        } else {
            siteDetailCacheData.success = {
                contract: contract,
                contractor: contractor,
                request: siteDetailCacheData.success?.request,
                site: toSiteCLType(site),
            }
        }
        await updateCachedData({
            key: cachedSiteDetailKey,
            value: siteDetailCacheData.success,
        })
    }

    const _updateAdminHomeCache = async (newSite: SiteType) => {
        const adminHomeCacheKey = genKeyName({
            screenName: 'AdminHome',
            accountId: accountId,
            companyId: myCompanyId as string,
            month: selectedMonth ? monthBaseText(selectedMonth).replace(/\//g, '-') : '',
        })
        const adminHomeCacheData = await getCachedData<ExtendedDateDataType>(adminHomeCacheKey)
        let cachedResult
        if (construction) {
            const targetDateData = adminHomeCacheData.success?.monthlyData.find((dateData) => dateData.date == newSite.siteDate)
            if (targetDateData) {
                const newAdminHomeData = adminHomeCacheData.success?.monthlyData.map((dateData) => {
                    if (dateData.date == newSite.siteDate && dateData.sites?.totalSites?.items) {
                        dateData.sites.totalSites.items = uniqBy([...dateData?.sites?.totalSites?.items, ...([newSite] ?? [])], 'siteId')
                        dateData.updatedAt = Number(new Date())
                    }
                    if (dateData.date == newSite?.siteDate && dateData?.arrangementSummary?.sitesCount && dateData?.sites?.totalSites?.items) {
                        dateData.arrangementSummary.sitesCount = dateData.sites.totalSites.items.length
                    }
                    if (dateData.date == newSite?.siteDate && dateData?.attendanceSummary?.sitesCount && dateData?.sites?.totalSites?.items) {
                        dateData.attendanceSummary.sitesCount = dateData.sites.totalSites.items.length
                    }
                    return dateData
                })
                cachedResult = await updateCachedData({ key: adminHomeCacheKey, value: { monthlyData: newAdminHomeData ?? [] } })
            } else {
                const newDateData = {
                    date: newSite.siteDate,
                    sites: {
                        totalSites: { items: [newSite] ?? [] },
                    },
                    updatedAt: Number(new Date()),
                    arrangementSummary: { siteCount: 1 },
                    attendanceSummary: { siteCount: 1 },
                } as DateDataType
                adminHomeCacheData.success?.monthlyData.push(newDateData)
                cachedResult = await updateCachedData({ key: adminHomeCacheKey, value: { monthlyData: adminHomeCacheData.success?.monthlyData ?? [] } })
            }
        }
    }

    const _updateDateArrangementsCache = async (newSite: SiteType) => {
        const dateArrangementsCacheKey = genKeyName({
            screenName: 'DateRouter',
            accountId: accountId ?? '',
            companyId: myCompanyId ?? '',
            date: newSite.siteDate ? dayBaseTextWithoutDate(toCustomDateFromTotalSeconds(newSite.siteDate)).replace(/\//g, '-') : '',
        })
        const dateArrangementsCacheData = await getCachedData<DateDataType>(dateArrangementsCacheKey)
        let cachedResult
        if (dateArrangementsCacheData.success) {
            if (dateArrangementsCacheData.success.sites?.totalSites?.items) {
                dateArrangementsCacheData.success.sites.totalSites.items.push(newSite)
            } else {
                dateArrangementsCacheData.success = {
                    ...dateArrangementsCacheData.success,
                    sites: {
                        totalSites: {
                            items: [newSite],
                        },
                    },
                }
            }
            dateArrangementsCacheData.success.updatedAt = Number(new Date())
            cachedResult = await updateCachedData({ key: dateArrangementsCacheKey, value: dateArrangementsCacheData.success })
        } else {
            const newDateData = {
                date: newSite.siteDate,
                sites: {
                    totalSites: { items: [newSite] ?? [] },
                },
                updatedAt: Number(new Date()),
                arrangementSummary: { siteCount: 1 },
                attendanceSummary: { siteCount: 1 },
            } as DateDataType
            dateArrangementsCacheData.success = newDateData
            cachedResult = await updateCachedData({ key: dateArrangementsCacheKey, value: dateArrangementsCacheData.success })
        }
    }

    const _addSite = async (date?: CustomDate): Promise<CustomResponse> => {
        try {
            if (
                constructionCL?.contract?.receiveCompanyId == myCompanyId &&
                !checkMyDepartment({
                    targetDepartmentIds: constructionCL?.contract?.receiveDepartmentIds,
                    activeDepartmentIds,
                })
            ) {
                throw {
                    error:
                        t('admin:TheContractIsInAnotherDepartmentPleaseSwitchDepartments') +
                        '\n' +
                        t('common:Department') +
                        ': ' +
                        departmentsToText(constructionCL?.contract?.receiveDepartments?.items),
                    errorCode: 'ADD_SITE_ERROR',
                }
            }
            if (constructionId == undefined) {
                throw {
                    error: t('admin:NoConstructionInformationAvailable'),
                    errorCode: 'ADD_SITE_ERROR',
                }
            }
            if (date == undefined) {
                throw {
                    error: t('admin:NoOnsiteDateAndTime'),
                    errorCode: 'ADD_SITE_ERROR',
                }
            }
            dispatch(setLoading('unTouchable'))

            // DB挿入されるまでに時間かかるため、先に新規現場を画面に表示させる
            const startDate = combineTimeAndDay(constructionCL?.siteStartTime ?? DEFAULT_SITE_START_TIME, nextDay(date, constructionCL?.siteStartTimeIsNextDay ? 1 : 0))?.totalSeconds
            const endDate = combineTimeAndDay(constructionCL?.siteEndTime ?? DEFAULT_SITE_END_TIME, nextDay(date, constructionCL?.siteEndTimeIsNextDay ? 1 : 0))?.totalSeconds
            const meetingDate = combineTimeAndDay(constructionCL?.siteMeetingTime, date)?.totalSeconds
            const requiredNum = constructionCL?.siteRequiredNum
            const address = constructionCL?.siteAddress
            const belongings = constructionCL?.siteBelongings
            const remarks = constructionCL?.siteRemarks
            const newSiteId = getUuidv4()
            const newSite: SiteType = {
                siteId: newSiteId,
                constructionId,
                startDate,
                endDate,
                meetingDate,
                requiredNum,
                address,
                belongings,
                remarks,
                siteDate: date.totalSeconds,
                construction: {
                    ...(constructionCL as ConstructionType),
                    siteStartTime: constructionCL?.siteStartTime?.totalSeconds,
                    siteEndTime: constructionCL?.siteEndTime?.totalSeconds,
                    siteMeetingTime: constructionCL?.siteMeetingTime?.totalSeconds,
                    name: constructionCL?.name,
                    project: {
                        name: constructionCL?.project?.name,
                        startDate: constructionCL?.project?.startDate?.totalSeconds,
                        endDate: constructionCL?.project?.endDate?.totalSeconds,
                    },
                    contract: {
                        ...(constructionCL?.contract as ContractType),
                    }
                },
                siteNameData: {
                    name: construction?.name,
                    construction: construction,
                },
                siteRelation: 'manager',
                updatedAt: Number(new Date()),
            }
            let _monthlySite = cloneDeep(monthlySite)
            if (_monthlySite?.sites) {
                _monthlySite?.sites?.items?.push(newSite)
                _monthlySite.updatedAt = Number(new Date())
            } else {
                _monthlySite = {
                    sites: {
                        items: [newSite],
                    },
                    updatedAt: Number(new Date()),
                }
            }

            if (startDate) {
                const __startOfMonth = cloneDeep(getMonthlyFirstDay(toCustomDateFromTotalSeconds(startDate)))
                const __cachedKey = genKeyName({
                    screenName: 'ConstructionSiteList',
                    accountId: accountId,
                    companyId: myCompanyId as string,
                    constructionId: constructionId as string,
                    month: __startOfMonth ? monthBaseText(__startOfMonth).replace(/\//g, '-') : '',
                })
                const constructionSiteListCacheData = await getCachedData<CachedMonthlySiteType>(__cachedKey)
                await updateCachedData({
                    key: __cachedKey,
                    value: {
                        monthlySite: _monthlySite,
                        construction: constructionSiteListCacheData.success?.construction,
                    },
                })
            }
            // 現場詳細キャッシュ更新
            _updateSiteDetailCache(newSite, constructionCL?.contract, constructionCL?.contract?.orderCompany)
            // AdminHomeキャッシュ更新
            _updateAdminHomeCache(newSite)
            // 日付管理キャッシュ更新
            _updateDateArrangementsCache(newSite)

            setState((prev) => ({ ...prev, monthlySite: _monthlySite }))

            const result = await writeConstructionSite({
                siteId: newSiteId,
                constructionId,
                myCompanyId,
                date: date,
                constructionRelation: constructionCL?.constructionRelation,
                startTime: constructionCL?.siteStartTime,
                endTime: constructionCL?.siteEndTime,
                siteStartTimeIsNextDay: constructionCL?.siteStartTimeIsNextDay,
                siteEndTimeIsNextDay: constructionCL?.siteEndTimeIsNextDay,
                meetingTime: constructionCL?.siteMeetingTime,
                requiredNum: constructionCL?.siteRequiredNum,
                address: constructionCL?.siteAddress,
                belongings: constructionCL?.siteBelongings,
                remarks: constructionCL?.siteRemarks,
                projectId: constructionCL?.contract?.projectId,
            })
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: result.errorCode,
                }
            }

            return Promise.resolve({
                success: undefined,
            })
        } catch (error) {
            const _error = error as CustomResponse
            dispatch(
                setToastMessage({
                    text: getErrorToastMessage(_error),
                    type: 'error',
                } as ToastMessage),
            )
            return getErrorMessage(error)
        } finally {
            if (isFocused) {
                dispatch(setLoading(false))
            }
        }
    }

    const _deleteSite = async (siteId?: string, date?: CustomDate) => {
        try {
            if (siteId == undefined) {
                throw {
                    error: t('admin:NoOnsiteInformationAvailable'),
                }
            }
            if (
                constructionCL?.contract?.receiveCompanyId == myCompanyId &&
                !checkMyDepartment({
                    targetDepartmentIds: constructionCL?.contract?.receiveDepartmentIds,
                    activeDepartmentIds,
                })
            ) {
                throw {
                    error:
                        t('admin:TheContractIsInAnotherDepartmentPleaseSwitchDepartments') +
                        '\n' +
                        t('common:Department') +
                        ': ' +
                        departmentsToText(constructionCL?.contract?.receiveDepartments?.items),
                    errorCode: 'DELETE_SITE_ERROR',
                }
            }
            dispatch(setLoading('unTouchable'))
            const lockResult = await checkLockOfTarget({
                myWorkerId: myWorkerId ?? 'no-id',
                targetId: siteId ?? 'no-id',
                modelType: 'site',
            })
            if (lockResult.error) {
                throw {
                    error: lockResult.error,
                }
            }
            const _monthlySite = cloneDeep(monthlySite)
            if (_monthlySite?.sites?.items != undefined) {
                const newSiteItems = _monthlySite.sites.items.filter((site) => site.siteId != siteId)
                _monthlySite.sites.items = newSiteItems
            }
            setState((prev) => ({ ...prev, monthlySite: _monthlySite }))
            const result = await deleteConstructionSite({
                siteId,
            })
            if (result.error) {
                throw {
                    error: result.error,
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
        } finally {
            if (isFocused) {
                dispatch(setLoading(false))
            }
        }
    }

    const _onDateChange = async (date: CustomDate) => {
        setState((prev) => ({
            ...prev,
            selectedMonth: date,
            isSitesFetching: true,
        }))
    }

    /**
     * monthlyDataは日数分作成されて、日付必須と、現場情報が含まれている。
     */
    const _renderItem: ListRenderItem<SiteDateInfoType> = (info: ListRenderItemInfo<SiteDateInfoType>) => {
        const { item, index } = info
        return (
            <SiteDateBox
                style={{
                    marginHorizontal: 5,
                    marginTop: 8,
                }}
                item={item}
                constructionRelation={constructionCL?.constructionRelation}
                companyPartnership={constructionCL?.contract?.orderCompany?.companyPartnership}
                supportType={supportType}
                contractor={contractor}
            />
        )
    }

    const _approveInstructionSites = async () => {
        try {
            if (
                constructionCL?.contract?.receiveCompanyId == myCompanyId &&
                !checkMyDepartment({
                    targetDepartmentIds: constructionCL?.contract?.receiveDepartmentIds,
                    activeDepartmentIds,
                })
            ) {
                throw {
                    error:
                        t('admin:TheContractIsInAnotherDepartmentPleaseSwitchDepartments') +
                        '\n' +
                        t('common:Department') +
                        ': ' +
                        departmentsToText(constructionCL?.contract?.receiveDepartments?.items),
                    errorCode: 'APPROVE_INSTRUCTION_SITES_ERROR',
                }
            }
            for (const key in instructionSites) {
                const instructionSite = instructionSites[key]
                dispatch(setLoading('unTouchable'))
                const lockResult = await checkLockOfTarget({
                    myWorkerId: myWorkerId ?? 'no-id',
                    targetId: instructionSite[0].siteId ?? 'no-id',
                    modelType: 'instruction',
                })
                if (lockResult.error) {
                    if (isFocused) {
                        dispatch(setLoading(false))
                    }
                    throw {
                        error: lockResult.error,
                    }
                }
                const siteId = instructionSite[0].siteId
                const startDate = instructionSite[0].startDate
                const endDate = instructionSite[0].endDate
                const result = await approveTargetInstruction({ 
                    targetRequestId: siteId, 
                    projectId: constructionCL?.project?.projectId,
                    startDate: startDate,
                    endDate: endDate,
                })

                if (isFocused) {
                    dispatch(setLoading(false))
                }
                if (result.error) {
                    throw {
                        error: result.error,
                    }
                }
            }
            setState((prev) => ({ ...prev, isSitesFetching: true, isConstructionFetching: true }))
            dispatch(
                setToastMessage({
                    text: t('admin:InstructionApproved'),
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
        }
    }

    const _deleteSiteInstruction = async (siteId?: string, contractId?: string, date?: CustomDate) => {
        try {
            if (
                !checkMyDepartment({
                    targetDepartmentIds: constructionCL?.contract?.orderDepartmentIds,
                    activeDepartmentIds,
                })
            ) {
                throw {
                    error:
                        t('admin:TheContractIsInAnotherDepartmentPleaseSwitchDepartments') +
                        '\n' +
                        t('common:Department') +
                        ': ' +
                        departmentsToText(constructionCL?.contract?.orderDepartments?.items),
                    errorCode: 'DELETE_SITE_INSTRUCTION_ERROR',
                }
            }
            dispatch(setLoading('unTouchable'))
            const lockResult = await checkLockOfTarget({
                myWorkerId: myWorkerId ?? 'no-id',
                targetId: siteId ?? 'no-id',
                modelType: 'instruction',
            })
            if (lockResult.error) {
                if (isFocused) {
                    dispatch(setLoading(false))
                }
                throw {
                    error: lockResult.error,
                }
            }
            const targetRequestId = String(siteId)
            const siteEditInstruction = await getTargetInstruction({ targetRequestId, instructionType: 'site', holidays })
            const siteCreateInstruction = await getTargetInstruction({ targetRequestId, instructionType: 'siteCreate', holidays })
            let instructionId = undefined
            if (siteEditInstruction.success?.instructionId) {
                instructionId = siteEditInstruction.success?.instructionId
            } else {
                instructionId = siteCreateInstruction.success?.instructionId
            }
            if (instructionId) {
                const result = await deleteTargetInstruction({ instructionId })
                if (isFocused) {
                    dispatch(setLoading(false))
                }
                if (result.error) {
                    throw {
                        error: result.error,
                    }
                }
                _getTargetInstructionSites()
                dispatch(
                    setToastMessage({
                        text: t('admin:InstructionDeleted'),
                        type: 'success',
                    } as ToastMessage),
                )
            } else {
                const result = await createDeletingSiteInstruction({ siteId, contractId })
                if (isFocused) {
                    dispatch(setLoading(false))
                }
                if (result.error) {
                    throw {
                        error: result.error,
                    }
                }
                _getTargetInstructionSites()
                dispatch(
                    setToastMessage({
                        text: t('admin:DeleteSiteInstructionCreated'),
                        type: 'success',
                    } as ToastMessage),
                )
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

    const _unApproveInstructionSites = async () => {
        try {
            if (
                constructionCL?.contract?.receiveCompanyId == myCompanyId &&
                !checkMyDepartment({
                    targetDepartmentIds: constructionCL?.contract?.receiveDepartmentIds,
                    activeDepartmentIds,
                })
            ) {
                throw {
                    error:
                        t('admin:TheContractIsInAnotherDepartmentPleaseSwitchDepartments') +
                        '\n' +
                        t('common:Department') +
                        ': ' +
                        departmentsToText(constructionCL?.contract?.receiveDepartments?.items),
                    errorCode: 'UN_APPROVE_INSTRUCTION_SITES_ERROR',
                }
            }
            for (const key in instructionSites) {
                const instructionSite = instructionSites[key]
                dispatch(setLoading('unTouchable'))
                const lockResult = await checkLockOfTarget({
                    myWorkerId: myWorkerId ?? 'no-id',
                    targetId: instructionSite[0].siteId ?? 'no-id',
                    modelType: 'instruction',
                })
                if (lockResult.error) {
                    if (isFocused) {
                        dispatch(setLoading(false))
                    }
                    throw {
                        error: lockResult.error,
                    }
                }
                const siteId = instructionSite[0].siteId
                const result = await unApproveTargetInstruction({ targetRequestId: siteId })
                if (isFocused) {
                    dispatch(setLoading(false))
                }
                if (result.error) {
                    throw {
                        error: result.error,
                    }
                }
            }
            setState((prev) => ({ ...prev, isSitesFetching: true, isConstructionFetching: true }))
            dispatch(
                setToastMessage({
                    text: t('admin:InstructionNotApproved'),
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
        }
    }

    const _header = () => {
        if (constructionCL?.contract?.status == 'created') {
            return (
                <View
                    style={{
                        paddingTop: 65,
                        backgroundColor: '#fff',
                        borderBottomColor: THEME_COLORS.OTHERS.BORDER_COLOR,
                        borderBottomWidth: 1,
                        paddingBottom: 15,
                    }}></View>
            )
        }

        return (
            <View
                style={{
                    paddingTop: 60,
                    backgroundColor: '#fff',
                    borderBottomColor: THEME_COLORS.OTHERS.BORDER_COLOR,
                    borderBottomWidth: 1,
                }}>
                {!isEmpty(instructionSites) && isShowApproveButton && constructionCL?.constructionRelation == 'manager' && (
                    <>
                        <ShadowBoxWithHeader
                            title={t('admin:Instruction')}
                            style={{
                                marginTop: 10,
                            }}>
                            <AppButton
                                style={{
                                    marginTop: 10,
                                }}
                                title={t('admin:ApproveAllSiteInstructions')}
                                isGray
                                onPress={() => {
                                    Alert.alert(t('admin:WantToApproveInstructionTitle'), t('admin:WantToApproveInstructionMessage'), [
                                        { text: t('admin:Approve'), onPress: () => _approveInstructionSites() },
                                        {
                                            text: t('admin:Cancel'),
                                            style: 'cancel',
                                        },
                                    ])
                                }}
                            />

                            <AppButton
                                style={{
                                    marginTop: 10,
                                }}
                                title={t('admin:NotApproveAllSiteInstructions')}
                                isGray
                                onPress={() => {
                                    Alert.alert(t('admin:NotWantToApproveInstructionTitle'), t('admin:NotWantToApproveInstructionMessage'), [
                                        { text: t('admin:NotApprove'), onPress: () => _unApproveInstructionSites() },
                                        {
                                            text: t('admin:Cancel'),
                                            style: 'cancel',
                                        },
                                    ])
                                }}
                            />
                        </ShadowBoxWithHeader>
                    </>
                )}
                {constructionCL?.constructionRelation == 'order-children' && (
                    <>
                        <AppButton
                            title={t('admin:RequestEditingAllSitesTogether')}
                            style={{
                                marginHorizontal: 20,
                            }}
                            onPress={
                                checkMyDepartment({ targetDepartmentIds: constructionCL?.contract?.orderDepartmentIds, activeDepartmentIds })
                                    ? () => {
                                          navigation.push('EditBundleConstructionSchedule', { constructionId: constructionId, isInstruction: true })
                                      }
                                    : () =>
                                          dispatch(
                                              setToastMessage({
                                                  text:
                                                      t('admin:TheContractIsInAnotherDepartmentPleaseSwitchDepartments') +
                                                      '\n' +
                                                      t('common:Department') +
                                                      ': ' +
                                                      departmentsToText(constructionCL?.contract?.orderDepartments?.items),
                                                  type: 'error',
                                              } as ToastMessage),
                                          )
                            }
                        />
                        <Text style={{ ...GlobalStyles.smallGrayText, textAlign: 'center', marginTop: 15 }}>{t('admin:EditAllSitesTogetherDescription')}</Text>
                    </>
                )}
                {!isEmpty(instructionSites) && (
                    <View>
                        <Text
                            style={{
                                ...GlobalStyles.mediumText,
                                color: THEME_COLORS.OTHERS.ALERT_RED,
                                marginTop: 10,
                                textAlign: 'center',
                            }}>
                            {t('admin:InstructionStatusCreated')}
                        </Text>
                    </View>
                )}
            </View>
        )
    }

    const _footer = () => {
        if (constructionCL?.contract?.status == 'created') {
            return <></>
        }
        return (
            <>
                {constructionCL?.fakeCompanyInvReservationId == undefined && (constructionCL?.constructionRelation == 'fake-company-manager' || constructionCL?.constructionRelation == 'manager') && (
                    <AppButton
                        title={t('admin:CreateAnExtendedPeriodOfTime')}
                        style={{
                            marginHorizontal: 20,
                            marginTop: 20,
                        }}
                        onPress={() => {
                            //全曜日が定休日に指定されている場合は終了
                            if (constructionCL?.offDaysOfWeek?.length == 7) {
                                return
                            }
                            const lastDate = monthlyData.length > 0 ? monthlyData[monthlyData.length - 1].date : constructionCL?.project?.endDate ? nextDay(constructionCL?.project.endDate) : undefined
                            if (lastDate) {
                                let addDate = nextDay(lastDate)
                                const otherOffDaysSet = new Set(constructionCL?.otherOffDays?.map((date) => dayBaseTextWithoutDate(date)))
                                const offDaysOfWeekSet = new Set(constructionCL?.offDaysOfWeek)
                                while (
                                    offDaysOfWeekSet?.has(dayOfWeekText(addDate)) ||
                                    otherOffDaysSet.has(dayBaseTextWithoutDate(addDate)) ||
                                    (offDaysOfWeekSet.has('祝') && isHoliday(addDate, holidays))
                                ) {
                                    addDate = nextDay(addDate, 1)
                                }
                                _addSite(addDate)
                                if (constructionId) {
                                    const newLocalUpdateScreens: UpdateScreenType[] = [
                                        {
                                            screenName: 'ConstructionDetail',
                                            ids: [
                                                ...flatten(
                                                    localUpdateScreens
                                                        .filter((screen) => screen.screenName == 'ConstructionDetail')
                                                        .map((screen) => screen.ids?.filter((data) => data != undefined) as string[]),
                                                ),
                                                constructionId,
                                            ],
                                        },
                                    ]
                                    dispatch(setLocalUpdateScreens(uniqBy([...newLocalUpdateScreens, ...localUpdateScreens], 'screenName')))
                                }
                            }
                        }}
                        isGray
                        iconName="plus"
                        iconColor={THEME_COLORS.OTHERS.GRAY}
                    />
                )}
                <BottomMargin />
            </>
        )
    }

    return (
        <SwitchPage
            dateUpdate={dateUpdate}
            dateInitValue={selectedMonth}
            // 工期内だが現場がない月は空の配列を渡してemptyScreenを表示させる
            data={monthlyData.length > 0 && !sitesExist ? [] : monthlyData}
            backgroundColor={THEME_COLORS.OTHERS.SUPER_LIGHT_GRAY}
            content={_renderItem}
            header={_header}
            emptyProps={
                loading
                    ? undefined
                    : monthlyData.length > 0
                    ? {
                          text: t('common:ThereIsNoSite'),
                      }
                    : {
                          text: t('admin:OutsideConstructionPeriod'),
                      }
            }
            onDateChange={_onDateChange}
            footer={_footer}
            onRefresh={_onRefresh}
        />
    )
}
export default ConstructionSiteList

const styles = StyleSheet.create({})
