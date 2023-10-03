/* eslint-disable indent */
import React, { useState, useEffect, useContext, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, View, StyleSheet, Alert, ViewStyle } from 'react-native'
import { useNavigation, useRoute, RouteProp, useIsFocused } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { TableArea } from '../../../../components/atoms/TableArea'
import { CustomDate, dayBaseTextWithoutDate, getMonthlyFirstDay, getTextBetweenAnotherDate, monthBaseText, timeBaseText, toCustomDateFromTotalSeconds } from '../../../../models/_others/CustomDate'
import { Line } from '../../../../components/atoms/Line'
import { AppButton } from '../../../../components/atoms/AppButton'
import { CompanyCL } from '../../../../components/organisms/company/CompanyCL'
import { WorkerCL } from '../../../../components/organisms/worker/WorkerCL'
import { SiteMeter } from '../../../../components/organisms/site/SiteMeter'
import { ConstructionMeter } from '../../../../components/organisms/construction/ConstructionMeter'
import { SiteHeaderCL } from '../../../../components/organisms/site/SiteHeaderCL'
import { WorkerInfo, WorkerInfoType } from '../../../../components/organisms/worker/WorkerInfo'
import { ShadowBoxWithHeader } from '../../../../components/organisms/shadowBox/ShadowBoxWithHeader'
import { ConstructionHeaderCL } from '../../../../components/organisms/construction/ConstructionHeaderCL'
import { AddressMap } from '../../../../components/organisms/AddressMap'
import { BottomMargin } from '../../../../components/atoms/BottomMargin'
import { deleteConstructionSite, getSiteDetail } from '../../../../usecases/site/MySiteCase'
import flatten from 'lodash/flatten'
import isEmpty from 'lodash/isEmpty'
import uniqBy from 'lodash/uniqBy'
import { StoreType } from '../../../../stores/Store'
import { deleteParamOfLocalUpdateScreens, setLoading, setLocalUpdateScreens, setToastMessage, ToastMessage } from '../../../../stores/UtilSlice'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { GlobalStyles } from '../../../../utils/Styles'
import { goToCompanyDetail } from '../../../../usecases/company/CommonCompanyCase'
import { SiteCLType, SiteType } from '../../../../models/site/Site'
import { CompanyCLType, CompanyType } from '../../../../models/company/Company'
import { WorkerCLType } from '../../../../models/worker/Worker'
import { THEME_COLORS } from '../../../../utils/Constants'
import { RequestCLType } from '../../../../models/request/Request'
import { checkLockOfTarget } from '../../../../usecases/lock/CommonLockCase'
import { updateCachedData, getCachedData, genKeyName } from '../../../../usecases/CachedDataCase'
import { getErrorToastMessage } from '../../../../services/_others/ErrorService'
import { ScrollViewInstead } from '../../../../components/atoms/ScrollViewInstead'
import { useSafeLoadingUnmount, useSafeUnmount } from '../../../../fooks/useUnmount'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'
import { deleteParamOfUpdateScreens, checkUpdateOfTargetScreen } from '../../../../usecases/updateScreens/CommonUpdateScreensCase'
import { useTextTranslation } from '../../../../fooks/useTextTranslation'
import { toIdAndMonthFromStrings, toIdAndMonthFromTotalSeconds, UpdateScreenType } from '../../../../models/updateScreens/UpdateScreens'
import DisplayIdInDev from '../../../../components/atoms/DisplayIdInDEV'
import { InstructionCLType } from '../../../../models/instruction/Instruction'
import { approveTargetInstruction, deleteTargetInstruction, getTargetInstruction, unApproveTargetInstruction } from '../../../../usecases/construction/MyConstructionInstructionCase'
import { getSiteInstructionDetail } from '../../../../usecases/site/MySiteInstructionCase'
import { SiteRelationType } from '../../../../models/site/SiteRelationType'
import { updateRequestIsApproval } from '../../../../usecases/request/CommonRequestCase'
import { Tag } from '../../../../components/organisms/Tag'
import { getContractForEdit } from '../../../../usecases/contract/CommonContractCase'
import { ContractCLType } from '../../../../models/contract/Contract'
import { checkMyDepartment } from '../../../../usecases/department/DepartmentCase'
import { departmentsToText } from '../../../../usecases/worker/CommonWorkerCase'
import { cloneDeep } from 'lodash'
import { MonthlySiteType } from '../../../../models/site/MonthlySiteType'
import { ConstructionType } from '../../../../models/construction/Construction'
import { DateDataType } from '../../../../models/date/DateDataType'

type NavProps = StackNavigationProp<RootStackParamList, 'SiteDetail'>
type RouteProps = RouteProp<RootStackParamList, 'SiteDetail'>

type InitialStateType = {
    id?: string
    site?: SiteCLType
    request?: RequestCLType
    isFetching: boolean
    updateCache: number
    instruction?: InstructionCLType
    constructionRelation?: SiteRelationType
    contractor?: CompanyCLType
    contract?: ContractCLType
}

type CachedSiteDetailType = {
    site?: SiteCLType
    request?: RequestCLType
    contractor?: CompanyCLType
    contract?: ContractCLType
    updatedAt?: number
}

export type WorkerUIWithInfoType = WorkerCLType & WorkerInfoType

const initialState: InitialStateType = {
    isFetching: false,
    updateCache: 0,
}

type CachedMonthlySiteType = {
    monthlySite: MonthlySiteType
    construction: ConstructionType
}

/**
 *
 * @returns requestIdがあると常用依頼詳細画面になる。
 */
const SiteDetail = () => {
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const { t } = useTextTranslation()

    const [{ id, site, isFetching, request, updateCache, instruction, constructionRelation, contractor, contract }, setState] = useState(initialState)
    const {
        startDate,
        endDate,
        meetingDate,
        allArrangements: arrangements,
        isConfirmed,
        siteRelation,
        requiredNum,
        managerWorker,
        address,
        belongings,
        remarks,
        siteCompanies,
        construction,
    } = site ?? {}
    const { project } = construction ?? {}
    const dispatch = useDispatch()
    const siteId = route.params?.siteId
    const update = route.params?.update
    const requestId = route.params?.requestId
    const relatedCompanyId = route.params?.relatedCompanyId
    const instructionFromRouter = route.params?.instruction
    const contractorFromRouter = route.params?.contractor
    const supportType = route.params?.supportType
    // 仮会社施工のときはrequestIdを入れたくない
    const respondRequestId = requestId
    const myCompanyId = useSelector((state: StoreType) => state.account?.belongCompanyId)
    const signInUser = useSelector((state: StoreType) => state.account?.signInUser)
    const accountId = useSelector((state: StoreType) => state.account.signInUser?.accountId ?? '')
    const cachedSiteDetailKey = genKeyName({
        screenName: 'SiteDetail',
        accountId: signInUser?.accountId ?? '',
        siteId: siteId ?? '',
        companyId: myCompanyId ?? '',
        workerId: signInUser?.workerId ?? '',
        requestId: respondRequestId ?? '',
    })
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const localUpdateScreens = useSelector((state: StoreType) => state?.util?.localUpdateScreens)
    const activeDepartments = useSelector((state: StoreType) => state.account?.activeDepartments)
    const activeDepartmentIds = useMemo(() => activeDepartments?.map((dep) => dep?.departmentId).filter((data) => data != undefined) as string[], [activeDepartments])
    const holidays = useSelector((state: StoreType) => state?.util?.holidays)

    useSafeUnmount(setState, initialState)
    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        navigation.setOptions({
            title: route.params?.title ?? site?.siteNameData?.name ?? t('admin:SiteDetails'),
            headerTitleContainerStyle: {
                right: 20,
            },
        })
    }, [navigation, route.params?.title, site?.siteNameData?.name])

    useEffect(() => {
        if (isFocused) {
            setState((prev) => ({ ...prev, updateCache: updateCache + 1 }))

            /**
             * 作成編集削除により、キャッシュと表示内容が異なる場合にDBフェッチ
             */
            ;(async () => {
                const isUpdateResult = await checkUpdateOfTargetScreen({ targetId: id, accountId: signInUser?.accountId, targetScreenName: 'SiteDetail', localUpdateScreens })
                if (isUpdateResult.success) {
                    dispatch(setIsNavUpdating(true))
                }
            })()

            if (instructionFromRouter) {
                setState((prev) => ({ ...prev, instruction: instructionFromRouter }))
            }
            _getTargetInstruction()
        }
    }, [isFocused, id, signInUser, myCompanyId, update])

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            setState((prev) => ({ ...prev, isFetching: true }))
        }
    }, [isNavUpdating])

    useEffect(() => {
        if (siteId) {
            setState((prev) => ({ ...prev, id: siteId }))
        }
    }, [siteId])

    useEffect(() => {
        return () => setState(initialState)
    }, [myCompanyId])

    useEffect(() => {
        ;(async () => {
            try {
                if (isEmpty(siteId) || isEmpty(myCompanyId) || isEmpty(signInUser) || isFetching != true || !isFocused) {
                    return
                }
                if (!isEmpty(instruction) && instruction.instructionStatus != 'unapproved' && instruction.instructionStatus != 'approved') {
                    const siteInstructionResult = await getSiteInstructionDetail({
                        siteId: siteId,
                        myCompanyId,
                        myWorkerId: signInUser?.workerId,
                        requestId: respondRequestId,
                    })

                    if (siteInstructionResult.error || siteInstructionResult.success == undefined) {
                        throw {
                            error: siteInstructionResult.error,
                            errorCode: siteInstructionResult.errorCode,
                        }
                    }
                    setState((prev) => ({
                        ...prev,
                        // site: siteInstructionResult.success?.site,//非承認した時に、元の現場情報を取得するためにここでsiteを入れたかったが、現場を新規に作成した場合だとここに入っていないほうがいい？
                        constructionRelation: siteInstructionResult.success?.site?.construction?.constructionRelation,
                        contract: siteInstructionResult.success?.site?.construction?.contract,
                    }))
                } else if (!(instruction?.instructionType == 'siteCreate' && instruction?.instructionStatus == 'unapproved')) {
                    //現場作成指示を拒否した場合はSiteがないため取得しない
                    if (isFocused) dispatch(setLoading(true))

                    const siteResult = await getSiteDetail({
                        siteId: siteId,
                        myCompanyId,
                        myWorkerId: signInUser?.workerId,
                        requestId: respondRequestId,
                    })

                    if (siteResult.error || siteResult.success == undefined) {
                        throw {
                            error: siteResult.error,
                        }
                    }

                    let contractor: CompanyCLType | undefined
                    if (siteResult.success.site?.construction?.constructionRelation !== 'fake-company-manager') {
                        const contractResult = await getContractForEdit({
                            contractId: siteResult.success?.site?.construction?.contractId,
                            myCompanyId,
                        })
                        if (contractResult.error) {
                            throw {
                                error: contractResult.error,
                            }
                        }
                        contractor = contractResult.success?.orderCompany
                    }
                    const cachedResult = await getCachedData<CachedSiteDetailType>(cachedSiteDetailKey ?? 'no-id')
                    if (cachedResult.success) {
                        if (
                            siteResult.success?.site?.siteId == undefined ||
                            (cachedResult.success.site?.updatedAt &&
                                siteResult.success?.site.updatedAt &&
                                cachedResult.success.site.updatedAt.totalSeconds > siteResult.success.site.updatedAt.totalSeconds)
                        ) {
                            // キャッシュよりDBが古い場合、更新しない
                            setState((prev) => ({
                                ...prev,
                                site: cachedResult.success?.site,
                                request: cachedResult.success?.request,
                                contractor: cachedResult.success?.contractor,
                                contract: cachedResult.success?.site?.construction?.contract,
                            }))
                            return
                        }
                    }

                    /**
                     * キャッシュアップデート前に先に表示データを更新。
                     */
                    setState((prev) => ({
                        ...prev,
                        site: siteResult.success?.site,
                        request: siteResult.success?.request,
                        contractor: contractor !== undefined && contractor.companyId !== myCompanyId ? contractor : (contractorFromRouter as CompanyCLType),
                        contract: siteResult.success?.site?.construction?.contract,
                    }))
                    const cachedSiteResult = await updateCachedData({
                        key: cachedSiteDetailKey,
                        value: { site: siteResult.success?.site, request: siteResult.success?.request, contractor, contract: siteResult.success?.site?.construction?.contract },
                    })
                    if (cachedSiteResult.error) {
                        dispatch(
                            setToastMessage({
                                text: cachedSiteResult.error,
                                type: 'error',
                            }),
                        )
                    }
                    deleteParamOfLocalUpdateScreens({
                        screens: localUpdateScreens,
                        screenName: 'SiteDetail',
                        id,
                        paramName: 'ids',
                    })
                    await deleteParamOfUpdateScreens({
                        accountId: signInUser?.accountId,
                        screenName: 'SiteDetail',
                        id,
                        paramName: 'ids',
                    })
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
                    dispatch(setIsNavUpdating(false))
                }
                setState((prev) => ({ ...prev, isFetching: false }))
            }
        })()
        _getTargetInstruction()
    }, [isFetching])

    /**
     * @summary キャッシュを更新する副作用関数
     * @purpose アプリ側にKVSによるキャッシュを設けて初期表示速度を改善する
     * @author Okuda
     */
    useEffect(() => {
        ;(async () => {
            const result = await getCachedData<CachedSiteDetailType>(cachedSiteDetailKey)
            if (result.error) {
                if (result.errorCode != 'FIRST_FETCH') {
                    dispatch(
                        setToastMessage({
                            text: result.error,
                            type: 'error',
                        }),
                    )
                }
                setState((prev) => ({ ...prev, isFetching: true }))
            } else {
                setState((prev) => ({ ...prev, site: result.success?.site, request: result.success?.request, contractor: result.success?.contractor, contract: result.success?.contract }))
            }
        })()
    }, [updateCache])

    const _deleteSiteFromConstructionSiteListCache = async (site?: SiteCLType) => {
        if (site?.siteDate == undefined) return
        const __startOfMonth = cloneDeep(getMonthlyFirstDay(toCustomDateFromTotalSeconds(site.siteDate)))
        const __cachedKey = genKeyName({
            screenName: 'ConstructionSiteList',
            accountId: accountId,
            companyId: myCompanyId as string,
            constructionId: site?.construction?.constructionId as string,
            month: __startOfMonth ? monthBaseText(__startOfMonth).replace(/\//g, '-') : '',
        })
        const cachedResult = await getCachedData<CachedMonthlySiteType>(__cachedKey ?? 'no-id')
        const newSites = cachedResult.success?.monthlySite?.sites?.items?.filter((item) => item.siteId != site.siteId)
        if (cachedResult.success?.monthlySite?.sites?.items) {
            cachedResult.success.monthlySite.sites.items = newSites
        } else {
            if (cachedResult.success?.monthlySite?.sites) {
                cachedResult.success.monthlySite.sites = {
                    items: newSites,
                }
            }
        }
        await updateCachedData({
            key: __cachedKey,
            value: {
                monthlySite: cachedResult.success?.monthlySite ?? [],
                construction: cachedResult.success?.construction,
            },
        })
    }

    const _deleteSiteFromDateArrangementsCache = async (site?: SiteCLType) => {
        if (site?.siteDate == undefined) return
        const dateArrangementsCacheKey = genKeyName({
            screenName: 'DateRouter',
            accountId: accountId ?? '',
            companyId: myCompanyId ?? '',
            date: site?.siteDate ? dayBaseTextWithoutDate(toCustomDateFromTotalSeconds(site?.siteDate)).replace(/\//g, '-') : '',
        })
        const dateArrangementsCacheData = await getCachedData<DateDataType>(dateArrangementsCacheKey)
        let cachedResult
        if (dateArrangementsCacheData.success) {
            if (dateArrangementsCacheData.success.sites?.totalSites?.items) {
                dateArrangementsCacheData.success.sites.totalSites.items = dateArrangementsCacheData.success.sites?.totalSites?.items?.filter((item) => item.siteId != site?.siteId)
            } else {
                dateArrangementsCacheData.success = {
                    ...dateArrangementsCacheData.success,
                    sites: {
                        totalSites: {
                            items: [],
                        },
                    },
                }
            }
            dateArrangementsCacheData.success.updatedAt = Number(new Date())
            cachedResult = await updateCachedData({ key: dateArrangementsCacheKey, value: dateArrangementsCacheData.success })
        } else {
            const newDateData = {
                date: site?.siteDate,
                sites: {
                    totalSites: { items: [] },
                },
                updatedAt: Number(new Date()),
                arrangementSummary: { siteCount: 0 },
                attendanceSummary: { siteCount: 0 },
            } as DateDataType
            dateArrangementsCacheData.success = newDateData
            cachedResult = await updateCachedData({ key: dateArrangementsCacheKey, value: dateArrangementsCacheData.success })
        }
    }

    const _deleteSite = async (siteId?: string) => {
        try {
            if (
                contract?.receiveCompanyId == myCompanyId &&
                !checkMyDepartment({
                    targetDepartmentIds: contract?.receiveDepartmentIds,
                    activeDepartmentIds,
                })
            ) {
                throw {
                    error: t('admin:TheContractIsInAnotherDepartmentPleaseSwitchDepartments') + '\n' + t('common:Department') + ': ' + departmentsToText(contract?.receiveDepartments?.items),
                    errorCode: 'DELETE_SITE_ERROR',
                }
            }
            if (siteId == undefined) {
                throw {
                    error: t('common:NoFieldInfoAvailable'),
                }
            }
            dispatch(setLoading('unTouchable'))
            const lockResult = await checkLockOfTarget({
                myWorkerId: signInUser?.workerId ?? 'no-id',
                targetId: siteId ?? 'no-id',
                modelType: 'site',
            })
            if (lockResult.error) {
                if (isFocused) dispatch(setLoading(false))
                throw {
                    error: lockResult.error,
                }
            }
            // 現場一覧のキャッシュ更新
            _deleteSiteFromConstructionSiteListCache(site)
            // 日付管理のキャッシュ更新
            _deleteSiteFromDateArrangementsCache(site)
            const result = await deleteConstructionSite({
                siteId,
            })
            if (isFocused) dispatch(setLoading(false))
            if (result.error) {
                throw {
                    error: result.error,
                }
            }
            const constructionIdAndDate = toIdAndMonthFromTotalSeconds(construction?.constructionId, site?.meetingDate?.totalSeconds ?? site?.siteDate ?? 0)
            let newLocalUpdateScreens: UpdateScreenType[] = [
                {
                    screenName: 'ConstructionSiteList',
                    idAndDates: [...flatten(localUpdateScreens.filter((screen) => screen.screenName == 'ConstructionSiteList').map((screen) => screen.idAndDates)), constructionIdAndDate]?.filter(
                        (data) => data != undefined,
                    ) as string[],
                },
            ]
            if (relatedCompanyId) {
                const idAndDate = toIdAndMonthFromTotalSeconds(relatedCompanyId, site?.meetingDate?.totalSeconds ?? site?.siteDate ?? 0)
                newLocalUpdateScreens = [
                    ...newLocalUpdateScreens,
                    {
                        screenName: 'CompanyInvoice',
                        idAndDates: [...flatten(localUpdateScreens.filter((screen) => screen.screenName == 'CompanyInvoice').map((screen) => screen.idAndDates)), idAndDate]?.filter(
                            (data) => data != undefined,
                        ) as string[],
                    },
                ]
            }
            dispatch(setLocalUpdateScreens(uniqBy([...newLocalUpdateScreens, ...localUpdateScreens], 'screenName')))
            navigation.goBack()
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

    const myConstruction = construction?.constructionRelation == 'fake-company-manager' || construction?.constructionRelation == 'manager'

    const _getTargetInstruction = async () => {
        const targetRequestId = String(siteId)
        const instructionType = 'site'
        const instructionResult = await getTargetInstruction({ targetRequestId, instructionType, holidays })
        setState((prev) => ({ ...prev, instruction: instructionResult.success }))
    }

    const _approveInstruction = async (instruction: InstructionCLType) => {
        try {
            if (
                contract?.receiveCompanyId == myCompanyId &&
                !checkMyDepartment({
                    targetDepartmentIds: contract?.receiveDepartmentIds,
                    activeDepartmentIds,
                })
            ) {
                throw {
                    error: t('admin:TheContractIsInAnotherDepartmentPleaseSwitchDepartments') + '\n' + t('common:Department') + ': ' + departmentsToText(contract?.receiveDepartments?.items),
                    errorCode: 'APPROVE_INSTRUCTION_ERROR',
                }
            }
            dispatch(setLoading('unTouchable'))
            const lockResult = await checkLockOfTarget({
                myWorkerId: signInUser?.workerId ?? 'no-id',
                targetId: instruction?.instructionId ?? 'no-id',
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
            const instructionId = instruction?.instructionId
            const result = await approveTargetInstruction({ instructionId })
            if (isFocused) {
                dispatch(setLoading(false))
            }
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: result.errorCode,
                }
            }
            setState((prev) => ({ ...prev, instruction: { ...prev.instruction, instructionStatus: 'approved' } as InstructionCLType }))
            setTimeout(() => {
                setState((prev) => ({ ...prev, isFetching: true }))
            }, 100)
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

    const _unApproveInstruction = async (instruction: InstructionCLType) => {
        try {
            if (
                contract?.receiveCompanyId == myCompanyId &&
                !checkMyDepartment({
                    targetDepartmentIds: contract?.receiveDepartmentIds,
                    activeDepartmentIds,
                })
            ) {
                throw {
                    error: t('admin:TheContractIsInAnotherDepartmentPleaseSwitchDepartments') + '\n' + t('common:Department') + ': ' + departmentsToText(contract?.receiveDepartments?.items),
                    errorCode: 'UN_APPROVE_INSTRUCTION_ERROR',
                }
            }
            dispatch(setLoading('unTouchable'))
            const lockResult = await checkLockOfTarget({
                myWorkerId: signInUser?.workerId ?? 'no-id',
                targetId: instruction?.instructionId ?? 'no-id',
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
            const instructionId = instruction?.instructionId
            const result = await unApproveTargetInstruction({ instructionId })
            if (isFocused) {
                dispatch(setLoading(false))
            }
            if (result.error) {
                throw {
                    error: result.error,
                }
            }
            dispatch(
                setToastMessage({
                    text: t('admin:InstructionNotApproved'),
                    type: 'success',
                } as ToastMessage),
            )
            setState((prev) => ({ ...prev, instruction: { ...prev.instruction, instructionStatus: 'unapproved' } as InstructionCLType }))
            setTimeout(() => {
                setState((prev) => ({ ...prev, isFetching: true }))
            }, 100)
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

    const getInstructionStatusMessage = () => {
        if (instruction?.instructionStatus == 'created') {
            return 'admin:InstructionStatusCreated'
        } else if (instruction?.instructionStatus == 'edited') {
            return 'admin:InstructionStatusEdited'
        } else if (instruction?.instructionStatus == 'approved') {
            return 'admin:InstructionStatusApproved'
        } else if (instruction?.instructionStatus == 'unapproved') {
            return 'admin:InstructionStatusUnapproved'
        } else {
            return ''
        }
    }

    const _deleteSiteInstruction = async () => {
        try {
            if (
                !checkMyDepartment({
                    targetDepartmentIds: contract?.orderDepartmentIds,
                    activeDepartmentIds,
                })
            ) {
                throw {
                    error: t('admin:TheContractIsInAnotherDepartmentPleaseSwitchDepartments') + '\n' + t('common:Department') + ': ' + departmentsToText(contract?.orderDepartments?.items),
                    errorCode: 'DELETE_INSTRUCTION_ERROR',
                }
            }
            dispatch(setLoading('unTouchable'))
            const lockResult = await checkLockOfTarget({
                myWorkerId: signInUser?.workerId ?? 'no-id',
                targetId: instruction?.instructionId ?? 'no-id',
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
            const instructionId = instruction?.instructionId
            const result = await deleteTargetInstruction({ instructionId })
            if (isFocused) {
                dispatch(setLoading(false))
            }
            if (result.error) {
                throw {
                    error: result.error,
                }
            }
            dispatch(
                setToastMessage({
                    text: t('admin:InstructionDeleted'),
                    type: 'success',
                } as ToastMessage),
            )
            _getTargetInstruction()
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

    const getInstructionContents = (
        originValue: string | CustomDate | undefined | { siteStartTime?: CustomDate; siteEndTime?: CustomDate },
        instructionValue: string | CustomDate | undefined | { siteStartTime?: CustomDate; siteEndTime?: CustomDate },
        valueType?: string | undefined,
    ) => {
        // if (isEmpty(originValue)) {
        //     originValue = t('common:Undecided')
        // }
        // if (isEmpty(instructionValue)) {
        //     return `変更前：${originValue}\n変更後：変更なし`
        // }

        if (valueType == 'time') {
            originValue = originValue ? timeBaseText(originValue as CustomDate) : '未定'
            instructionValue = instructionValue ? timeBaseText(instructionValue as CustomDate) : '未定'
        } else if (valueType == 'workTime') {
            originValue = originValue as { siteStartTime: CustomDate; siteEndTime: CustomDate }
            originValue = originValue.siteStartTime ? getTextBetweenAnotherDate(originValue.siteStartTime, originValue.siteEndTime) : t('common:Undecided')
            instructionValue = instructionValue as { siteStartTime: CustomDate; siteEndTime: CustomDate }
            instructionValue = instructionValue.siteStartTime ? getTextBetweenAnotherDate(instructionValue.siteStartTime, instructionValue.siteEndTime) : t('common:Undecided')
        }

        if (originValue != instructionValue) {
            return `変更前：${originValue ?? 'なし'}\n変更後：${instructionValue ?? 'なし'}`
        } else {
            return `変更前：${originValue}\n変更後：変更なし`
        }
    }

    const getSiteSettingInstructionList = (instruction: InstructionCLType, meetingDate?: CustomDate, startDate?: CustomDate, endDate?: CustomDate, belongings?: string, remarks?: string) => {
        let instructionList = []
        if (
            (instruction.instructionInfo.meetingDate == undefined && meetingDate == undefined) ||
            (instruction.instructionInfo.meetingDate != undefined && meetingDate == undefined) ||
            (instruction.instructionInfo.meetingDate == undefined && meetingDate != undefined) ||
            timeBaseText(meetingDate as CustomDate) != timeBaseText(instruction.instructionInfo.meetingDate as CustomDate)
        ) {
            instructionList.push({
                key: '集合時間',
                content: getInstructionContents(meetingDate, instruction.instructionInfo.meetingDate, 'time'),
            })
        }
        if (
            (instruction.instructionInfo.startDate != undefined && startDate != undefined && timeBaseText(startDate) != timeBaseText(instruction.instructionInfo.startDate)) ||
            (instruction.instructionInfo.startDate != undefined && startDate == undefined) ||
            (instruction.instructionInfo.endDate != undefined && endDate != undefined && timeBaseText(endDate) != timeBaseText(instruction.instructionInfo.endDate)) ||
            (instruction.instructionInfo.endDate != undefined && endDate == undefined)
        ) {
            instructionList.push({
                key: '作業時間',
                content: getInstructionContents(
                    { siteStartTime: startDate, siteEndTime: endDate },
                    { siteStartTime: instruction.instructionInfo.startDate, siteEndTime: instruction.instructionInfo.endDate },
                    'workTime',
                ),
            })
        }
        if (instruction.instructionInfo.belongings && belongings != instruction.instructionInfo.belongings) {
            instructionList.push({
                key: '持ち物',
                content: getInstructionContents(belongings, instruction.instructionInfo.belongings),
            })
        }
        if (instruction.instructionInfo.remarks && remarks != instruction.instructionInfo.remarks) {
            instructionList.push({
                key: '備考',
                content: getInstructionContents(remarks, instruction.instructionInfo.remarks),
            })
        }
        return instructionList
    }

    const _setApproveRequest = async (isApproval: boolean) => {
        try {
            const isApprovalResult = await updateRequestIsApproval({ requestId: request?.requestId, isApproval })
            if (isFocused) {
                dispatch(setLoading(false))
            }
            if (isApprovalResult.error) {
                throw {
                    error: isApprovalResult.error,
                }
            }
            const companyIdAndDate = toIdAndMonthFromStrings(myCompanyId, request?.date)

            const newLocalUpdateScreens: UpdateScreenType[] = [
                {
                    screenName: 'CompanyInvoice',
                    idAndDates: [...flatten(localUpdateScreens.filter((screen) => screen.screenName == 'CompanyInvoice').map((screen) => screen.idAndDates)), companyIdAndDate]?.filter(
                        (data) => data != undefined,
                    ) as string[],
                },
            ]
            dispatch(setLocalUpdateScreens(uniqBy([...newLocalUpdateScreens, ...localUpdateScreens], 'screenName')))
            dispatch(
                setToastMessage({
                    text: isApproval ? t('admin:ApprovedTheRequestForSupport') : t('admin:TheRequestForSupportWasDenied'),
                    type: 'success',
                } as ToastMessage),
            )
            setState((prev) => ({ ...prev, isFetching: true }))
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

    return (
        <ScrollViewInstead
            style={{
                flex: 1,
                backgroundColor: '#fff',
            }}>
            {site != undefined && (
                <>
                    {(respondRequestId != undefined || construction?.constructionRelation == 'fake-company-manager') && (
                        <View
                            style={{
                                backgroundColor: THEME_COLORS.OTHERS.LIGHT_ORANGE,
                                padding: 5,
                                paddingLeft: 10,
                                paddingTop: 7,
                                alignItems: 'center',
                            }}>
                            <Text
                                style={{
                                    ...GlobalStyles.mediumText,
                                }}>
                                {t('common:SupportRequest')}
                            </Text>
                        </View>
                    )}
                    {!isEmpty(instruction) && instruction.instructionStatus != 'approved' && (
                        <>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    paddingTop: 10,
                                    paddingLeft: 10,
                                    width: '100%',
                                }}>
                                <Text
                                    style={{
                                        color: THEME_COLORS.OTHERS.ALERT_RED,
                                    }}>
                                    {t(getInstructionStatusMessage())}
                                </Text>
                            </View>
                            <View
                                style={{
                                    marginTop: 5,
                                    marginLeft: 10,
                                    marginRight: 10,
                                }}>
                                {getSiteSettingInstructionList(instruction, meetingDate, startDate, endDate, belongings, remarks).length > 0 && (
                                    <>
                                        <Text style={GlobalStyles.mediumText}>{t('admin:SiteDetailInstructions')}</Text>
                                        <TableArea columns={getSiteSettingInstructionList(instruction, meetingDate, startDate, endDate, belongings, remarks)} />
                                    </>
                                )}
                                {address != instruction.instructionInfo.address && (
                                    <>
                                        <AddressMap
                                            location={{
                                                address: address,
                                            }}
                                            style={{
                                                marginTop: 10,
                                            }}
                                        />
                                        <AddressMap
                                            location={{
                                                address: instruction.instructionInfo.address,
                                            }}
                                            style={{
                                                marginTop: 10,
                                            }}
                                            isInstruction={true}
                                        />
                                    </>
                                )}
                            </View>
                            <View
                                style={{
                                    marginTop: 5,
                                    marginLeft: 10,
                                    marginRight: 10,
                                }}>
                                {instruction.instructionType == 'siteDelete' && (
                                    <>
                                        <Text style={GlobalStyles.mediumText}>{t('admin:SiteDetailInstructions')}</Text>
                                        <Text style={[GlobalStyles.mediumText, { padding: 10, borderRadius: 5, backgroundColor: THEME_COLORS.OTHERS.TABLE_AREA_PURPLE }]}>
                                            {t('admin:DeleteThisSiteInstructions')}
                                        </Text>
                                    </>
                                )}
                            </View>
                        </>
                    )}
                    <SiteHeaderCL
                        style={{
                            marginHorizontal: 10,
                            marginTop: 15,
                        }}
                        displayDay
                        titleStyle={
                            {
                                ...GlobalStyles.smallGrayText,
                            } as ViewStyle
                        }
                        isRequest={request != undefined}
                        siteNameStyle={
                            {
                                ...GlobalStyles.boldText,
                            } as ViewStyle
                        }
                        site={{ ...site, siteMeter: request != undefined ? request.requestMeter : site?.siteMeter, isConfirmed: request != undefined ? request.isConfirmed : site?.isConfirmed }}
                    />
                    {/* fake-company-managerの場合はrequestArrangementを作成してないので、メーター表示が違ってくる。 */}
                    {/* TODO: 発注管理下からの自社への常用依頼のみ存在する。対応必要 */}
                    {/* {request == undefined &&
                        site.siteRelation != 'fake-company-manager' &&
                        site?.companyRequests?.receiveRequests?.items
                            ?.filter((req) => (req.requestMeter?.companyRequiredNum ?? 0) > 0)
                            ?.map((_request, index) => {
                                return (
                                    <ShadowBoxWithHeader
                                        key={index}
                                        style={{
                                            marginHorizontal: 10,
                                            marginTop: 10,
                                        }}
                                        headerColor={THEME_COLORS.OTHERS.LIGHT_ORANGE}
                                        titleColor={'#000'}
                                        title={'自社への常用依頼'}
                                        onPress={() => {
                                            navigation.push('SiteDetail', {
                                                siteId,
                                                requestId: _request.requestId,
                                                title: site.siteNameData?.name,
                                                siteNumber: site.siteNameData?.siteNumber,
                                            })
                                        }}
                                    >
                                        <Request request={_request} type={'order'} />
                                    </ShadowBoxWithHeader>
                                )
                            })} */}
                    <Line
                        style={{
                            marginTop: 15,
                            marginHorizontal: 10,
                        }}
                    />
                    {(isEmpty(instruction) || instruction.instructionStatus == 'approved' || instruction.instructionStatus == 'unapproved') && (
                        <TableArea
                            style={{
                                margin: 10,
                                marginTop: 15,
                            }}
                            columns={[
                                { key: '集合時間', content: meetingDate ? timeBaseText(meetingDate) : '未定' },
                                { key: '作業開始', content: startDate ? getTextBetweenAnotherDate(startDate, endDate) : '未定' },
                                { key: '持ち物', content: belongings },
                                { key: '備考', content: remarks },
                            ]}
                        />
                    )}
                    {(isEmpty(instruction) || instruction.instructionStatus == 'approved' || instruction.instructionStatus == 'unapproved') && (
                        <AddressMap
                            style={{
                                marginHorizontal: 10,
                                marginTop: 10,
                                marginBottom: 10,
                            }}
                            location={{
                                address: address,
                            }}
                        />
                    )}
                    {managerWorker != undefined && (
                        <ShadowBoxWithHeader
                            style={{
                                marginHorizontal: 10,
                                marginTop: 10,
                            }}
                            title={t('common:PersonInCharge')}
                            onPress={
                                myConstruction
                                    ? () => {
                                          if (managerWorker.workerId) {
                                              navigation.push('WorkerDetailRouter', {
                                                  title: managerWorker.name,
                                                  workerId: managerWorker.workerId,
                                              })
                                          }
                                      }
                                    : undefined
                            }>
                            <>
                                {managerWorker.name != undefined && (
                                    <>
                                        <WorkerCL worker={managerWorker} />
                                        {!(managerWorker.phoneNumber == undefined && managerWorker.account?.email == undefined) && (
                                            <Line
                                                style={{
                                                    marginTop: 10,
                                                }}
                                            />
                                        )}
                                        <WorkerInfo phoneNumber={managerWorker.phoneNumber} email={managerWorker.account?.email} />
                                    </>
                                )}
                                {managerWorker.name == undefined && <Text style={[GlobalStyles.smallText]}>{t('admin:NoOnsiteManager')}</Text>}
                            </>
                        </ShadowBoxWithHeader>
                    )}
                    {request?.company != undefined && (
                        <ShadowBoxWithHeader
                            style={{
                                marginHorizontal: 10,
                                marginTop: 10,
                            }}
                            title={t('common:Requester')}
                            onPress={
                                request?.company?.companyPartnership != undefined && request?.company?.companyPartnership != 'others'
                                    ? () => {
                                          goToCompanyDetail(navigation, request.company?.companyId, request.company?.name, myCompanyId)
                                      }
                                    : undefined
                            }>
                            <CompanyCL
                                style={{
                                    flex: 1,
                                }}
                                company={request.company}
                            />
                        </ShadowBoxWithHeader>
                    )}
                    {construction?.constructionRelation != 'other-company' && request == undefined && siteCompanies?.managerCompany != undefined && (
                        <ShadowBoxWithHeader
                            style={{
                                marginHorizontal: 10,
                                marginTop: 10,
                            }}
                            title={
                                supportType === 'support-receive' || supportType === 'support-order' || construction?.constructionRelation === 'fake-company-manager'
                                    ? t('admin:SupportAgreement')
                                    : t('admin:ContractAgreement')
                            }
                            onPress={
                                siteCompanies?.managerCompany?.companyPartnership != undefined && siteCompanies?.managerCompany?.companyPartnership != 'others'
                                    ? () => {
                                          goToCompanyDetail(navigation, siteCompanies?.managerCompany?.companyId, siteCompanies?.managerCompany?.name, myCompanyId)
                                      }
                                    : undefined
                            }>
                            <View
                                style={{
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                }}>
                                {contractor && construction?.constructionRelation !== 'owner' && construction?.constructionRelation !== 'fake-company-manager' && (
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                        }}>
                                        <Tag style={{ marginTop: 15, marginRight: 5 }} tag={t('common:Client')} color={THEME_COLORS.OTHERS.TABLE_AREA_PURPLE} fontColor={THEME_COLORS.OTHERS.GRAY} />
                                        <CompanyCL
                                            style={{
                                                flex: 1,
                                            }}
                                            company={contractor}
                                            departments={contract?.orderDepartments}
                                        />
                                    </View>
                                )}
                                {supportType !== 'support-order' && (
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                        }}>
                                        <Tag
                                            style={{ marginTop: 15, marginRight: 5 }}
                                            tag={construction?.constructionRelation === 'fake-company-manager' ? t('common:Client') : t('common:Construct')}
                                            color={THEME_COLORS.OTHERS.TABLE_AREA_PURPLE}
                                            fontColor={THEME_COLORS.OTHERS.GRAY}
                                        />
                                        <CompanyCL
                                            style={{
                                                flex: 1,
                                                marginTop: siteCompanies?.managerCompany.companyId === myCompanyId ? 16 : 0,
                                            }}
                                            hasLastDeal={siteCompanies?.managerCompany.companyId === myCompanyId ? false : true}
                                            company={
                                                siteCompanies?.managerCompany.companyId === myCompanyId
                                                    ? {
                                                          ...siteCompanies?.managerCompany,
                                                          companyPartnership: 'my-company',
                                                      }
                                                    : siteCompanies?.managerCompany?.isFake === true
                                                    ? {
                                                          ...siteCompanies?.managerCompany,
                                                          companyPartnership: 'fake-partner',
                                                      }
                                                    : {
                                                          ...siteCompanies?.managerCompany,
                                                          companyPartnership: 'partner',
                                                      }
                                            }
                                            departments={construction?.constructionRelation === 'fake-company-manager' ? undefined : contract?.receiveDepartments}
                                        />
                                    </View>
                                )}
                            </View>
                        </ShadowBoxWithHeader>
                    )}
                    {request == undefined && construction != undefined && (
                        <ShadowBoxWithHeader
                            style={{
                                marginHorizontal: 10,
                                marginTop: 10,
                            }}
                            title={t('common:Construction')}
                            onPress={
                                myConstruction
                                    ? () => {
                                          navigation.push('ConstructionDetailRouter', {
                                              title: construction.name,
                                              constructionId: construction.constructionId,
                                              projectId: project?.projectId,
                                          })
                                      }
                                    : undefined
                            }>
                            <ConstructionHeaderCL displayName={construction.displayName} constructionRelation={construction.constructionRelation} />
                            {construction?.constructionRelation != undefined && construction?.constructionRelation != 'other-company' && (
                                <ConstructionMeter
                                    style={{
                                        marginTop: 5,
                                    }}
                                    requiredCount={construction.constructionMeter?.requiredNum}
                                    presentCount={construction.constructionMeter?.presentNum}
                                />
                            )}
                        </ShadowBoxWithHeader>
                    )}
                    {(isEmpty(instruction) || instruction.instructionStatus == 'approved' || instruction.instructionStatus == 'unapproved') && request == undefined && myConstruction && (
                        <View
                            style={{
                                marginTop: 15,
                                marginHorizontal: 10,
                            }}>
                            <Line />
                            <AppButton
                                title={t('common:EditBy')}
                                style={{
                                    marginTop: 20,
                                }}
                                onPress={
                                    contract?.orderCompanyId != myCompanyId || checkMyDepartment({ targetDepartmentIds: contract?.orderDepartmentIds, activeDepartmentIds })
                                        ? () => {
                                              navigation.push('EditSite', {
                                                  siteId: siteId,
                                                  constructionId: construction?.constructionId,
                                                  mode: 'edit',
                                                  projectId: project?.projectId ?? 'no-id',
                                              })
                                          }
                                        : () =>
                                              dispatch(
                                                  setToastMessage({
                                                      text:
                                                          t('admin:TheContractIsInAnotherDepartmentPleaseSwitchDepartments') +
                                                          '\n' +
                                                          t('common:Department') +
                                                          ': ' +
                                                          departmentsToText(contract?.orderDepartments?.items),
                                                      type: 'error',
                                                  } as ToastMessage),
                                              )
                                }
                            />
                            {site.fakeCompanyInvRequestId == undefined && (
                                <AppButton
                                    title={t('common:Delete')}
                                    isGray={true}
                                    height={35}
                                    style={{
                                        marginTop: 15,
                                    }}
                                    onPress={() => {
                                        Alert.alert(t('admin:WantToRemoveTheSite'), t('common:OperationCannotBeUndone'), [
                                            { text: t('common:Deletion'), onPress: () => _deleteSite(siteId) },
                                            {
                                                text: t('common:Cancel'),
                                                style: 'cancel',
                                            },
                                        ])
                                    }}
                                />
                            )}
                        </View>
                    )}
                    {!isEmpty(instruction) && instruction?.instructionStatus != 'approved' && instruction?.instructionStatus != 'unapproved' && construction?.constructionRelation == 'manager' && (
                        <>
                            <Line
                                style={{
                                    marginTop: 20,
                                }}
                            />
                            <View
                                style={{
                                    marginTop: 10,
                                }}>
                                <ShadowBoxWithHeader
                                    title={t('admin:Instruction')}
                                    style={{
                                        marginTop: 10,
                                    }}>
                                    <AppButton
                                        style={{
                                            marginTop: 10,
                                        }}
                                        title={t('admin:Approve')}
                                        isGray
                                        onPress={() => {
                                            Alert.alert(t('admin:WantToApproveInstructionTitle'), t('admin:WantToApproveInstructionMessage'), [
                                                { text: t('admin:Approve'), onPress: () => _approveInstruction(instruction) },
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
                                        title={t('admin:NotApprove')}
                                        isGray
                                        onPress={() => {
                                            Alert.alert(t('admin:NotWantToApproveInstructionTitle'), t('admin:NotWantToApproveInstructionMessage'), [
                                                { text: t('admin:NotApprove'), onPress: () => _unApproveInstruction(instruction) },
                                                {
                                                    text: t('admin:Cancel'),
                                                    style: 'cancel',
                                                },
                                            ])
                                        }}
                                    />
                                </ShadowBoxWithHeader>
                            </View>
                        </>
                    )}
                    {construction?.constructionRelation == 'order-children' && (
                        <>
                            <Line
                                style={{
                                    marginTop: 20,
                                    marginLeft: 10,
                                    marginRight: 10,
                                }}
                            />
                            <View
                                style={{
                                    marginTop: 10,
                                    marginLeft: 10,
                                    marginRight: 10,
                                }}>
                                <AppButton
                                    style={{
                                        marginTop: 10,
                                    }}
                                    title={t('admin:RequestEditingSiteInfo')}
                                    onPress={
                                        contract?.orderCompanyId != myCompanyId || checkMyDepartment({ targetDepartmentIds: contract?.orderDepartmentIds, activeDepartmentIds })
                                            ? () => {
                                                  navigation.push('EditSite', {
                                                      siteId: siteId,
                                                      constructionId: construction?.constructionId,
                                                      mode: 'edit',
                                                      isInstruction: true,
                                                      projectId: contract?.projectId ?? 'no-id',
                                                  })
                                              }
                                            : () =>
                                                  dispatch(
                                                      setToastMessage({
                                                          text:
                                                              t('admin:TheContractIsInAnotherDepartmentPleaseSwitchDepartments') +
                                                              '\n' +
                                                              t('common:Department') +
                                                              ': ' +
                                                              departmentsToText(contract?.orderDepartments?.items),
                                                          type: 'error',
                                                      } as ToastMessage),
                                                  )
                                    }
                                />
                                {!isEmpty(instruction) && instruction.instructionStatus != 'approved' && (
                                    <AppButton
                                        style={{
                                            marginTop: 10,
                                        }}
                                        title={t('admin:DeleteInstruction')}
                                        isGray
                                        onPress={() => {
                                            Alert.alert(t('admin:WantToDeleteInstruction'), t('admin:OperationCannotBeUndone'), [
                                                { text: t('admin:Deletion'), onPress: () => _deleteSiteInstruction() },
                                                {
                                                    text: t('admin:Cancel'),
                                                    style: 'cancel',
                                                },
                                            ])
                                        }}
                                    />
                                )}
                            </View>
                        </>
                    )}
                    {!isEmpty(respondRequestId) && request?.isApproval != undefined && (
                        <AppButton
                            style={{
                                marginTop: 10,
                            }}
                            title={request.isApproval == 'waiting' ? t('admin:Approve') : request.isApproval == true ? t('admin:approved') : t('common:unauthorized')}
                            isGray
                            onPress={() => {
                                Alert.alert(t('admin:DoYouWishToApproveTheSupportRequest'), undefined, [
                                    { text: t('admin:Approve'), onPress: () => _setApproveRequest(true) },
                                    {
                                        text: t('common:Cancel'),
                                        style: 'cancel',
                                    },
                                ])
                            }}
                            disabled={request.isApproval == 'waiting' ? false : true}
                        />
                    )}
                    {!isEmpty(respondRequestId) && request?.isApproval == 'waiting' && (
                        <AppButton
                            style={{
                                marginTop: 10,
                            }}
                            title={t('admin:NotApprove')}
                            isGray
                            onPress={() => {
                                Alert.alert(t('admin:DoYouWantToDisapproveTheSupportRequest'), undefined, [
                                    { text: t('admin:NotApprove'), onPress: () => _setApproveRequest(false) },
                                    {
                                        text: t('common:Cancel'),
                                        style: 'cancel',
                                    },
                                ])
                            }}
                        />
                    )}
                </>
            )}
            {site == undefined && !isEmpty(instruction) && instruction.instructionStatus != 'approved' && (
                <>
                    <View
                        style={{
                            flexDirection: 'row',
                            paddingTop: 10,
                            paddingLeft: 10,
                            width: '100%',
                        }}>
                        <Text
                            style={{
                                color: THEME_COLORS.OTHERS.ALERT_RED,
                            }}>
                            {t(getInstructionStatusMessage())}
                        </Text>
                    </View>
                    <View
                        style={{
                            marginTop: 5,
                            marginLeft: 10,
                            marginRight: 10,
                        }}>
                        <Text style={GlobalStyles.mediumText}>{t('admin:SiteCreateDetailInstructions')}</Text>
                        <TableArea
                            style={{
                                margin: 10,
                                marginTop: 15,
                            }}
                            columns={[
                                { key: '集合時間', content: instruction.instructionInfo.meetingDate ? timeBaseText(instruction.instructionInfo.meetingDate) : '未定' },
                                {
                                    key: '作業開始',
                                    content: instruction.instructionInfo.startDate ? getTextBetweenAnotherDate(instruction.instructionInfo.startDate, instruction.instructionInfo.endDate) : '未定',
                                },
                                { key: '持ち物', content: instruction.instructionInfo.belongings },
                                { key: '備考', content: instruction.instructionInfo.remarks },
                            ]}
                        />
                        <AddressMap
                            location={{
                                address: instruction.instructionInfo.address,
                            }}
                            style={{
                                marginTop: 10,
                            }}
                        />
                    </View>
                    <View
                        style={{
                            marginTop: 5,
                            marginLeft: 10,
                            marginRight: 10,
                        }}>
                        {instruction.instructionType == 'siteDelete' && (
                            <>
                                <Text style={GlobalStyles.mediumText}>{t('admin:SiteDetailInstructions')}</Text>
                                <Text style={[GlobalStyles.mediumText, { padding: 10, borderRadius: 5, backgroundColor: THEME_COLORS.OTHERS.TABLE_AREA_PURPLE }]}>
                                    {t('admin:DeleteThisSiteInstructions')}
                                </Text>
                            </>
                        )}
                    </View>
                    {!isEmpty(instruction) && instruction?.instructionStatus != 'unapproved' && constructionRelation == 'manager' && (
                        <>
                            <Line
                                style={{
                                    marginTop: 20,
                                }}
                            />
                            <View
                                style={{
                                    marginTop: 10,
                                }}>
                                <ShadowBoxWithHeader
                                    title={t('admin:Instruction')}
                                    style={{
                                        marginTop: 10,
                                    }}>
                                    <AppButton
                                        style={{
                                            marginTop: 10,
                                        }}
                                        title={t('admin:Approve')}
                                        isGray
                                        onPress={() => {
                                            Alert.alert(t('admin:WantToApproveInstructionTitle'), t('admin:WantToApproveInstructionMessage'), [
                                                { text: t('admin:Approve'), onPress: () => _approveInstruction(instruction) },
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
                                        title={t('admin:NotApprove')}
                                        isGray
                                        onPress={() => {
                                            Alert.alert(t('admin:NotWantToApproveInstructionTitle'), t('admin:NotWantToApproveInstructionMessage'), [
                                                { text: t('admin:NotApprove'), onPress: () => _unApproveInstruction(instruction) },
                                                {
                                                    text: t('admin:Cancel'),
                                                    style: 'cancel',
                                                },
                                            ])
                                        }}
                                    />
                                </ShadowBoxWithHeader>
                            </View>
                        </>
                    )}
                    {constructionRelation == 'order-children' && (
                        <>
                            <Line
                                style={{
                                    marginTop: 20,
                                    marginLeft: 10,
                                    marginRight: 10,
                                }}
                            />
                            <View
                                style={{
                                    marginTop: 10,
                                    marginLeft: 10,
                                    marginRight: 10,
                                }}>
                                <AppButton
                                    style={{
                                        marginTop: 10,
                                    }}
                                    title={t('admin:RequestEditingSiteInfo')}
                                    onPress={
                                        contract?.orderCompanyId != myCompanyId || checkMyDepartment({ targetDepartmentIds: contract?.orderDepartmentIds, activeDepartmentIds })
                                            ? () => {
                                                  navigation.push('EditSite', {
                                                      siteId: instruction.instructionInfo.siteId,
                                                      constructionId: instruction?.instructionInfo.constructionId,
                                                      mode: 'edit',
                                                      isInstruction: true,
                                                      projectId: contract?.projectId ?? 'no-id',
                                                  })
                                              }
                                            : () =>
                                                  dispatch(
                                                      setToastMessage({
                                                          text:
                                                              t('admin:TheContractIsInAnotherDepartmentPleaseSwitchDepartments') +
                                                              '\n' +
                                                              t('common:Department') +
                                                              ': ' +
                                                              departmentsToText(contract?.orderDepartments?.items),
                                                          type: 'error',
                                                      } as ToastMessage),
                                                  )
                                    }
                                />
                                {
                                    <AppButton
                                        style={{
                                            marginTop: 10,
                                        }}
                                        title={t('admin:DeleteInstruction')}
                                        isGray
                                        onPress={() => {
                                            Alert.alert(t('admin:WantToDeleteInstruction'), t('admin:OperationCannotBeUndone'), [
                                                { text: t('admin:Deletion'), onPress: () => _deleteSiteInstruction() },
                                                {
                                                    text: t('admin:Cancel'),
                                                    style: 'cancel',
                                                },
                                            ])
                                        }}
                                    />
                                }
                            </View>
                        </>
                    )}
                </>
            )}
            {site?.siteDate && (
                <AppButton
                    style={{
                        marginTop: 20,
                        marginHorizontal: 10,
                    }}
                    title={t('admin:GoToDateManagementScreen')}
                    onPress={() => {
                        navigation.push('DateRouter', {
                            date: toCustomDateFromTotalSeconds(site?.siteDate as number),
                        })
                    }}
                />
            )}
            <DisplayIdInDev id={site?.siteId} label="siteId" />
            <DisplayIdInDev id={requestId} label="requestId" />

            <BottomMargin />
        </ScrollViewInstead>
    )
}
export default SiteDetail

const styles = StyleSheet.create({})
