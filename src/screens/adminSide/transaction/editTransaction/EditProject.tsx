/**
 * @deprecated
 * 案件・工事を作成する画面に置き換え (EditConstruction)
 */
/* eslint-disable indent */
import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, View, StyleSheet, Pressable, AppState } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import Modal from 'react-native-modal'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { CustomDate, getDailyStartTime, getMonthlyFirstDay, monthBaseText, newCustomDate, nextDay, nextMonth, toCustomDateFromTotalSeconds } from '../../../../models/_others/CustomDate'
import { InputTextBox } from '../../../../components/organisms/inputBox/InputTextBox'
import { AppButton } from '../../../../components/atoms/AppButton'
import { BottomMargin } from '../../../../components/atoms/BottomMargin'
import { getRandomImageColorHue, getRandomName, getUuidv4, pickImage, SwitchEditOrCreateProps } from '../../../../utils/Utils'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import {
    DEFAULT_SITE_END_TIME,
    DEFAULT_SITE_MEETING_TIME,
    DEFAULT_SITE_START_TIME,
    dMarginTop,
    INITIAL_CONSTRUCTION_NAME,
    LOCK_INTERVAL_TIME,
    MAX_PROJECT_SPAN,
    PLACEHOLDER,
    THEME_COLORS,
} from '../../../../utils/Constants'
import { FontStyle, GlobalStyles } from '../../../../utils/Styles'
import { setLoading, setLocalUpdateScreens, setToastMessage, ToastMessage } from '../../../../stores/UtilSlice'
import flatten from 'lodash/flatten'
import isEmpty from 'lodash/isEmpty'
import uniqBy from 'lodash/uniqBy'
import { InputCompanyBox } from '../../../../components/organisms/inputBox/InputCompanyBox'
import { StoreType } from '../../../../stores/Store'
import { useIsFocused } from '@react-navigation/native'
import { getMyCompanyProjects, writeMyProject } from '../../../../usecases/project/MyProjectCase'
import { InputDateTimeBox } from '../../../../components/organisms/inputBox/InputDateTimeBox'
import { getTargetProject } from '../../../../usecases/project/CommonProjectCase'
import { getMyCompany } from '../../../../usecases/company/MyCompanyCase'
import { CompanyCLType, CompanyType } from '../../../../models/company/Company'
import { ImageIcon } from '../../../../components/organisms/ImageIcon'
import { ImageInfo } from 'expo-image-picker/build/ImagePicker.types'
import { checkLockOfTarget, updateLockOfTarget } from '../../../../usecases/lock/CommonLockCase'
import { ProjectCLType, ProjectType, toProjectCLType } from '../../../../models/project/Project'
import { getErrorMessage, getErrorToastMessage } from '../../../../services/_others/ErrorService'
import { BaseModal } from '../../../../components/organisms/BaseModal'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'
import { useSafeLoadingUnmount } from '../../../../fooks/useUnmount'
import { useTextTranslation } from './../../../../fooks/useTextTranslation'

import { toCustomDatesListFromStartAndEnd, UpdateScreenType } from '../../../../models/updateScreens/UpdateScreens'
import { _getFirestore } from '../../../../services/firebase/FirestoreService'
import { ConstructionType } from '../../../../models/construction/Construction'
import { InputObject, InputObjectDropdownBox } from '../../../../components/organisms/inputBox/InputObjectDropdownBox'
import { DepartmentManageType } from '../../../../models/department/DepartmentManageType'
import { genKeyName, getCachedData, updateCachedData } from '../../../../usecases/CachedDataCase'
import { ContractType } from '../../../../models/contract/Contract'
import { ContractingProjectConstructionListType } from '../../../../models/construction/ContractingProjectConstructionListType'
import { InvReservationType } from '../../../../models/invReservation/InvReservation'
import { MonthlySiteType } from '../../../../models/site/MonthlySiteType'
import { calculateConstructionDays } from '../../../../usecases/construction/CommonConstructionCase'
import { CachedReceiveListType } from '../ReceiveList'
type NavProps = StackNavigationProp<RootStackParamList, 'EditProject'>
type RouteProps = RouteProp<RootStackParamList, 'EditProject'>

type InitialStateType = {
    id?: string
    orderCompany?: CompanyCLType
    receiveCompany?: CompanyCLType
    projects?: ProjectCLType[]
    update: number
    disable: boolean
    similarProjects?: string[]
    siteAddress?: string
    isExceededPeriod?: boolean
    fakeCompanyInvReservationId?: string
    constructionIds?: string[]
    receiveCompanyDepartments?: InputObject[]
    selectedReceiveCompanyDepartments?: InputObject[]
} & EditProjectUIType

export type EditProjectUIType = {
    name?: string
    startDate?: CustomDate
    endDate?: CustomDate
    image?: ImageInfo
    imageUrl?: string
    sImageUrl?: string
    xsImageUrl?: string
    imageColorHue?: number
}

const initialState: InitialStateType = {
    update: 0,
    disable: true,
    similarProjects: [],
    isExceededPeriod: false,
}

type CachedMonthlySiteType = {
    monthlySite: MonthlySiteType
    construction: ConstructionType
}

const EditProject = (props: Partial<SwitchEditOrCreateProps>) => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const mode = props.mode ?? 'edit'
    const _isRequestProject = route?.params?.isRequestProject
    const contractId = route?.params?.contractId
    const company = route?.params?.company
    const targetDate = route?.params?.targetDate
    const signInUser = useSelector((state: StoreType) => state.account.signInUser)
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const accountId = useSelector((state: StoreType) => state.account.signInUser?.accountId ?? '')

    const [
        {
            id,
            name,
            startDate,
            endDate,
            update,
            orderCompany,
            image,
            receiveCompany,
            projects,
            disable,
            imageUrl,
            sImageUrl,
            xsImageUrl,
            imageColorHue,
            similarProjects,
            siteAddress,
            isExceededPeriod,
            fakeCompanyInvReservationId,
            constructionIds,
            receiveCompanyDepartments,
            selectedReceiveCompanyDepartments,
        },
        setState,
    ] = useState(initialState)
    const dispatch = useDispatch()
    const [appState, setAppState] = useState(AppState.currentState)
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const localUpdateScreens = useSelector((state: StoreType) => state?.util?.localUpdateScreens)
    const activeDepartments = useSelector((state: StoreType) => state?.account?.activeDepartments)
    const isDefaultDepartment = useMemo(() => activeDepartments?.map((dep) => dep?.isDefault)[0], [activeDepartments])

    const [selectedCompany, setSelectedCompany] = useState<CompanyCLType | undefined>(undefined)
    const [myCompany, setMyCompany] = useState<CompanyCLType | undefined>(undefined)

    const unsubscribeRef = useRef<any>(null)
    const isScreenOnRef = useRef<boolean>(false)

    useEffect(() => {
        if (isFocused) {
            setState((prev) => ({ ...prev, update: update + 1 }))
        }

        isScreenOnRef.current = isFocused
    }, [isFocused])

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            setState((prev) => ({ ...prev, update: update + 1 }))
        }
    }, [isNavUpdating])

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        navigation.setOptions({
            title: mode == 'new' ? t('admin:CreateACase') : t('admin:EditACase'),
        })
    }, [navigation])

    useEffect(() => {
        /**
         * 新規作成にて、デフォルトで受注部署をセットする
         */
        if (activeDepartments?.length ?? 0 > 0) {
            const _receiveCompanyDepartments = activeDepartments?.map((dep) => {
                return { tag: dep.departmentName, value: dep.departmentId } as InputObject
            })
            setState((prev) => ({ ...prev, receiveCompanyDepartments: _receiveCompanyDepartments, selectedReceiveCompanyDepartments: _receiveCompanyDepartments }))
        } else {
            ;(async () => {
                try {
                    /**
                     * 編集作業員が全部署の場合の対応
                     */
                    if (!isScreenOnRef.current) {
                        return
                    }
                    const db = _getFirestore()
                    db.collection('DepartmentManage')
                        .where('companyId', '==', myCompanyId)
                        .onSnapshot(async (data) => {
                            const _departmentList = data.docs.map((doc) => doc.data())[0] as DepartmentManageType | undefined
                            const _companyDepartments = _departmentList?.departments?.map((dep) => {
                                return {
                                    tag: dep.departmentName,
                                    value: dep.departmentId,
                                } as InputObject
                            })
                            setState((prev) => ({ ...prev, receiveCompanyDepartments: _companyDepartments, selectedReceiveCompanyDepartments: _companyDepartments }))
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
            })()
        }
    }, [activeDepartments])

    useEffect(() => {
        ;(async () => {
            try {
                if (id == undefined || mode == 'new') {
                    return
                }
                if (isFocused) dispatch(setLoading(true))
                const projectResult = await getTargetProject({
                    projectId: id,
                })
                const cachedContractKey = genKeyName({ screenName: 'ContractingProjectDetail', accountId: accountId, contractId: contractId ?? '', companyId: myCompanyId ?? '' })
                const cachedResult = await getCachedData<ContractType>(cachedContractKey ?? 'no-id')
                if (cachedResult.success) {
                    setState((prev) => ({ ...prev, ...toProjectCLType(cachedResult.success?.project) }))
                    if (projectResult.success?.updatedAt == undefined) return
                    if (cachedResult.success.updatedAt && projectResult.success?.updatedAt?.totalSeconds && cachedResult.success.updatedAt > projectResult.success?.updatedAt.totalSeconds) {
                        // キャッシュよりDBが古い場合、キャッシュを設定する
                        return
                    }
                }
                if (projectResult.error) {
                    throw {
                        error: projectResult.error,
                    }
                }
                setState((prev) => ({ ...prev, ...projectResult.success }))
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
    }, [id, update])

    const _getMyCompany = async () => {
        try {
            const myCompanyResult = await getMyCompany({
                myCompanyId,
            })
            if (myCompanyResult.error) {
                throw {
                    error: myCompanyResult.error,
                }
            }
            return myCompanyResult
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
        ;(async () => {
            try {
                if (myCompanyId == undefined || mode == 'edit' || receiveCompany != undefined) {
                    return
                }
                const companyResult = await _getMyCompany()
                const company = companyResult?.success

                let _projects: ProjectCLType[]
                if (mode == 'new') {
                    const projectsResult = await getMyCompanyProjects({ myCompanyId })
                    if (projectsResult.error) {
                        throw {
                            error: projectsResult.error,
                        }
                    }
                    _projects = projectsResult.success ?? []
                }
                setState((prev) => ({ ...prev, receiveCompany: receiveCompany ?? company, projects: _projects }))
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
        return () => setState(initialState)
    }, [myCompanyId])

    useEffect(() => {
        if (isEmpty(name) || (mode == 'new' && receiveCompany == undefined) || startDate == undefined || endDate == undefined || (selectedReceiveCompanyDepartments?.length ?? 0) == 0) {
            setState((prev) => ({ ...prev, disable: true }))
            return
        }
        setState((prev) => ({ ...prev, disable: false }))
    }, [name, startDate, endDate, orderCompany, receiveCompany, selectedReceiveCompanyDepartments])

    useEffect(() => {
        if (mode === 'edit') {
            setState((prev) => ({ ...prev, id: route.params?.projectId }))
        } else {
            setState((prev) => ({ ...prev, id: getUuidv4(), imageColorHue: getRandomImageColorHue(), startDate: targetDate ?? newCustomDate(), endDate: targetDate ?? newCustomDate() }))
        }

        return () => {
            setState({ ...initialState })
        }
    }, [])

    useEffect(() => {
        if (id && signInUser?.workerId && appState == 'active' && isFocused && mode != 'new') {
            ;(async () => {
                try {
                    const lockResult = await checkLockOfTarget({
                        myWorkerId: signInUser?.workerId ?? 'no-id',
                        targetId: id ?? 'no-id',
                        modelType: 'project',
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
                        targetId: id ?? 'no-id',
                        modelType: 'project',
                    })
                    return _update
                })(),
                LOCK_INTERVAL_TIME,
            )
            return () => {
                clearInterval(keepLock)
                updateLockOfTarget({
                    myWorkerId: signInUser?.workerId ?? 'no-id',
                    targetId: id ?? 'no-id',
                    modelType: 'project',
                    unlock: true,
                })
            }
        }
    }, [id, signInUser?.workerId, appState, isFocused])

    useEffect(() => {
        const appState = AppState.addEventListener('change', setAppState)
        return () => {
            appState.remove()
        }
    }, [])

    useEffect(() => {
        setState((prev) => ({ ...prev, ...(__DEV__ ? { name: getRandomName('案件', 5) } : {}) }))
    }, [])

    //
    // 新規案件作成：先に会社選択ページに遷移し、それから案件を作成するページに遷移のフローの場合
    //

    useEffect(() => {
        // 自社: 請負案件・応用案件を切替え時に必要
        ;(async () => {
            const companyResult = await _getMyCompany()
            setMyCompany(companyResult?.success)
        })()
    }, [])

    useEffect(() => {
        if (company) {
            // 会社選択ページから遷移時のorderCompany, receiveCompanyの設定
            setState((prev) => ({ ...prev, orderCompany: company, receiveCompany: myCompany }))
            // 会社選択ページで選択した会社: 請負案件・応用案件を切替え時に必要
            setSelectedCompany(company)
        }
    }, [])

    useEffect(() => {
        /**
         * 全工事の工事詳細が自動更新されるように、全工事のidを取得。localUpdateScreensに渡す。
         */
        try {
            if (!isScreenOnRef.current) return
            if (myCompanyId === undefined || contractId === undefined) {
                return
            }
            const db = _getFirestore()
            unsubscribeRef.current = db
                .collection('ContractingProjectConstructionList')
                .where('companyId', '==', myCompanyId)
                .where('contractId', '==', contractId)
                .onSnapshot(async (data) => {
                    const constructions = data.docs.map((doc) => doc.data().constructions.items)[0] as ConstructionType[] | undefined
                    const ids = constructions?.map((construction) => construction.constructionId).filter((data) => data !== undefined) as string[]
                    setState((prev) => ({
                        ...prev,
                        constructionIds: ids,
                    }))
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
    }, [myCompanyId, contractId])

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

    const checkExistProject = () => {
        const _similarProjects =
            (projects
                ?.filter((project) => project.name && name && project.name.indexOf(name) > -1)
                .map((project) => project.name)
                .filter((data) => data != undefined) as string[]) ?? []

        const sameNameProjects = _similarProjects.filter((projectName) => projectName === name)
        if (sameNameProjects.length > 0) {
            const error = {
                error: t('admin:TheSameNameProjectAlreadyExists'),
            } as CustomResponse
            dispatch(
                setToastMessage({
                    text: getErrorToastMessage(error),
                    type: 'error',
                } as ToastMessage),
            )

            return
        }

        if (_similarProjects.length > 0) {
            setState((prev) => ({ ...prev, similarProjects: _similarProjects }))
        } else {
            _writeProject()
        }
    }

    const _closeModal = () => {
        setState((prev) => ({ ...prev, similarProjects: [] }))
    }

    const _updateReceiveListCache = async (contractId: string, constructionId: string) => {
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
                const newProject: ProjectType = {
                    projectId: id,
                    updateWorkerId: signInUser?.workerId,
                    name,
                    startDate: getDailyStartTime(startDate).totalSeconds,
                    endDate: getDailyStartTime(endDate).totalSeconds,
                    imageUrl,
                    sImageUrl,
                    xsImageUrl,
                    imageColorHue,
                    siteAddress,
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
                                    name: name ?? INITIAL_CONSTRUCTION_NAME,
                                    displayName: name ?? INITIAL_CONSTRUCTION_NAME,
                                    siteMeetingTime: DEFAULT_SITE_MEETING_TIME.totalSeconds,
                                    siteStartTime: DEFAULT_SITE_START_TIME.totalSeconds,
                                    siteEndTime: DEFAULT_SITE_END_TIME.totalSeconds,
                                    siteAddress: siteAddress,
                                    constructionRelation: 'manager',
                                },
                            ],
                        },
                    },
                }
                if (receiveListCacheData.success?.projectInfo) {
                    if (receiveListCacheData.success.projectInfo.projects) {
                        if (mode == 'new') {
                            receiveListCacheData.success.projectInfo.projects.push(newProject)
                        } else {
                            const newProjects = receiveListCacheData?.success?.projectInfo.projects?.map((project) => {
                                if (project.projectId == id) {
                                    project = newProject
                                }
                                return project
                            })
                            receiveListCacheData.success.projectInfo.projects = newProjects
                        }
                    } else {
                        receiveListCacheData.success.projectInfo.projects = [newProject]
                    }
                    receiveListCacheData.success.projectInfo.updatedAt = Number(new Date())
                    await updateCachedData({ key: cachedKey, value: receiveListCacheData.success })
                } else {
                    await updateCachedData({
                        key: cachedKey,
                        value: {
                            projectInfo: {
                                projects: [newProject],
                                updatedAt: Number(new Date()),
                            },
                        },
                    })
                }
                const receiveListCacheDataAfter = await getCachedData<CachedReceiveListType>(cachedKey)
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

    const _updateContractingProjectConstructionListCache = async (contractId: string, constructionId: string) => {
        if (startDate == undefined || endDate == undefined) return

        const contractingProjectConstructionListCacheKey = genKeyName({
            screenName: 'ContractingProjectConstructionList',
            accountId: accountId,
            companyId: myCompanyId as string,
            contractId: contractId as string,
        })
        const contractingProjectConstructionListCacheData = await getCachedData<ContractingProjectConstructionListType>(contractingProjectConstructionListCacheKey)
        const newConstruction: ConstructionType = {
            constructionId: constructionId,
            contractId: contractId,
            name: name ?? INITIAL_CONSTRUCTION_NAME,
            displayName: name ?? INITIAL_CONSTRUCTION_NAME,
            siteMeetingTime: DEFAULT_SITE_MEETING_TIME.totalSeconds,
            siteStartTime: DEFAULT_SITE_START_TIME.totalSeconds,
            siteEndTime: DEFAULT_SITE_END_TIME.totalSeconds,
            siteAddress: siteAddress,
            constructionRelation: 'manager',
        }
        if (contractingProjectConstructionListCacheData.success && contractingProjectConstructionListCacheData.success.constructions) {
            if (contractingProjectConstructionListCacheData.success.constructions.items) {
                if (mode == 'new') {
                    contractingProjectConstructionListCacheData.success.constructions.items.push(newConstruction)
                } else {
                    const newConstructions = contractingProjectConstructionListCacheData.success.constructions?.items.map((construction) => {
                        if (construction.constructionId == constructionId) {
                            construction = newConstruction
                        }
                        return construction
                    })
                    contractingProjectConstructionListCacheData.success.constructions.items = newConstructions
                }
            } else {
                contractingProjectConstructionListCacheData.success.constructions.items = [newConstruction]
            }
            contractingProjectConstructionListCacheData.success.updatedAt = Number(new Date())
            await updateCachedData({ key: contractingProjectConstructionListCacheKey, value: contractingProjectConstructionListCacheData.success })
        } else {
            await updateCachedData({
                key: contractingProjectConstructionListCacheKey,
                value: {
                    constructions: {
                        items: [newConstruction],
                    },
                    updatedAt: Number(new Date()),
                },
            })
        }
    }

    const _updateContractingProjectDetailCache = async (contractId: string, projectId: string) => {
        if (startDate == undefined || endDate == undefined) return

        const contractingProjectDetailCacheKey = genKeyName({
            screenName: 'ContractingProjectDetail',
            accountId: accountId,
            contractId: contractId as string,
            companyId: myCompanyId as string,
        })
        const contractingProjectDetailCacheData = await getCachedData<ContractType>(contractingProjectDetailCacheKey)

        const newContractingProjectDetail: ContractType = {
            contractId: contractId,
            projectId: projectId,
            project: {
                projectId: projectId,
                updateWorkerId: signInUser?.workerId,
                name,
                startDate: getDailyStartTime(startDate).totalSeconds,
                endDate: getDailyStartTime(endDate).totalSeconds,
                imageUrl,
                sImageUrl,
                xsImageUrl,
                imageColorHue,
                siteAddress,
                createCompany: orderCompany?.companyId == myCompanyId ? (orderCompany as CompanyType) : (receiveCompany as CompanyType),
                updateWorker: {
                    name: signInUser?.worker?.name,
                    company: orderCompany?.companyId == myCompanyId ? (orderCompany as CompanyType) : (receiveCompany as CompanyType),
                },
            },
            orderCompany: orderCompany as CompanyType,
            receiveCompany: receiveCompany as CompanyType,
            orderCompanyId: orderCompany?.companyId,
            receiveCompanyId: receiveCompany?.companyId,
            contractAt: mode == 'new' ? Number(new Date()) : contractingProjectDetailCacheData.success?.contractAt,
            updatedAt: Number(new Date()),
        }
        if (contractingProjectDetailCacheData.success) {
            if (mode == 'new') {
                // 新規作成の場合、全部更新
                contractingProjectDetailCacheData.success = newContractingProjectDetail
            } else {
                // 編集の場合、案件のみ更新
                contractingProjectDetailCacheData.success.project = newContractingProjectDetail.project
            }
            await updateCachedData({ key: contractingProjectDetailCacheKey, value: contractingProjectDetailCacheData.success })
        } else {
            await updateCachedData({
                key: contractingProjectDetailCacheKey,
                value: newContractingProjectDetail,
            })
        }
    }

    const _updateConstructionDetailCache = async (projectId: string, contractId: string, constructionId: string) => {
        if (startDate == undefined || endDate == undefined) return
        const cachedConstructionKey = genKeyName({ screenName: 'ConstructionDetail', accountId: accountId, constructionId: constructionId ?? '', companyId: myCompanyId ?? '' })
        const constructionDetailCacheData = await getCachedData<ConstructionType>(cachedConstructionKey)
        const newConstruction: ConstructionType = {
            constructionId: constructionId,
            contractId: contractId,
            name: name ?? INITIAL_CONSTRUCTION_NAME,
            displayName: name ?? INITIAL_CONSTRUCTION_NAME,
            siteMeetingTime: DEFAULT_SITE_MEETING_TIME.totalSeconds,
            siteStartTime: DEFAULT_SITE_START_TIME.totalSeconds,
            siteEndTime: DEFAULT_SITE_END_TIME.totalSeconds,
            siteAddress: siteAddress,
            constructionRelation: 'manager',
            project: {
                projectId: projectId,
                updateWorkerId: signInUser?.workerId,
                name,
                startDate: getDailyStartTime(startDate).totalSeconds,
                endDate: getDailyStartTime(endDate).totalSeconds,
                imageUrl,
                sImageUrl,
                xsImageUrl,
                imageColorHue,
                siteAddress,
                createCompany: orderCompany?.companyId == myCompanyId ? (orderCompany as CompanyType) : (receiveCompany as CompanyType),
                updateWorker: {
                    name: signInUser?.worker?.name,
                    company: orderCompany?.companyId == myCompanyId ? (orderCompany as CompanyType) : (receiveCompany as CompanyType),
                },
            },
            contract: {
                contractId: contractId,
                projectId: projectId,
                orderCompany: orderCompany as CompanyType,
                receiveCompany: receiveCompany as CompanyType,
                orderCompanyId: orderCompany?.companyId,
                receiveCompanyId: receiveCompany?.companyId,
                contractAt: mode == 'new' ? Number(new Date()) : constructionDetailCacheData.success?.contract?.contractAt,
            },
            updatedAt: Number(new Date()),
        }
        const dayCount =
            newConstruction?.project?.startDate &&
            newConstruction?.project?.endDate &&
            calculateConstructionDays(
                toCustomDateFromTotalSeconds(newConstruction.project.startDate),
                toCustomDateFromTotalSeconds(newConstruction.project.endDate),
                newConstruction.offDaysOfWeek,
                newConstruction.otherOffDays?.map((day) => toCustomDateFromTotalSeconds(day)),
            )

        await updateCachedData({
            key: cachedConstructionKey,
            value: { ...(newConstruction ?? {}), dayCount },
        })
    }

    const _updateConstructionSiteListCache = async (projectId: string, contractId: string, constructionId: string) => {
        if (startDate == undefined || endDate == undefined) return
        // 月を跨ぐ場合、月毎に生成する
        let month = getMonthlyFirstDay(startDate)
        let cacheKeys = []
        while (month.totalSeconds <= getMonthlyFirstDay(endDate).totalSeconds) {
            const cachedKey = genKeyName({
                screenName: 'ConstructionSiteList',
                accountId: accountId,
                companyId: myCompanyId as string,
                constructionId: constructionId as string,
                month: month ? monthBaseText(month).replace(/\//g, '-') : '',
            })
            cacheKeys.push(cachedKey)

            month = nextMonth(month)
        }
        const promises = cacheKeys.map(async (cachedKey): Promise<CustomResponse<undefined>> => {
            try {
                const constructionSiteListCacheData = await getCachedData<CachedMonthlySiteType>(cachedKey)
                const newConstruction: ConstructionType = {
                    constructionId: constructionId,
                    contractId: contractId,
                    name: name ?? INITIAL_CONSTRUCTION_NAME,
                    displayName: name ?? INITIAL_CONSTRUCTION_NAME,
                    siteMeetingTime: DEFAULT_SITE_MEETING_TIME.totalSeconds,
                    siteStartTime: DEFAULT_SITE_START_TIME.totalSeconds,
                    siteEndTime: DEFAULT_SITE_END_TIME.totalSeconds,
                    siteAddress: siteAddress,
                    constructionRelation: 'manager',
                    project: {
                        startDate: getDailyStartTime(startDate).totalSeconds,
                        endDate: getDailyStartTime(endDate).totalSeconds,
                    },
                    contract: {
                        contractId: contractId,
                        projectId: projectId,
                        orderCompany: orderCompany as CompanyType,
                        receiveCompany: receiveCompany as CompanyType,
                        orderCompanyId: orderCompany?.companyId,
                        receiveCompanyId: receiveCompany?.companyId,
                    },
                    updatedAt: Number(new Date()),
                }
                await updateCachedData({
                    key: cachedKey,
                    value: {
                        monthlySite: constructionSiteListCacheData.success?.monthlySite,
                        construction: newConstruction,
                    },
                })
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

    const _writeProject = async () => {
        try {
            setState((prev) => ({ ...prev, similarProjects: [] }))
            if (id == undefined) {
                throw {
                    error: t('common:NoId'),
                }
            }
            dispatch(setLoading('unTouchable'))
            if (mode != 'new') {
                const lockResult = await checkLockOfTarget({
                    myWorkerId: signInUser?.workerId ?? 'no-id',
                    targetId: id ?? 'no-id',
                    modelType: 'project',
                })
                if (lockResult.error) {
                    if (isFocused) dispatch(setLoading(false))
                    throw {
                        error: lockResult.error,
                    }
                }
            }
            const _contractId = contractId ?? getUuidv4()
            const constructionId = getUuidv4()
            const newReceiveDepartmentIds = selectedReceiveCompanyDepartments?.map((obj) => obj?.value).filter((data) => data != undefined) as string[]

            // 取引一覧キャッシュ更新
            await _updateReceiveListCache(_contractId, constructionId)
            // 案件の工事一覧キャッシュ更新
            await _updateContractingProjectConstructionListCache(_contractId, constructionId)
            // 請負契約詳細のキャッシュ更新
            await _updateContractingProjectDetailCache(_contractId, id)
            // 工事の現場一覧キャッシュ更新
            await _updateConstructionSiteListCache(id, _contractId, constructionId)
            // 工事詳細のキャッシュ更新
            await _updateConstructionDetailCache(id, _contractId, constructionId)

            const result = await writeMyProject({
                projectId: id,
                name,
                myCompanyId,
                startDate,
                myWorkerId: signInUser?.workerId,
                endDate,
                orderCompanyId: orderCompany?.companyId,
                receiveCompanyId: receiveCompany?.companyId,
                constructionName: name ?? INITIAL_CONSTRUCTION_NAME,
                imageUrl,
                sImageUrl,
                xsImageUrl,
                image,
                imageColorHue,
                contractId: _contractId,
                constructionId,
                siteAddress,
                receiveDepartmentIds: newReceiveDepartmentIds,
                orderCompany,
            })
            if (isFocused) dispatch(setLoading(false))

            if (result.error) {
                if (result.errorCode === 'PLAN_LOCK') {
                    navigation.push('BillingInquiry', {
                        company: myCompany,
                        workerId: signInUser?.workerId,
                    })
                    // 'PLAN_LOCK'を表示しない
                    result.errorCode = undefined
                }

                throw {
                    error: result.error,
                    errorCode: result.errorCode,
                }
            }
            if (startDate && endDate) {
                const dateList = toCustomDatesListFromStartAndEnd(startDate, endDate)
                const dates = dateList.map((date) => date.totalSeconds)
                let newLocalUpdateScreens: UpdateScreenType[] = [
                    {
                        screenName: 'ContractingProjectDetail',
                        ids: [...flatten(localUpdateScreens.filter((screen) => screen.screenName == 'ContractingProjectDetail').map((screen) => screen.ids)), _contractId]?.filter(
                            (data) => data != undefined,
                        ) as string[],
                    },
                ]
                if (constructionIds !== undefined && constructionIds?.length > 0) {
                    newLocalUpdateScreens = [
                        ...newLocalUpdateScreens,
                        {
                            screenName: 'ConstructionDetail',
                            ids: [...flatten(localUpdateScreens.filter((screen) => screen.screenName == 'ConstructionDetail').map((screen) => screen.ids)), ...constructionIds]?.filter(
                                (data) => data != undefined,
                            ) as string[],
                        },
                    ]
                }
                if (fakeCompanyInvReservationId) {
                    newLocalUpdateScreens.push({
                        screenName: 'InvReservationDetail',
                        ids: [...flatten(localUpdateScreens.filter((screen) => screen.screenName == 'InvReservationDetail').map((screen) => screen.ids)), fakeCompanyInvReservationId]?.filter(
                            (data) => data != undefined,
                        ) as string[],
                    })
                }
                dispatch(setLocalUpdateScreens(uniqBy([...newLocalUpdateScreens, ...localUpdateScreens], 'screenName')))
            }
            dispatch(
                setToastMessage({
                    text: result.success == 'create' ? t('admin:NewCaseCreated') : t('admin:TheCaseHasBeenUpdated'),
                    type: 'success',
                } as ToastMessage),
            )
            if (result.success == 'create') {
                // 戻った時、完了時に詳細を確認できる様に。
                // navigation.replace('ContractingProjectDetailRouter', {
                //     title: name ?? 'id',
                //     projectId: id ?? 'no-id',
                //     contractId: _contractId,
                // })
                //
                // 入った所に戻る
                navigation.replace('ConstructionDetailRouter', {
                    title: name ?? 'title',
                    constructionId,
                    projectId: id ?? 'no-id',
                    startDate,
                    isNewProject: mode === 'new',
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

    useEffect(() => {
        if (isExceededPeriod) {
            dispatch(
                setToastMessage({
                    text: `${t('admin:CaseFromStartTo')}${MAX_PROJECT_SPAN}${t('admin:PleaseSetWithinOneDay')}`,
                    type: 'error',
                } as ToastMessage),
            )

            setState((prev) => ({ ...prev, isExceededPeriod: false }))
        }
    }, [isExceededPeriod])

    return (
        <KeyboardAwareScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps={'always'}>
            <Pressable
                style={{
                    alignSelf: 'center',
                    marginVertical: 20,
                    alignItems: 'center',
                }}
                onPress={async () => {
                    const _image = await pickImage()
                    if (_image == undefined) {
                        return
                    }
                    setState((prev) => ({ ...prev, image: _image }))
                }}>
                <ImageIcon
                    type={'project'}
                    size={100}
                    imageUri={image?.uri ?? imageUrl}
                    imageColorHue={imageColorHue}
                    style={{
                        marginVertical: 10,
                    }}
                />
                <Text
                    style={{
                        color: THEME_COLORS.OTHERS.LINK_BLUE,
                        lineHeight: 14,
                        fontFamily: FontStyle.medium,
                        fontSize: 12,
                    }}>
                    {t('admin:ChangePhoto')}
                </Text>
            </Pressable>
            <InputTextBox
                style={{ marginTop: 30 }}
                validation={'none'}
                required={true}
                title={t('common:CaseName')}
                placeholder={PLACEHOLDER.PROJECT_NAME}
                value={name}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, name: value }))
                }}
                infoText={t('admin:ThePrimeContractorForTheProjectWillBeCompanyItself')}
            />
            {mode == 'new' && (
                <>
                    <InputCompanyBox
                        style={{ marginTop: 30 - dMarginTop }}
                        required={true}
                        title={t('admin:ClientCompany')}
                        selectedCompany={orderCompany}
                        withoutMyCompany
                        isCompanyAlreadyExists={!!company}
                        infoText={t('admin:ConfirmDetailsOfTheProjectAndConstructionWork')}
                        onValueChangeValid={(value: CompanyCLType | undefined) => {
                            setState((prev) => ({ ...prev, orderCompany: value }))
                            setSelectedCompany(value)
                        }}
                    />
                    {!isDefaultDepartment && (
                        <InputObjectDropdownBox
                            title={t('common:ReceivedDepartments')}
                            required={true}
                            placeholder={PLACEHOLDER.DEPARTMENT}
                            selectableItems={receiveCompanyDepartments ?? []}
                            selectNum={'any'}
                            value={selectedReceiveCompanyDepartments}
                            style={{
                                marginTop: 30 - dMarginTop,
                            }}
                            onValueChangeValid={(value) => {
                                setState((prev) => ({ ...prev, selectedReceiveCompanyDepartments: value }))
                            }}
                        />
                    )}
                </>
            )}

            <InputDateTimeBox
                style={{ marginTop: 30 - dMarginTop }}
                required={true}
                title={t('admin:CaseStart')}
                value={startDate}
                initDateInput={startDate}
                dateInputMode="date"
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, startDate: value }))
                }}
                disable={fakeCompanyInvReservationId ? true : false}
            />
            <InputDateTimeBox
                style={{ marginTop: 30 - dMarginTop }}
                required={true}
                title={t('admin:CaseEnded')}
                minDateTime={startDate}
                value={endDate}
                initDateInput={endDate}
                maxDateTime={startDate ? nextDay(startDate, MAX_PROJECT_SPAN) : undefined}
                dateInputMode="date"
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, endDate: value }))
                }}
                setIsExceededPeriod={(value) => {
                    setState((prev) => ({ ...prev, isExceededPeriod: value }))
                }}
                disable={fakeCompanyInvReservationId ? true : false}
            />
            <InputTextBox
                style={{ marginTop: 30 - dMarginTop }}
                required={false}
                title={t('common:ProjectAddress')}
                placeholder={PLACEHOLDER.ADDRESS}
                value={siteAddress}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, siteAddress: value }))
                }}
                onClear={() => {
                    setState((prev) => ({ ...prev, siteAddress: undefined }))
                }}
            />
            <AppButton
                style={{ marginTop: 30, marginHorizontal: 20 }}
                title={mode == 'edit' ? t('common:Save') : t('common:Create')}
                disabled={disable}
                onPress={() => {
                    if (mode == 'new') {
                        checkExistProject()
                    } else {
                        _writeProject()
                    }
                }}
            />
            <BaseModal isVisible={similarProjects?.length ? similarProjects.length > 0 : false} onPress={() => _writeProject()} buttonTitle={t('common:Making')} onClose={_closeModal}>
                <Text
                    style={[
                        {
                            fontFamily: FontStyle.regular,
                            paddingLeft: 18,
                            fontSize: 12,
                            lineHeight: 20,
                            textAlign: 'center',
                            color: THEME_COLORS.BLUE.MIDDLE_DEEP,
                        },
                    ]}>
                    {t('admin:WeHaveASimilarCase')}
                    {'\n\n'}
                    {similarProjects?.map((projectName) => projectName + '\n')}
                    {'\n'}
                    {t('admin:WantToContinueCreating')}
                </Text>
            </BaseModal>
            <BottomMargin />
        </KeyboardAwareScrollView>
    )
}
export default EditProject

const styles = StyleSheet.create({})
