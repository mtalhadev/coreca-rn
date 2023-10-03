/* eslint-disable indent */
import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { StyleSheet, Alert, AppState, View } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { CustomDate, getDailyStartTime, getMonthlyFirstDay, monthBaseText, newCustomDate, nextMonth } from '../../../../models/_others/CustomDate'
import { InputTextBox } from '../../../../components/organisms/inputBox/InputTextBox'
import { AppButton } from '../../../../components/atoms/AppButton'
import { BottomMargin } from '../../../../components/atoms/BottomMargin'
import { getUuidv4, SwitchEditOrCreateProps } from '../../../../utils/Utils'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { Line } from '../../../../components/atoms/Line'
import { DEFAULT_SITE_END_TIME, DEFAULT_SITE_MEETING_TIME, DEFAULT_SITE_START_TIME, dMarginTop, INITIAL_CONSTRUCTION_NAME, LOCK_INTERVAL_TIME, PLACEHOLDER } from '../../../../utils/Constants'
import { setLoading, setLocalUpdateScreens, setToastMessage, ToastMessage } from '../../../../stores/UtilSlice'
import { InputCompanyBox } from '../../../../components/organisms/inputBox/InputCompanyBox'
import { StoreType } from '../../../../stores/Store'
import { InputDateTimeBox } from '../../../../components/organisms/inputBox/InputDateTimeBox'
import { ContractCLType, ContractType } from '../../../../models/contract/Contract'
import { ConstructionHeaderCL } from '../../../../components/organisms/construction/ConstructionHeaderCL'
import { deleteTargetContract, getContractForEdit, writeContract } from '../../../../usecases/contract/CommonContractCase'
import { getTargetConstruction } from '../../../../usecases/construction/CommonConstructionCase'
import { CompanyCLType } from '../../../../models/company/Company'
import { useIsFocused } from '@react-navigation/native'
import { checkLockOfTarget, updateLockOfTarget } from '../../../../usecases/lock/CommonLockCase'
import { getErrorMessage, getErrorToastMessage } from '../../../../services/_others/ErrorService'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'
import { useSafeLoadingUnmount } from '../../../../fooks/useUnmount'
import { useTextTranslation } from '../../../../fooks/useTextTranslation'

import flatten from 'lodash/flatten'
import uniqBy from 'lodash/uniqBy'
import { toCustomDatesListFromStartAndEnd, toIdAndMonthFromStrings, UpdateScreenType } from '../../../../models/updateScreens/UpdateScreens'
import { InputObject, InputObjectDropdownBox } from '../../../../components/organisms/inputBox/InputObjectDropdownBox'
import { checkMyDepartment, getDepartmentListOfTargetCompany } from '../../../../usecases/department/DepartmentCase'
import { _getFirestore } from '../../../../services/firebase/FirestoreService'
import { departmentsToText } from '../../../../usecases/worker/CommonWorkerCase'
import { updateApproveContract } from '../../../../usecases/contract/CommonContractCase'
import { genKeyName, getCachedData, updateCachedData } from '../../../../usecases/CachedDataCase'
import { ProjectType } from '../../../../models/project/Project'
import { CachedOrderListType } from '../OrderList'
type NavProps = StackNavigationProp<RootStackParamList, 'EditContract'>
type RouteProps = RouteProp<RootStackParamList, 'EditContract'>

type InitialStateType = ContractCLType & {
    contractId?: string
    disable: boolean
    contractAt?: CustomDate
    selectedOrderCompanyDepartments?: InputObject[]
    receiveCompanyDepartments?: InputObject[]
    selectedReceiveCompanyDepartments?: InputObject[]
    isFetching: boolean
}

const initialState: InitialStateType = {
    disable: true,
    isFetching: false,
}

const EditContract = (props: Partial<SwitchEditOrCreateProps>) => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const mode = props.mode ?? 'edit'
    const signInUser = useSelector((state: StoreType) => state?.account?.signInUser)
    const myCompanyId = useSelector((state: StoreType) => state?.account?.belongCompanyId)
    const accountId = useSelector((state: StoreType) => state.account.signInUser?.accountId ?? '')
    const [appState, setAppState] = useState(AppState.currentState)
    const isFocused = useIsFocused()
    const [
        {
            isFetching,
            disable,
            selectedOrderCompanyDepartments,
            receiveCompanyDepartments,
            selectedReceiveCompanyDepartments,

            /**
             * 以下ContractTypeの内容
             */
            orderCompany,
            contractId,
            receiveCompany,
            receiveDepartments,
            contractAt,
            superConstruction,
            project,
            superConstructionId,
            projectId,
            remarks,
            orderDepartmentIds,
            receiveDepartmentIds,
            contractLog,
        },
        setState,
    ] = useState(initialState)
    const dispatch = useDispatch()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const localUpdateScreens = useSelector((state: StoreType) => state?.util?.localUpdateScreens)
    const activeDepartments = useSelector((state: StoreType) => state?.account?.activeDepartments)
    const activeDepartmentIds = useMemo(() => activeDepartments?.map((dep) => dep?.departmentId).filter((data) => data != undefined) as string[], [activeDepartments])
    const unsubscribeRef = useRef<any>(null)
    const isScreenOnRef = useRef<boolean>(false)
    const latestContractLog = useMemo(
        () => (contractLog?.totalContractLogs?.items && contractLog?.latestContractLog != undefined ? contractLog?.totalContractLogs.items[contractLog?.latestContractLog] : undefined),
        [contractLog],
    )
    const isDefaultDepartment = useMemo(() => activeDepartments?.map((dep) => dep?.isDefault)[0], [activeDepartments])

    // 画面を閉じたときに時にonSnapshotをunsubscribeする
    useEffect(() => {
        isScreenOnRef.current = isFocused
        return () => {
            if (unsubscribeRef.current && isScreenOnRef.current) {
                unsubscribeRef.current()
                unsubscribeRef.current = null
                isScreenOnRef.current = false
            }
        }
    }, [isFocused])

    useMemo(() => {
        ;(async () => {
            /**
             * 契約の初回承認時のみ(受注側)
             */
            if (latestContractLog?.status == 'created' && latestContractLog.updateCompanyId != myCompanyId && receiveCompany?.companyId == myCompanyId) {
                const _activeDepartments = activeDepartments?.map((dep) => {
                    return { tag: dep.departmentName, value: dep.departmentId } as InputObject
                })
                if (activeDepartments?.length ?? 0 > 0) {
                    setState((prev) => ({
                        ...prev,
                        selectedReceiveCompanyDepartments: _activeDepartments,
                        receiveCompanyDepartments: _activeDepartments,
                    }))
                } else {
                    //今だけ、契約編集者に部署がない場合はその会社の全部署を取得して選択できるようにする.
                    //TODO:今後、作業員には部署が必須になるので不要になる
                    try {
                        const _activeDepartmentsResult = await getDepartmentListOfTargetCompany({ companyId: receiveCompany?.companyId ?? '' })
                        if (_activeDepartmentsResult.error) {
                            throw {
                                error: _activeDepartmentsResult.error,
                                errorCode: _activeDepartmentsResult.errorCode,
                            }
                        }
                        const __activeDepartments = _activeDepartmentsResult.success?.map((dep) => {
                            return { tag: dep.departmentName, value: dep.departmentId } as InputObject
                        })
                        setState((prev) => ({
                            ...prev,
                            receiveCompanyDepartments: __activeDepartments,
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
                }
            }
        })()
    }, [receiveDepartments, activeDepartmentIds])

    useEffect(() => {
        navigation.setOptions({
            title: mode == 'new' ? t('admin:OrderingConstruction') : t('admin:EditContract'),
        })
    }, [navigation])

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            setState((prev) => ({ ...prev, isFetching: true }))
        }
    }, [isNavUpdating])

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        ;(async () => {
            try {
                if (contractId == undefined) {
                    return
                } else if (mode == 'new' && superConstructionId != undefined) {
                    /**
                     * 新規の場合、上位契約を取得する
                     */
                    if (isFocused) dispatch(setLoading(true))
                    const result = await getTargetConstruction({
                        myCompanyId,
                        constructionId: superConstructionId,
                    })
                    if (result.error) {
                        throw {
                            error: result.error,
                            errorCode: result.errorCode,
                        }
                    }
                    //発注部署指定
                    const _selectedOrderCompanyDepartments = result.success?.contract?.receiveDepartments?.items?.map((dep) => {
                        return { tag: dep.departmentName, value: dep.departmentId } as InputObject
                    })
                    setState((prev) => ({
                        ...prev,
                        orderCompany: result.success?.contract?.receiveCompany,
                        superConstruction: result.success,
                        project: result.success?.project,
                        selectedOrderCompanyDepartments: _selectedOrderCompanyDepartments,
                    }))
                } else if (mode == 'edit') {
                    /**
                     * 編集の場合、元データを取得する
                     */
                    if (isFocused) dispatch(setLoading(true))
                    const result = await getContractForEdit({
                        contractId,
                        myCompanyId,
                    })
                    if (result.error) {
                        throw {
                            error: result.error,
                            errorCode: result.errorCode,
                        }
                    }
                    //発注部署指定
                    const _selectedOrderCompanyDepartments = result.success?.orderDepartments?.items?.map((dep) => {
                        return { tag: dep.departmentName, value: dep.departmentId } as InputObject
                    })
                    //受注部署指定
                    const _selectedReceiveCompanyDepartments = result.success?.receiveDepartments?.items?.map((dep) => {
                        return { tag: dep.departmentName, value: dep.departmentId } as InputObject
                    })
                    setState((prev) => ({
                        ...prev,
                        ...result.success,
                        project: result.success?.project,
                        selectedOrderCompanyDepartments: _selectedOrderCompanyDepartments,
                        selectedReceiveCompanyDepartments: _selectedReceiveCompanyDepartments,
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
                    dispatch(setLoading(false))
                    dispatch(setIsNavUpdating(false))
                }
            }
        })()
    }, [contractId, isFetching])

    useEffect(() => {
        if (orderCompany == undefined || receiveCompany == undefined || contractAt == undefined) {
            setState((prev) => ({ ...prev, disable: true }))
            return
        }
        setState((prev) => ({ ...prev, disable: false }))
    }, [orderCompany, receiveCompany, contractAt])

    useEffect(() => {
        if (mode === 'edit') {
            setState((prev) => ({
                ...prev,
                contractId: contractId ?? route.params?.contractId,
                superConstructionId: superConstructionId ?? route.params?.superConstructionId,
                contractAt: contractAt ?? newCustomDate(),
                projectId: projectId ?? route.params?.projectId,
            }))
        } else {
            setState((prev) => ({
                ...prev,
                contractId: contractId ?? getUuidv4(),
                superConstructionId: superConstructionId ?? route.params?.superConstructionId,
                contractAt: contractAt ?? newCustomDate(),
                projectId: projectId ?? route.params?.projectId,
            }))
        }
        return () => {
            setState({ ...initialState })
        }
    }, [isFetching])

    useEffect(() => {
        if (contractId && signInUser?.workerId && appState == 'active' && isFocused) {
            ;(async () => {
                try {
                    const lockResult = await checkLockOfTarget({
                        myWorkerId: signInUser?.workerId ?? 'no-id',
                        targetId: contractId ?? 'no-id',
                        modelType: 'contract',
                    })
                    if (lockResult.error) {
                        throw {
                            error: lockResult.error,
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
            })()
            const keepLock = setInterval(
                (function _update() {
                    updateLockOfTarget({
                        myWorkerId: signInUser?.workerId ?? 'no-id',
                        targetId: contractId ?? 'no-id',
                        modelType: 'contract',
                    })
                    return _update
                })(),
                LOCK_INTERVAL_TIME,
            )
            return () => {
                clearInterval(keepLock)
                updateLockOfTarget({
                    myWorkerId: signInUser?.workerId ?? 'no-id',
                    targetId: contractId ?? 'no-id',
                    modelType: 'contract',
                    unlock: true,
                })
            }
        }
    }, [contractId, signInUser?.workerId, appState, isFocused])

    useEffect(() => {
        const appState = AppState.addEventListener('change', setAppState)
        return () => {
            appState.remove()
        }
    }, [])

    const _updateOrderListCache = async (contractId: string, constructionId?: string) => {
        if (project?.startDate == undefined || project?.endDate == undefined) return

        // 月を跨ぐ場合、月毎に生成する
        let month = getMonthlyFirstDay(project?.startDate)
        let cacheKeys = []
        while (month.totalSeconds <= getMonthlyFirstDay(project?.endDate).totalSeconds) {
            const cachedKey = genKeyName({
                screenName: 'OrderList',
                accountId: accountId,
                companyId: myCompanyId as string,
                month: month ? monthBaseText(month).replace(/\//g, '-') : '',
            })
            cacheKeys.push(cachedKey)
            month = nextMonth(month)
        }

        const promises = cacheKeys.map(async (cachedKey): Promise<CustomResponse<undefined>> => {
            try {
                const orderListCacheData = await getCachedData<CachedOrderListType>(cachedKey)
                const newProject: ProjectType = {
                    projectId: project?.projectId,
                    updateWorkerId: signInUser?.workerId,
                    name: project?.name,
                    startDate: project?.startDate?.totalSeconds,
                    endDate: project?.endDate?.totalSeconds,
                    imageUrl: project.imageUrl,
                    sImageUrl: project.sImageUrl,
                    xsImageUrl: project.xsImageUrl,
                    imageColorHue: project.imageColorHue,
                    siteAddress: project.siteAddress,
                    companyContracts: {
                        totalContracts: {
                            items: [
                                {
                                    contractId: contractId,
                                    orderCompany: {
                                        name: orderCompany?.name,
                                    },
                                    receiveCompany: {
                                        name: receiveCompany?.name,
                                        companyPartnership: receiveCompany?.companyPartnership,
                                    },
                                },
                            ],
                        },
                    },
                    projectConstructions: {
                        totalConstructions: {
                            items: [
                                {
                                    constructionId: constructionId,
                                    contractId: contractId,
                                    name: project.name ?? INITIAL_CONSTRUCTION_NAME,
                                    displayName: project.name ?? INITIAL_CONSTRUCTION_NAME,
                                    siteMeetingTime: superConstruction?.siteMeetingTime?.totalSeconds ?? DEFAULT_SITE_MEETING_TIME.totalSeconds,
                                    siteStartTime: superConstruction?.siteStartTime?.totalSeconds ?? DEFAULT_SITE_START_TIME.totalSeconds,
                                    siteEndTime: superConstruction?.siteEndTime?.totalSeconds ?? DEFAULT_SITE_END_TIME.totalSeconds,
                                    siteAddress: project?.siteAddress,
                                    constructionRelation: receiveCompany?.isFake ? 'fake-company-manager' : 'other-company',
                                },
                            ],
                        },
                    },
                }
                if (orderListCacheData.success?.projectInfo) {
                    if (orderListCacheData.success.projectInfo.projects) {
                        if (mode == 'new') {
                            orderListCacheData.success.projectInfo.projects.push(newProject)
                        } else {
                            const newProjects = orderListCacheData?.success?.projectInfo.projects?.map((project) => {
                                if (project.projectId == project.projectId) {
                                    project = project
                                }
                                return project
                            })
                            orderListCacheData.success.projectInfo.projects = newProjects
                        }
                    } else {
                        orderListCacheData.success.projectInfo.projects = [newProject]
                    }
                    orderListCacheData.success.projectInfo.updatedAt = Number(new Date())
                    await updateCachedData({ key: cachedKey, value: orderListCacheData.success })
                } else {
                    await updateCachedData({
                        key: cachedKey,
                        value: {
                            projectInfo: {
                                projects: [project],
                                updatedAt: Number(new Date()),
                            },
                        },
                    })
                }
                return Promise.resolve({
                    success: undefined,
                })
            } catch (error) {
                return getErrorMessage(error)
            }
        })

        const results = await Promise.all(promises)
        results.forEach((result) => {
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: result.errorCode,
                }
            }
        })
    }

    const _writeContract = async () => {
        try {
            if (contractId == undefined) {
                throw {
                    error: t('common:NoId'),
                }
            }

            /**
             * 受注の場合は、受注部署で絞り込み
             */
            if (receiveCompany?.companyId == myCompanyId && !checkMyDepartment({ targetDepartmentIds: receiveDepartmentIds, activeDepartmentIds })) {
                throw {
                    error:
                        t('admin:TheContractIsInAnotherDepartmentPleaseSwitchDepartments') +
                        '\n' +
                        t('common:Department') +
                        ': ' +
                        departmentsToText(superConstruction?.contract?.receiveDepartments?.items),
                }
            }
            /**
             * 発注の場合は、発注部署で絞り込み
             */
            if (orderCompany?.companyId == myCompanyId && !checkMyDepartment({ targetDepartmentIds: orderDepartmentIds, activeDepartmentIds })) {
                throw {
                    error: t('admin:TheContractIsInAnotherDepartmentPleaseSwitchDepartments'),
                }
            }
            dispatch(setLoading('unTouchable'))
            const lockResult = await checkLockOfTarget({
                myWorkerId: signInUser?.workerId ?? 'no-id',
                targetId: contractId ?? 'no-id',
                modelType: 'contract',
            })
            if (lockResult.error) {
                if (isFocused) dispatch(setLoading(false))
                throw {
                    error: lockResult.error,
                }
            }
            const newOrderDepartmentIds = selectedOrderCompanyDepartments?.map((obj) => obj?.value).filter((data) => data != undefined) as string[]
            const newReceiveDepartmentIds = selectedReceiveCompanyDepartments?.map((obj) => obj?.value).filter((data) => data != undefined) as string[]

            if (orderCompany?.companyId == myCompanyId) {
                // 取引一覧キャッシュ更新
                await _updateOrderListCache(contractId, superConstructionId)
            }

            const result = await writeContract({
                contractAt,
                contractId,
                superConstructionId: superConstructionId,
                receiveCompanyId: receiveCompany?.companyId,
                orderCompanyId: orderCompany?.companyId,
                projectId,
                remarks,
                myCompanyId,
                myWorkerId: signInUser?.workerId,
                orderDepartmentIds: newOrderDepartmentIds,
                receiveDepartmentIds: newReceiveDepartmentIds,
                orderCompany,
                receiveCompany,
            })
            if (isFocused) dispatch(setLoading(false))
            if (result.error) {
                throw {
                    error: result.error,
                }
            }
            let newLocalUpdateScreens: UpdateScreenType[] = [
                {
                    screenName: 'ContractingProjectDetail',
                    ids:
                        [
                            ...flatten(
                                localUpdateScreens.filter((screen) => screen.screenName == 'ContractingProjectDetail').map((screen) => screen.ids?.filter((data) => data != undefined) as string[]),
                            ),
                            contractId,
                        ] ?? [],
                },
            ]
            if (superConstructionId) {
                newLocalUpdateScreens = [
                    ...newLocalUpdateScreens,
                    {
                        screenName: 'ConstructionDetail',
                        ids:
                            [
                                ...flatten(
                                    localUpdateScreens.filter((screen) => screen.screenName == 'ConstructionDetail').map((screen) => screen.ids?.filter((data) => data != undefined) as string[]),
                                ),
                                superConstructionId,
                            ] ?? [],
                    },
                ]
                if (mode == 'new') {
                    if (superConstruction?.contractId) {
                        const dateList = toCustomDatesListFromStartAndEnd(project?.startDate, project?.endDate)
                        const superConstructionIdAndDates = dateList.map((date) => toIdAndMonthFromStrings(superConstruction.constructionId, date))
                        const companyIdAndDates = dateList.map((date) => toIdAndMonthFromStrings(receiveCompany?.companyId, date))
                        newLocalUpdateScreens = [
                            ...newLocalUpdateScreens,
                            {
                                screenName: 'ContractingProjectDetail',
                                ids: [
                                    ...flatten(
                                        localUpdateScreens
                                            .filter((screen) => screen.screenName == 'ContractingProjectDetail')
                                            .map((screen) => screen.ids?.filter((data) => data != undefined) as string[]),
                                    ),
                                    superConstruction.contractId,
                                    contractId,
                                ],
                            },
                            {
                                screenName: 'ConstructionSiteList',
                                idAndDates: [
                                    ...flatten(
                                        localUpdateScreens
                                            .filter((screen) => screen.screenName == 'ConstructionSiteList')
                                            .map((screen) => screen.idAndDates?.filter((data) => data != undefined) as string[]),
                                    ),
                                    ...superConstructionIdAndDates,
                                ],
                            },
                            {
                                screenName: 'CompanyInvoice',
                                idAndDates: [
                                    ...flatten(
                                        localUpdateScreens
                                            .filter((screen) => screen.screenName == 'CompanyInvoice')
                                            .map((screen) => screen.idAndDates?.filter((data) => data != undefined) as string[]),
                                    ),
                                    ...companyIdAndDates,
                                ],
                            },
                        ]
                    }
                }
            }
            dispatch(setLocalUpdateScreens(uniqBy([...newLocalUpdateScreens, ...localUpdateScreens], 'screenName')))
            dispatch(
                setToastMessage({
                    text: result.success == 'create' ? t('admin:ContractCreated') : t('admin:ContractRenewed'),
                    type: 'success',
                } as ToastMessage),
            )
            if (result.success == 'create') {
                navigation.replace('ContractingProjectDetailRouter', {
                    projectId: projectId,
                    contractId: contractId,
                    title: superConstruction?.displayName ?? '',
                })
            } else {
                navigation.goBack()
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

    const _approveContract = async () => {
        try {
            if (contractId == undefined) {
                throw {
                    error: t('common:NoId'),
                }
            }
            if (latestContractLog?.status == 'created' && (selectedReceiveCompanyDepartments?.length ?? 0) == 0) {
                throw {
                    error: t('admin:PleaseSelectTheDepartmentToReceiveTheContract'),
                    errorCode: 'APPROVE_CONTRACT_ERROR',
                }
            }
            dispatch(setLoading('unTouchable'))
            const lockResult = await checkLockOfTarget({
                myWorkerId: signInUser?.workerId ?? 'no-id',
                targetId: contractId ?? 'no-id',
                modelType: 'contract',
            })
            if (lockResult.error) {
                if (isFocused) dispatch(setLoading(false))
                throw {
                    error: lockResult.error,
                }
            }
            const result = await updateApproveContract({
                contractId,
                isApproved: true,
                myCompanyId,
                receiveDepartmentIds: selectedReceiveCompanyDepartments?.map((obj) => obj?.value).filter((data) => data != undefined) as string[],
            })
            if (isFocused) dispatch(setLoading(false))
            if (result.error) {
                throw {
                    error: result.error,
                }
            }
            let newLocalUpdateScreens: UpdateScreenType[] = [
                {
                    screenName: 'ContractingProjectDetail',
                    ids:
                        [
                            ...flatten(
                                localUpdateScreens.filter((screen) => screen.screenName == 'ContractingProjectDetail').map((screen) => screen.ids?.filter((data) => data != undefined) as string[]),
                            ),
                            contractId,
                        ] ?? [],
                },
            ]
            if (superConstructionId) {
                newLocalUpdateScreens = [
                    ...newLocalUpdateScreens,
                    {
                        screenName: 'ConstructionDetail',
                        ids:
                            [
                                ...flatten(
                                    localUpdateScreens.filter((screen) => screen.screenName == 'ConstructionDetail').map((screen) => screen.ids?.filter((data) => data != undefined) as string[]),
                                ),
                                superConstructionId,
                            ] ?? [],
                    },
                ]
                if (mode == 'new') {
                    if (superConstruction?.contractId) {
                        const dateList = toCustomDatesListFromStartAndEnd(project?.startDate, project?.endDate)
                        const superConstructionIdAndDates = dateList.map((date) => toIdAndMonthFromStrings(superConstruction.constructionId, date))
                        const companyIdAndDates = dateList.map((date) => toIdAndMonthFromStrings(receiveCompany?.companyId, date))
                        newLocalUpdateScreens = [
                            ...newLocalUpdateScreens,
                            {
                                screenName: 'ContractingProjectDetail',
                                ids: [
                                    ...flatten(
                                        localUpdateScreens
                                            .filter((screen) => screen.screenName == 'ContractingProjectDetail')
                                            .map((screen) => screen.ids?.filter((data) => data != undefined) as string[]),
                                    ),
                                    superConstruction.contractId,
                                    contractId,
                                ],
                            },
                            {
                                screenName: 'ConstructionSiteList',
                                idAndDates: [
                                    ...flatten(
                                        localUpdateScreens
                                            .filter((screen) => screen.screenName == 'ConstructionSiteList')
                                            .map((screen) => screen.idAndDates?.filter((data) => data != undefined) as string[]),
                                    ),
                                    ...superConstructionIdAndDates,
                                ],
                            },
                            {
                                screenName: 'CompanyInvoice',
                                idAndDates: [
                                    ...flatten(
                                        localUpdateScreens
                                            .filter((screen) => screen.screenName == 'CompanyInvoice')
                                            .map((screen) => screen.idAndDates?.filter((data) => data != undefined) as string[]),
                                    ),
                                    ...companyIdAndDates,
                                ],
                            },
                        ]
                    }
                }
            }
            dispatch(setLocalUpdateScreens(uniqBy([...newLocalUpdateScreens, ...localUpdateScreens], 'screenName')))
            dispatch(
                setToastMessage({
                    text: t('admin:Approved'),
                    type: 'success',
                } as ToastMessage),
            )
            navigation.replace('ContractingProjectDetailRouter', {
                projectId: projectId,
                contractId: contractId,
                title: superConstruction?.displayName ?? '',
            })
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

    const _deleteContract = async () => {
        try {
            if (contractId == undefined) {
                throw {
                    error: t('common:NoId'),
                }
            }
            if (latestContractLog?.status == 'delete') {
                throw {
                    error: t('admin:AlreadyRequestedForDeletion'),
                }
            }
            /**
             * 受注の場合、受注部署で絞り込み
             */
            if (receiveCompany?.companyId == myCompanyId && !checkMyDepartment({ targetDepartmentIds: receiveDepartmentIds, activeDepartmentIds })) {
                throw {
                    error:
                        t('admin:TheContractIsInAnotherDepartmentPleaseSwitchDepartments') +
                        '\n' +
                        t('common:Department') +
                        ': ' +
                        departmentsToText(superConstruction?.contract?.receiveDepartments?.items),
                }
            }
            /**
             * 発注契約の削除の場合は発注部署で絞り込み
             */
            if (orderCompany?.companyId == myCompanyId && !checkMyDepartment({ targetDepartmentIds: orderDepartmentIds, activeDepartmentIds })) {
                throw {
                    error: t('admin:TheContractIsInAnotherDepartmentPleaseSwitchDepartments'),
                }
            }
            dispatch(setLoading('unTouchable'))
            const lockResult = await checkLockOfTarget({
                myWorkerId: signInUser?.workerId ?? 'no-id',
                targetId: contractId ?? 'no-id',
                modelType: 'contract',
            })
            if (lockResult.error) {
                if (isFocused) dispatch(setLoading(false))
                throw {
                    error: lockResult.error,
                }
            }
            const latestIndex = contractLog?.latestContractLog
            const _contract: ContractType = {
                contractId: contractId,
                orderCompanyId: orderCompany?.companyId,
                receiveCompanyId: receiveCompany?.companyId,
                superConstructionId,
                remarks,
                projectId,
                updateWorkerId: signInUser?.workerId ?? 'no-id',
                contractAt: contractAt?.totalSeconds,
                orderDepartmentIds,
                receiveDepartmentIds,
                status: 'approved',
            }
            const result = await deleteTargetContract({
                contract: _contract,
                myCompanyId,
                myWorkerId: signInUser?.workerId ?? 'no-id',
                status: contractLog?.totalContractLogs?.items && latestIndex != undefined ? contractLog?.totalContractLogs?.items[latestIndex]?.status : undefined,
                latestContractLogId: contractLog?.totalContractLogs?.items && latestIndex != undefined ? contractLog?.totalContractLogs?.items[latestIndex]?.contractLogId : undefined,
                receiveCompany,
                orderCompany,
            })
            if (isFocused) dispatch(setLoading(false))
            if (result.error) {
                throw {
                    error: result.error,
                }
            }
            const dateList = toCustomDatesListFromStartAndEnd(project?.startDate, project?.endDate)
            const companyIdAndDates = dateList.map((date) => toIdAndMonthFromStrings(receiveCompany?.companyId, date))
            let newLocalUpdateScreens: UpdateScreenType[] = []
            if (superConstruction?.constructionId) {
                newLocalUpdateScreens = [
                    ...newLocalUpdateScreens,
                    {
                        screenName: 'ConstructionDetail',
                        ids: [
                            ...flatten(localUpdateScreens.filter((screen) => screen.screenName == 'ConstructionDetail').map((screen) => screen.ids?.filter((data) => data != undefined) as string[])),
                            superConstruction.constructionId,
                        ],
                    },
                    {
                        screenName: 'CompanyInvoice',
                        idAndDates: [
                            ...flatten(
                                localUpdateScreens.filter((screen) => screen.screenName == 'CompanyInvoice').map((screen) => screen.idAndDates?.filter((data) => data != undefined) as string[]),
                            ),
                            ...companyIdAndDates,
                        ],
                    },
                ]
            }
            if (superConstruction?.contractId) {
                const dateList = toCustomDatesListFromStartAndEnd(project?.startDate, project?.endDate)
                const superConstructionIdAndDates = dateList.map((date) => toIdAndMonthFromStrings(superConstruction.constructionId, date))
                newLocalUpdateScreens = [
                    ...newLocalUpdateScreens,
                    {
                        screenName: 'ContractingProjectDetail',
                        ids: [
                            ...flatten(
                                localUpdateScreens.filter((screen) => screen.screenName == 'ContractingProjectDetail').map((screen) => screen.ids?.filter((data) => data != undefined) as string[]),
                            ),
                            superConstruction.contractId,
                            contractId,
                        ],
                    },
                    {
                        screenName: 'ConstructionSiteList',
                        idAndDates: [
                            ...flatten(
                                localUpdateScreens.filter((screen) => screen.screenName == 'ConstructionSiteList').map((screen) => screen.idAndDates?.filter((data) => data != undefined) as string[]),
                            ),
                            ...superConstructionIdAndDates,
                        ],
                    },
                ]
            }
            dispatch(setLocalUpdateScreens(uniqBy([...newLocalUpdateScreens, ...localUpdateScreens], 'screenName')))

            navigation.goBack()
            if (
                contractLog?.totalContractLogs?.items == undefined ||
                latestIndex == undefined ||
                contractLog?.totalContractLogs?.items[latestIndex]?.status == 'created' ||
                orderCompany?.isFake == true ||
                receiveCompany?.isFake == true
            ) {
                //削除依頼ではなく、削除がそのまま実行される場合はもう一つ戻る
                navigation.goBack()
                dispatch(
                    setToastMessage({
                        text: t('admin:ContractDeleted'),
                        type: 'success',
                    } as ToastMessage),
                )
            } else {
                dispatch(
                    setToastMessage({
                        text: t('admin:RequestedContractDeletion'),
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

    return (
        <KeyboardAwareScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps={'always'}>
            {(superConstruction != undefined || project != undefined) && (
                <ConstructionHeaderCL
                    project={project}
                    style={{
                        padding: 20,
                        backgroundColor: '#fff',
                    }}
                    constructionRelation={superConstruction?.constructionRelation ?? 'owner'}
                    displayName={superConstruction?.displayName ?? project?.name}
                />
            )}
            {myCompanyId != undefined && mode == 'edit' && myCompanyId != orderCompany?.companyId && (
                //自社受注
                <>
                    <InputCompanyBox
                        style={{ marginTop: 30 - dMarginTop }}
                        required={true}
                        title={t('admin:ClientCompany')}
                        selectedCompany={orderCompany}
                        infoText={t('admin:ContractAndConstructionDetailsConfirmed')}
                        onValueChangeValid={(value: CompanyCLType | undefined) => {
                            setState((prev) => ({ ...prev, orderCompany: value }))
                        }}
                        disable={mode == 'edit'}
                    />
                    <InputObjectDropdownBox
                        required={true}
                        title={t('common:OrderDepartments')}
                        placeholder={PLACEHOLDER.DEPARTMENT}
                        selectNum={'any'}
                        value={selectedOrderCompanyDepartments}
                        style={{
                            marginTop: 30 - dMarginTop,
                        }}
                        disable={true}
                    />
                    {myCompanyId == receiveCompany?.companyId && !isDefaultDepartment && (
                        <InputObjectDropdownBox
                            required={true}
                            title={t('common:ReceivedDepartments')}
                            placeholder={PLACEHOLDER.DEPARTMENT}
                            selectableItems={receiveCompanyDepartments ?? []}
                            selectNum={'any'}
                            value={selectedReceiveCompanyDepartments}
                            style={{
                                marginTop: 30 - dMarginTop,
                            }}
                            disable={latestContractLog?.status != 'created' || (latestContractLog?.updateCompanyId == myCompanyId && latestContractLog?.status == 'created')}
                            onValueChangeValid={(value) => {
                                setState((prev) => ({ ...prev, selectedReceiveCompanyDepartments: value }))
                            }}
                        />
                    )}
                </>
            )}
            {myCompanyId != undefined && (mode == 'new' || (mode == 'edit' && myCompanyId != receiveCompany?.companyId)) && (
                //自社発注
                <View>
                    <InputCompanyBox
                        style={{ marginTop: 30 - dMarginTop }}
                        required={true}
                        title={superConstructionId ? t('common:ConstructionCompany') : t('common:ClientCompany')}
                        selectedCompany={receiveCompany}
                        infoText={t('admin:ConstructionCanBeEdited')}
                        onValueChangeValid={(value: CompanyCLType | undefined) => {
                            setState((prev) => ({ ...prev, receiveCompany: value }))
                        }}
                        withoutMyCompany
                        disable={mode == 'edit'}
                    />
                    {myCompanyId == orderCompany?.companyId && !isDefaultDepartment && (
                        <InputObjectDropdownBox
                            required={true}
                            title={t('common:OrderDepartments')}
                            placeholder={PLACEHOLDER.DEPARTMENT}
                            selectNum={'any'}
                            value={selectedOrderCompanyDepartments}
                            style={{
                                marginTop: 30 - dMarginTop,
                            }}
                            disable={true}
                        />
                    )}
                    {mode == 'edit' && (
                        <InputObjectDropdownBox
                            title={t('common:ReceivedDepartments')}
                            placeholder={PLACEHOLDER.DEPARTMENT}
                            selectNum={'any'}
                            value={selectedReceiveCompanyDepartments}
                            style={{
                                marginTop: 30 - dMarginTop,
                            }}
                            disable={true}
                        />
                    )}
                </View>
            )}

            <InputDateTimeBox
                style={{ marginTop: 30 - dMarginTop }}
                required={true}
                title={t('common:ContractDate')}
                value={contractAt}
                initDateInput={contractAt}
                dateInputMode="datetime"
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, contractAt: value as number & CustomDate }))
                }}
                disable={latestContractLog?.updateCompanyId != myCompanyId && latestContractLog?.status == 'created'}
            />
            <InputTextBox
                style={{ marginTop: 30 - dMarginTop }}
                required={false}
                title={t('admin:RemarksOnContract')}
                placeholder={PLACEHOLDER.REMARKS}
                value={remarks}
                multiline={true}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, remarks: value }))
                }}
                disable={latestContractLog?.updateCompanyId != myCompanyId && latestContractLog?.status == 'created'}
                onClear={() => {
                    setState((prev) => ({ ...prev, remarks: undefined }))
                }}
            />
            {(latestContractLog?.status != 'created' || orderCompany?.companyId == myCompanyId || (latestContractLog?.updateCompanyId == myCompanyId && latestContractLog?.status == 'created')) && (
                <AppButton
                    style={{ marginTop: 30, marginHorizontal: 20 }}
                    title={mode == 'edit' ? t('common:Save') : t('common:PlaceOrder')}
                    disabled={disable}
                    onPress={() => {
                        if (mode == 'edit') {
                            _writeContract()
                        } else {
                            Alert.alert(t('admin:WantToOrderConstruction'), t('admin:AllSitesArrangementsAttendanceAlreadyCreatedWillDelete'), [
                                { text: t('admin:DeleteAndPlaceOrder'), onPress: () => _writeContract() },
                                {
                                    text: t('common:Cancel'),
                                    style: 'cancel',
                                },
                            ])
                        }
                    }}
                />
            )}
            {latestContractLog?.status == 'created' && latestContractLog.updateCompanyId != myCompanyId && receiveCompany?.companyId == myCompanyId && (
                <AppButton
                    style={{ marginTop: 30, marginHorizontal: 20 }}
                    title={t('admin:Approve')}
                    disabled={disable}
                    onPress={() => {
                        _approveContract()
                    }}
                />
            )}
            {(latestContractLog?.status !== 'created' || latestContractLog.updateCompanyId == myCompanyId) && mode == 'edit' && superConstructionId != undefined && (
                <>
                    <Line
                        style={{
                            marginTop: 30,
                        }}
                    />
                    <AppButton
                        style={{ marginTop: 30, marginHorizontal: 20 }}
                        isGray
                        title={t('common:Delete')}
                        onPress={() => {
                            Alert.alert(t('admin:WantToRemoveThisContract'), t('admin:AllRelatedConstructionContractAttendanceAfterThisContractWillDelete'), [
                                { text: t('common:Delete'), onPress: () => _deleteContract() },
                                {
                                    text: t('common:Cancel'),
                                    style: 'cancel',
                                },
                            ])
                        }}
                    />
                </>
            )}

            <BottomMargin />
        </KeyboardAwareScrollView>
    )
}
export default EditContract

const styles = StyleSheet.create({})
