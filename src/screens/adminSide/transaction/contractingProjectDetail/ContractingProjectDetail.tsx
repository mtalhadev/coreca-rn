import React, { useState, useEffect, useContext, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, View, StyleSheet, Alert } from 'react-native'
import { useNavigation, useRoute, RouteProp, useIsFocused } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { ColumnType, TableArea } from '../../../../components/atoms/TableArea'
import { Line } from '../../../../components/atoms/Line'
import { AppButton } from '../../../../components/atoms/AppButton'
import { BottomMargin } from '../../../../components/atoms/BottomMargin'
import { ShadowBoxWithHeader } from '../../../../components/organisms/shadowBox/ShadowBoxWithHeader'
import { GlobalStyles } from '../../../../utils/Styles'
import { StoreType } from '../../../../stores/Store'
import { ContractingProjectDetailRouterContext } from './ContractingProjectDetailRouter'
import { deleteParamOfLocalUpdateScreens, setLoading, setLocalUpdateScreens, setToastMessage, ToastMessage } from '../../../../stores/UtilSlice'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { deleteTargetProject, getContractingProjectDetail } from '../../../../usecases/project/CommonProjectCase'
import { Contract } from '../../../../components/organisms/contract/Contract'
import { ContractType } from '../../../../models/contract/Contract'
import { ImageIcon } from '../../../../components/organisms/ImageIcon'
import { checkLockOfTarget } from '../../../../usecases/lock/CommonLockCase'
import { AddressMap } from '../../../../components/organisms/AddressMap'
import DisplayIdInDev from '../../../../components/atoms/DisplayIdInDEV'
import { updateCachedData, getCachedData, genKeyName } from '../../../../usecases/CachedDataCase'
import { _setAccountListForDev } from '../../../../services/account/AccountService'
import { getErrorMessage, getErrorToastMessage } from '../../../../services/_others/ErrorService'
import { CustomDate, dayBaseText, getMonthlyFirstDay, monthBaseText, nextMonth, timeBaseText, toCustomDateFromTotalSeconds } from '../../../../models/_others/CustomDate'
import { ScrollViewInstead } from '../../../../components/atoms/ScrollViewInstead'
import { useSafeLoadingUnmount, useSafeUnmount } from '../../../../fooks/useUnmount'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'
import { checkUpdateOfTargetScreen, deleteParamOfUpdateScreens } from '../../../../usecases/updateScreens/CommonUpdateScreensCase'
import { useTextTranslation } from './../../../../fooks/useTextTranslation'
import { departmentsToText } from '../../../../usecases/worker/CommonWorkerCase'
import { checkMyDepartment } from '../../../../usecases/department/DepartmentCase'
import { setDeletedConstructionIds, setIsCacheReady } from '../../../../stores/CacheSlice'
import { ConstructionListCacheReturnType, deleteTargetConstructionsFromCache, restoreConstructionsCache } from '../../../../usecases/construction/MyConstructionCase'
import uniq from 'lodash/uniq'
import { THEME_COLORS } from '../../../../utils/Constants'
import { cancelContractLog, updateApproveContract, updateApproveContractDelete } from '../../../../usecases/contract/CommonContractCase'
import { _getProjectConstructionListOfTargetProject } from '../../../../services/construction/ConstructionService'
import { ProjectType } from '../../../../models/project/Project'
import { DateDataType } from '../../../../models/date/DateDataType'
import { CachedReceiveListType } from '../ReceiveList'
import { CachedOrderListType } from '../OrderList'

type NavProps = StackNavigationProp<RootStackParamList, 'ContractingProjectDetail'>
type RouteProps = RouteProp<RootStackParamList, 'ContractingProjectDetail'>

type InitialStateType = {
    contract?: ContractType
    isFetching: boolean
    updateCache: number
}

const initialState: InitialStateType = {
    isFetching: false,
    updateCache: 0,
}

type ExtendedDateDataType = {
    monthlyData: DateDataType[]
    projects: ProjectType[]
}

const ContractingProjectDetail = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const myCompanyId = useSelector((state: StoreType) => state?.account?.belongCompanyId)
    const myWorkerId = useSelector((state: StoreType) => state.account.signInUser?.workerId)
    const accountId = useSelector((state: StoreType) => state.account.signInUser?.accountId ?? '')
    const [{ contract, isFetching, updateCache }, setState] = useState(initialState)
    const project = contract?.project ?? {}
    const dispatch = useDispatch()
    const { projectId, contractId, constructionIds, contractor } = useContext(ContractingProjectDetailRouterContext)
    const isFocused = useIsFocused()
    const cachedContractKey = genKeyName({ screenName: 'ContractingProjectDetail', accountId: accountId, contractId: contractId ?? '', companyId: myCompanyId ?? '' })
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const localUpdateScreens = useSelector((state: StoreType) => state?.util?.localUpdateScreens)
    const activeDepartments = useSelector((state: StoreType) => state.account?.activeDepartments)
    const activeDepartmentIds = useMemo(() => activeDepartments?.map((dep) => dep?.departmentId).filter((data) => data != undefined) as string[], [activeDepartments])
    const latestContractLog = useMemo(
        () =>
            contract?.contractLog?.totalContractLogs?.items && contract.contractLog?.latestContractLog != undefined
                ? contract?.contractLog?.totalContractLogs.items[contract.contractLog?.latestContractLog]
                : undefined,
        [contract?.contractLog],
    )
    const isDefaultDepartment = useMemo(() => activeDepartments?.map((dep) => dep?.isDefault)[0], [activeDepartments])

    const startDate = useMemo(() => (project?.startDate ? toCustomDateFromTotalSeconds(project?.startDate) : undefined), [project?.startDate])
    const endDate = useMemo(() => (project?.endDate ? toCustomDateFromTotalSeconds(project?.endDate) : undefined), [project?.endDate])
    useSafeUnmount(setState, initialState)

    useEffect(() => {
        if (isFocused) {
            setState((prev) => ({ ...prev, updateCache: updateCache + 1 }))

            /**
             * 作成編集削除により、キャッシュと表示内容が異なる場合にDBフェッチ
             */
            ;(async () => {
                const isUpdateResult = await checkUpdateOfTargetScreen({
                    targetId: contract?.contractId,
                    accountId: accountId,
                    targetScreenName: 'ContractingProjectDetail',
                    localUpdateScreens,
                })
                if (isUpdateResult.success) {
                    dispatch(setIsNavUpdating(true))
                }
            })()
        }
    }, [isFocused, contract?.contractId])

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            setState((prev) => ({ ...prev, isFetching: true }))
        }
    }, [isNavUpdating])

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        return () => setState(initialState)
    }, [myCompanyId])

    useEffect(() => {
        ;(async () => {
            try {
                if (contractId == undefined || isFetching != true) {
                    return
                }
                if (isFocused) dispatch(setLoading(true))
                const projectResult = await getContractingProjectDetail({
                    contractId,
                    myCompanyId,
                })
                if (projectResult.error) {
                    throw {
                        error: projectResult.error,
                    }
                }
                const cachedResult = await getCachedData<ContractType>(cachedContractKey ?? 'no-id')
                if (cachedResult.success) {
                    setState((prev) => ({ ...prev, contract: cachedResult.success as ContractType}))
                    if (projectResult.success?.updatedAt == undefined) return
                    if (cachedResult.success.updatedAt && cachedResult.success.updatedAt > projectResult.success?.updatedAt) {
                        // キャッシュよりDBが古い場合、更新しない
                        return
                    }
                }
                /**
                 * キャッシュアップデート前に先に表示データを更新。
                 */
                setState((prev) => ({ ...prev, contract: projectResult.success }))
                const cachedContractResult = await updateCachedData({ key: cachedContractKey, value: projectResult.success ?? {} })
                if (cachedContractResult.error) {
                    dispatch(
                        setToastMessage({
                            text: cachedContractResult.error,
                            type: 'error',
                        }),
                    )
                }
                deleteParamOfLocalUpdateScreens({
                    screens: localUpdateScreens,
                    screenName: 'ContractingProjectDetail',
                    id: contractId,
                    paramName: 'ids',
                })
                await deleteParamOfUpdateScreens({
                    accountId,
                    screenName: 'ContractingProjectDetail',
                    id: contractId,
                    paramName: 'ids',
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
                setState((prev) => ({ ...prev, isFetching: false }))
                if (isFocused) {
                    dispatch(setIsNavUpdating(false))
                    dispatch(setLoading(false))
                }
            }
        })()
    }, [isFetching])

    /**
     * @summary 取引先一覧のキャッシュを更新する副作用関数
     * @purpose アプリ側にKVSによるキャッシュを設けて一覧の初期表示速度を改善する
     * @author Okuda
     */
    useEffect(() => {
        ;(async () => {
            const result = await getCachedData<ContractType>(cachedContractKey)
            if (result.error) {
                if (result.errorCode != 'FIRST_FETCH') {
                    dispatch(
                        setToastMessage({
                            text: result.error,
                            type: 'error',
                        }),
                    )
                }
                setState((rev) => ({ ...rev, isFetching: true }))
            } else {
                setState((rev) => ({ ...rev, contract: result.success }))
            }
        })()
    }, [updateCache])

    const _updateReceiveListCache = async (projectId: string, startDate?: CustomDate, endDate?: CustomDate) => {
        if (startDate == undefined || endDate == undefined) return

        // 月を跨ぐ場合、月毎に生成する
        let month = getMonthlyFirstDay(startDate)
        let cacheKeys = []
        while (month.totalSeconds <= getMonthlyFirstDay(endDate).totalSeconds) {
            const cachedKey = genKeyName({
                    screenName: 'ReceiveList',
                    accountId: accountId,
                    companyId: myCompanyId as string,
                    month: month ? monthBaseText(month).replace(/\//g, '-') : '',
                })
            cacheKeys.push(cachedKey)
            month = nextMonth(month)
        }
        const promises = cacheKeys.map(async (cachedKey): Promise<CustomResponse<undefined>> => {
            try {
                const receiveListCacheData = await getCachedData<CachedReceiveListType>(cachedKey)
                if (receiveListCacheData.success?.projectInfo) {
                    const newProjects = receiveListCacheData.success.projectInfo.projects?.filter((project)=>project.projectId!=projectId)
                    receiveListCacheData.success.projectInfo.projects = newProjects
                    receiveListCacheData.success.projectInfo.updatedAt = Number(new Date())
                    await updateCachedData({ key: cachedKey, value: receiveListCacheData.success })
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

    const _updateOrderListCache = async (projectId: string, startDate?: CustomDate, endDate?: CustomDate) => {
        if (startDate == undefined || endDate == undefined) return

        // 月を跨ぐ場合、月毎に生成する
        let month = getMonthlyFirstDay(startDate)
        let cacheKeys = []
        while (month.totalSeconds <= getMonthlyFirstDay(endDate).totalSeconds) {
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
                if (orderListCacheData.success?.projectInfo) {
                    const newProjects = orderListCacheData.success.projectInfo.projects?.filter((project)=>project.projectId!=projectId)
                    orderListCacheData.success.projectInfo.projects = newProjects
                    orderListCacheData.success.projectInfo.updatedAt = Number(new Date())
                    await updateCachedData({ key: cachedKey, value: orderListCacheData.success })
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

    const _updateAdminHomeCache = async (projectId: string, startDate?: CustomDate, endDate?: CustomDate) => {
        if (startDate == undefined || endDate == undefined) return

        // 月を跨ぐ場合、月毎に生成する
        let month = getMonthlyFirstDay(startDate)
        let cacheKeys = []
        while (month.totalSeconds <= getMonthlyFirstDay(endDate).totalSeconds) {
            const cachedKey = genKeyName({
                    screenName: 'AdminHome',
                    accountId: accountId,
                    companyId: myCompanyId as string,
                    month: month ? monthBaseText(month).replace(/\//g, '-') : '',
                })
            cacheKeys.push(cachedKey)
            month = nextMonth(month)
        }
        const promises = cacheKeys.map(async (cachedKey): Promise<CustomResponse<undefined>> => {
            try {
                const adminHomeCacheData = await getCachedData<ExtendedDateDataType>(cachedKey)
                if (adminHomeCacheData.success?.monthlyData) {
                    adminHomeCacheData.success?.monthlyData.map((dateData)=>{
                        const newSites = dateData.sites?.totalSites?.items?.filter((site)=>site.construction?.contract?.projectId!=projectId)
                        if (dateData.sites?.totalSites?.items) {
                            dateData.sites.totalSites.items = newSites
                            dateData.updatedAt = Number(new Date())
                        }
                    })
                    await updateCachedData({ key: cachedKey, value: adminHomeCacheData.success })
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

    const _deleteProject = async () => {
        try {
            if (projectId == undefined) {
                throw {
                    error: t('common:NoId'),
                }
            }
            if (
                contract?.receiveCompanyId == myCompanyId &&
                !checkMyDepartment({
                    targetDepartmentIds: contract?.receiveDepartmentIds,
                    activeDepartmentIds,
                })
            ) {
                throw {
                    error: t('admin:TheContractIsInAnotherDepartmentPleaseSwitchDepartments') + '\n' + t('common:Department') + ': ' + departmentsToText(contract?.receiveDepartments?.items),
                    errorCode: 'DELETE_PROJECT_ERROR',
                }
            }
            dispatch(setLoading('unTouchable'))
            const lockResult = await checkLockOfTarget({
                myWorkerId: myWorkerId ?? 'no-id',
                targetId: projectId ?? 'no-id',
                modelType: 'project',
            })
            if (lockResult.error) {
                if (isFocused) dispatch(setLoading(false))
                throw {
                    error: lockResult.error,
                }
            }

            // 取引一覧キャッシュ更新
            await _updateReceiveListCache(projectId, project?.startDate ? toCustomDateFromTotalSeconds(project?.startDate): undefined, project?.endDate ? toCustomDateFromTotalSeconds(project?.endDate) : undefined)
            await _updateOrderListCache(projectId, project?.startDate ? toCustomDateFromTotalSeconds(project?.startDate): undefined, project?.endDate ? toCustomDateFromTotalSeconds(project?.endDate) : undefined)
            // 現場カレンダーキャッシュ更新
            await _updateAdminHomeCache(projectId, project?.startDate ? toCustomDateFromTotalSeconds(project?.startDate): undefined, project?.endDate ? toCustomDateFromTotalSeconds(project?.endDate) : undefined)

            /**
             * DBから案件削除前に案件内の工事をキャッシュから削除
             */
            let cacheBackUp: ConstructionListCacheReturnType[] | undefined
            if (constructionIds !== undefined && constructionIds?.length > 0) {
                dispatch(setIsCacheReady(false))

                const deleteTargetConstructionsFromCacheResult = await deleteTargetConstructionsFromCache({
                    constructionIds,
                    myCompanyId,
                    accountId,
                    startDate: project?.startDate ? toCustomDateFromTotalSeconds(project?.startDate) : undefined,
                    endDate: project?.endDate ? toCustomDateFromTotalSeconds(project?.endDate) : undefined,
                    dispatch,
                })
                if (deleteTargetConstructionsFromCacheResult.error) {
                    console.log('error: ', '削除した工事をキャッシュへ反映するのに失敗しました')
                    // throw {
                    //     error: deleteTargetConstructionFromCacheResult.error,
                    //     errorCode: deleteTargetConstructionFromCacheResult.errorCode,
                    // }
                } else {
                    cacheBackUp = deleteTargetConstructionsFromCacheResult.success
                }
                dispatch(setIsCacheReady(true))
            }

            const result = await deleteTargetProject({
                projectId,
            })
            if (isFocused) dispatch(setLoading(false))
            if (result.error) {
                if (cacheBackUp !== undefined) {
                    dispatch(setIsCacheReady(false))
                    const restoreConstructionsCacheResult = await restoreConstructionsCache({
                        cacheData: cacheBackUp,
                    })
                    if (restoreConstructionsCacheResult.error) {
                        console.log('削除した工事のキャッシュデータ復元に失敗しました')
                        // throw {
                        //     error: restoreConstructionsCacheResult.error,
                        //     errorCode: restoreConstructionsCacheResult.errorCode,
                        // }
                    }
                    dispatch(setIsCacheReady(true))
                }

                throw {
                    error: result.error,
                }
            }
            dispatch(
                setToastMessage({
                    text: t('admin:CaseRemoved'),
                    type: 'success',
                } as ToastMessage),
            )
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

    /**
     * 現在の契約と編集依頼のあった契約の差分を取得する
     */
    const getChangeContentsList = useMemo(() => {
        let instructionList: ColumnType[] = []
        if (contract?.remarks != latestContractLog?.contract?.remarks) {
            instructionList.push({
                key: t('common:Remarks'),
                content: t('common:BeforeChange') + `：${contract?.remarks ?? ''}\n` + t('common:AfterChange') + `：${latestContractLog?.contract?.remarks}`,
            })
        }
        if (contract?.contractAt != latestContractLog?.contract?.contractAt && contract?.contractAt != undefined && latestContractLog?.contract?.contractAt != undefined) {
            instructionList.push({
                key: t('common:ContractDate'),
                content:
                    t('common:BeforeChange') +
                    `：${timeBaseText(toCustomDateFromTotalSeconds(contract?.contractAt))}\n` +
                    t('common:AfterChange') +
                    `：${timeBaseText(toCustomDateFromTotalSeconds(latestContractLog?.contract?.contractAt))}`,
            })
        }
        return instructionList
    }, [contract])

    /**
     * 契約の承認・非承認
     * @param isApproved 承認ならtrue,非承認ならfalse
     */
    const changeContractStatus = async (isApproved: boolean) => {
        try {
            if (
                !checkMyDepartment({
                    targetDepartmentIds: contract?.orderCompanyId == myCompanyId ? contract?.orderDepartmentIds : contract?.receiveDepartmentIds,
                    activeDepartmentIds,
                })
            ) {
                throw {
                    error:
                        t('admin:TheContractIsInAnotherDepartmentPleaseSwitchDepartments') +
                        '\n' +
                        t('common:Department') +
                        ': ' +
                        departmentsToText(contract?.orderCompanyId == myCompanyId ? contract?.orderDepartments?.items : contract?.receiveDepartments?.items),
                    type: 'error',
                }
            }
            if (latestContractLog?.status == 'created' && isApproved && contract?.superConstructionId != undefined && isDefaultDepartment != true) {
                navigation.navigate('EditContract', {
                    contractId: contract?.contractId,
                    projectId: contract?.projectId,
                    superConstructionId: contract?.superConstruction?.constructionId,
                })
                return
            }
            dispatch(setLoading('unTouchable'))
            const result = await updateApproveContract({
                contractId,
                isApproved,
                myCompanyId,
                ...(isDefaultDepartment
                    ? {
                          receiveDepartmentIds: [activeDepartments?.filter((dep) => dep?.isDefault)[0]?.departmentId].filter((data) => data != undefined) as string[],
                      }
                    : {}),
            })
            if (isFocused) dispatch(setLoading(false))
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: result.errorCode,
                }
            }
            setState((prev) => ({ ...prev, isFetching: true }))
            if (!isApproved && latestContractLog?.status == 'created') {
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
        } finally {
            if (isFocused) dispatch(setLoading(false))
        }
    }

    const changeContractDeleteStatus = async (isApproved: boolean) => {
        try {
            if (
                !checkMyDepartment({
                    targetDepartmentIds: contract?.orderCompanyId == myCompanyId ? contract?.orderDepartmentIds : contract?.receiveDepartmentIds,
                    activeDepartmentIds,
                })
            ) {
                throw {
                    error:
                        t('admin:TheContractIsInAnotherDepartmentPleaseSwitchDepartments') +
                        '\n' +
                        t('common:Department') +
                        ': ' +
                        departmentsToText(contract?.orderCompanyId == myCompanyId ? contract?.orderDepartments?.items : contract?.receiveDepartments?.items),
                    type: 'error',
                }
            }
            dispatch(setLoading('unTouchable'))
            const result = await updateApproveContractDelete({
                contractId,
                isApproved,
                myCompanyId,
            })
            if (isFocused) dispatch(setLoading(false))
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: result.errorCode,
                }
            }
            if (isApproved) {
                dispatch(
                    setToastMessage({
                        text: t('admin:ContractDeleted'),
                        type: 'success',
                    } as ToastMessage),
                )
                navigation.goBack()
            } else {
                setState((prev) => ({ ...prev, isFetching: true }))
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

    const cancelUpdateContract = async () => {
        try {
            if (myCompanyId != latestContractLog?.updateCompanyId) {
                return
            }
            if (
                !checkMyDepartment({
                    targetDepartmentIds: contract?.orderCompanyId == myCompanyId ? contract?.orderDepartmentIds : contract?.receiveDepartmentIds,
                    activeDepartmentIds,
                })
            ) {
                throw {
                    error:
                        t('admin:TheContractIsInAnotherDepartmentPleaseSwitchDepartments') +
                        '\n' +
                        t('common:Department') +
                        ': ' +
                        departmentsToText(contract?.orderCompanyId == myCompanyId ? contract?.orderDepartments?.items : contract?.receiveDepartments?.items),
                    type: 'error',
                }
            }
            const result = await cancelContractLog({
                contractLogId: latestContractLog?.contractLogId,
                contractId,
            })
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: result.errorCode,
                }
            }
            setState((prev) => ({ ...prev, isFetching: true }))
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
        <ScrollViewInstead
            style={{
                flex: 1,
                backgroundColor: '#fff',
                paddingHorizontal: 20,
            }}>
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 10,
                }}>
                <ImageIcon
                    type={'project'}
                    size={40}
                    imageUri={project.sImageUrl ?? project.imageUrl}
                    imageColorHue={project.imageColorHue}
                    style={{
                        marginRight: 10,
                    }}
                />
                <Text
                    style={{
                        ...GlobalStyles.headerText,
                        fontSize: 18,
                        flex: 1,
                    }}>
                    {project?.name ?? '???'}
                </Text>
            </View>

            <TableArea
                style={{
                    marginTop: 10,
                }}
                contentRatio={2}
                columns={[
                    {
                        key: '案件名',
                        content: project?.name,
                    },
                    {
                        key: '案件期間',
                        content: `${startDate ? dayBaseText(startDate) : t('common:Undecided')}〜${endDate ? dayBaseText(endDate) : t('common:Undecided')}`,
                    },
                    {
                        key: '編集者',
                        content: project.updateWorker ? `${project.updateWorker?.name} ＠${project.updateWorker?.company?.name}` : undefined,
                    },
                    {
                        key: '作成会社',
                        content: project?.createCompany?.name,
                    },
                ]}
            />
            <AddressMap
                location={{
                    address: project.siteAddress,
                }}
                style={{
                    marginTop: 10,
                }}
            />
            <ShadowBoxWithHeader
                title={contract?.project?.isFakeCompanyManage ? t('admin:SupportAgreement') : t('admin:ContractAgreement')}
                style={{
                    marginTop: 10,
                }}>
                <Contract
                    type={contractor !== undefined && contractor.companyId !== myCompanyId ? 'order' : contract?.orderCompanyId !== myCompanyId ? 'order' : 'receive'}
                    contract={contract}
                    contractor={
                        contractor !== undefined && contractor.companyId !== myCompanyId ? contractor : contract?.orderCompanyId !== myCompanyId ? contract?.orderCompany : contract?.receiveCompany
                    }
                />
                {(contract?.status == 'edited' || contract?.status == 'created') && latestContractLog?.status != 'delete' && (
                    <View>
                        <Text
                            style={{
                                ...GlobalStyles.mediumText,
                                color: THEME_COLORS.OTHERS.ALERT_RED,
                                marginTop: 10,
                            }}>
                            {latestContractLog?.status == 'waiting'
                                ? t('admin:ThereIsAChangeInContract')
                                : contract?.orderCompanyId == myCompanyId
                                ? t('admin:ConstructionOrdered')
                                : t('admin:ConstructionHasBeenOrdered')}
                        </Text>
                        {latestContractLog?.status == 'waiting' && <TableArea style={{ marginTop: 10 }} columns={getChangeContentsList} />}
                        {latestContractLog?.updateCompanyId != myCompanyId && (
                            <View
                                style={{
                                    flexDirection: 'row',
                                    marginTop: 10,
                                }}>
                                <AppButton
                                    style={{
                                        marginTop: 10,
                                        flex: 1,
                                    }}
                                    title={t('admin:Approve')}
                                    onPress={() => changeContractStatus(true)}
                                />
                                <AppButton
                                    style={{
                                        marginTop: 10,
                                        flex: 1,
                                        marginLeft: 10,
                                    }}
                                    title={t('admin:NotApprove')}
                                    onPress={() => changeContractStatus(false)}
                                />
                            </View>
                        )}
                    </View>
                )}
                {contract?.status == 'edited' && latestContractLog?.status == 'delete' && (
                    <View
                        style={{
                            marginTop: 10,
                        }}>
                        <Text
                            style={{
                                ...GlobalStyles.mediumText,
                                color: THEME_COLORS.OTHERS.ALERT_RED,
                                marginTop: 10,
                            }}>
                            {t('admin:ThereIsARequestToDeleteTheContract')}
                        </Text>
                        {latestContractLog.updateCompanyId != myCompanyId && (
                            <View
                                style={{
                                    flexDirection: 'row',
                                    marginTop: 10,
                                }}>
                                <AppButton
                                    style={{
                                        marginTop: 10,
                                        flex: 1,
                                    }}
                                    title={t('admin:Approve')}
                                    onPress={() => changeContractDeleteStatus(true)}
                                />
                                <AppButton
                                    style={{
                                        marginTop: 10,
                                        flex: 1,
                                        marginLeft: 10,
                                    }}
                                    title={t('admin:NotApprove')}
                                    onPress={() => changeContractDeleteStatus(false)}
                                />
                            </View>
                        )}
                    </View>
                )}
                {contract?.status == 'edited' && latestContractLog?.updateCompanyId == myCompanyId && (
                    <AppButton
                        style={{
                            marginTop: 10,
                        }}
                        title={t('admin:DeleteInstruction')}
                        onPress={() => cancelUpdateContract()}
                    />
                )}
                <AppButton
                    title={t('admin:ContractLog')}
                    style={{
                        marginTop: 15,
                    }}
                    isGray
                    onPress={() => {
                        navigation.push('ContractLogList', {
                            contractId: contract?.contractId,
                        })
                    }}
                />
            </ShadowBoxWithHeader>
            {(contract?.status == 'approved' || latestContractLog?.updateCompanyId == myCompanyId) && (
                <AppButton
                    title={t('admin:EditContract')}
                    style={{
                        marginTop: 15,
                    }}
                    onPress={
                        checkMyDepartment({
                            targetDepartmentIds: contract?.orderCompanyId == myCompanyId ? contract?.orderDepartmentIds : contract?.receiveDepartmentIds,
                            activeDepartmentIds,
                        })
                            ? () => {
                                  navigation.push('EditContract', {
                                      contractId: contract?.contractId,
                                      projectId: contract?.projectId,
                                      superConstructionId: contract?.superConstruction?.constructionId,
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
                                              departmentsToText(contract?.orderCompanyId == myCompanyId ? contract?.orderDepartments?.items : contract?.receiveDepartments?.items),
                                          type: 'error',
                                      } as ToastMessage),
                                  )
                    }
                />
            )}

            {project?.createCompany?.companyId != undefined && project?.createCompany?.companyId == myCompanyId && (
                <>
                    <Line
                        style={{
                            marginTop: 30,
                        }}
                    />
                    <AppButton
                        title={t('common:EditACase')}
                        style={{
                            marginTop: 30,
                        }}
                        onPress={
                            checkMyDepartment({
                                targetDepartmentIds: contract?.orderCompanyId == myCompanyId ? contract?.orderDepartmentIds : contract?.receiveDepartmentIds,
                                activeDepartmentIds,
                            })
                                ? () => {
                                      navigation.push('EditProject', {
                                          projectId: projectId,
                                          contractId: contractId,
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
                                                  departmentsToText(contract?.orderCompanyId == myCompanyId ? contract?.orderDepartments?.items : contract?.receiveDepartments?.items),
                                              type: 'error',
                                          } as ToastMessage),
                                      )
                        }
                    />
                    {project.fakeCompanyInvReservationId == undefined && (
                        <AppButton
                            title={t('common:DeleteACase')}
                            style={{
                                marginTop: 20,
                            }}
                            isGray
                            onPress={() => {
                                Alert.alert(t('admin:WantToDeleteTheCase'), t('admin:RelatedConstructionContractsWillDelete'), [
                                    { text: t('common:Deletion'), onPress: () => _deleteProject() },
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

            <DisplayIdInDev id={contract?.contractId} label="contractId" />

            <BottomMargin />
        </ScrollViewInstead>
    )
}
export default ContractingProjectDetail

const styles = StyleSheet.create({})
