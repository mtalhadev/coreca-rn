/* eslint-disable indent */
import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, StyleSheet, AppState, Alert, View } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { weekDayList } from '../../../../utils/ext/Date.extensions'
import {
    combineTimeAndDay,
    CustomDate,
    getDailyStartTime,
    getMonthlyFirstDay,
    isHoliday,
    monthBaseText,
    newCustomDate,
    nextDay,
    nextMonth,
    toCustomDateFromTotalSeconds,
} from '../../../../models/_others/CustomDate'
import { InputTextBox } from '../../../../components/organisms/inputBox/InputTextBox'
import { AppButton } from '../../../../components/atoms/AppButton'
import { BottomMargin } from '../../../../components/atoms/BottomMargin'
import { getRandomImageColorHue, getUuidv4, SwitchEditOrCreateProps, useComponentSize } from '../../../../utils/Utils'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { Line } from '../../../../components/atoms/Line'
import {
    DEFAULT_SITE_END_TIME,
    DEFAULT_SITE_MEETING_TIME,
    DEFAULT_SITE_START_TIME,
    INITIAL_CONSTRUCTION_NAME,
    LOCK_INTERVAL_TIME,
    MAX_PROJECT_SPAN,
    PLACEHOLDER,
    THEME_COLORS,
    dMarginTop,
} from '../../../../utils/Constants'
import { BlueColor, FontStyle, GlobalStyles } from '../../../../utils/Styles'
import { InputDropDownBox } from '../../../../components/organisms/inputBox/InputDropdownBox'
import { setLoading, setLocalUpdateScreens, setToastMessage, ToastMessage } from '../../../../stores/UtilSlice'
import {
    getMyConstructionDetail,
    getMyTotalConstruction,
    getProjectFromContractId,
    writeMyConstruction,
    writeNewConstructionToCache,
    ConstructionListCacheReturnType,
    restoreConstructionsCache,
} from '../../../../usecases/construction/MyConstructionCase'
import { writeMyConstructionInstruction } from '../../../../usecases/construction/MyConstructionInstructionCase'
import flatten from 'lodash/flatten'
import isEmpty from 'lodash/isEmpty'
import uniqBy from 'lodash/uniqBy'
import { StoreType } from '../../../../stores/Store'
import { InputDateDropdownBox } from '../../../../components/organisms/inputBox/InputDateDropdownBox'
import { InputDateTimeBox } from '../../../../components/organisms/inputBox/InputDateTimeBox'
import { InputNumberBox } from '../../../../components/organisms/inputBox/InputNumberBox'
import { calculateConstructionDays, getDateRange } from '../../../../usecases/construction/CommonConstructionCase'
import { ProjectCLType, ProjectType, toProjectCLType } from '../../../../models/project/Project'
import { ConstructionCLType, ConstructionType, toConstructionCLType } from '../../../../models/construction/Construction'
import { useIsFocused } from '@react-navigation/native'
import { checkLockOfTarget, updateLockOfTarget } from '../../../../usecases/lock/CommonLockCase'
import { getErrorMessage, getErrorToastMessage } from '../../../../services/_others/ErrorService'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'
import { useTextTranslation } from './../../../../fooks/useTextTranslation'
import { useSafeLoadingUnmount } from '../../../../fooks/useUnmount'
import { addUpdateScreens, toCustomDatesListFromStartAndEnd, toIdAndMonthFromStrings, UpdateScreenType } from '../../../../models/updateScreens/UpdateScreens'
import cloneDeep from 'lodash/cloneDeep'
import { _getFirestore } from '../../../../services/firebase/FirestoreService'
import { Checkbox } from '../../../../components/atoms/Checkbox'
import { InputProjectBox } from '../../../../components/organisms/inputBox/InputProjectBox'
import { InputCompanyBox } from '../../../../components/organisms/inputBox/InputCompanyBox'
import { CompanyCLType } from '../../../../models/company/Company'
import { setSelectedProject } from '../../../../stores/CreateProjectSlice'
import { writeConstructionSite } from '../../../../usecases/site/MySiteCase'
import { writeConstructionSiteInstruction } from '../../../../usecases/site/MySiteInstructionCase'
import { writeFakeCompany } from '../../../../usecases/company/FakeCompanyCase'
import { getMyCompanyProjects, writeMyProject } from '../../../../usecases/project/MyProjectCase'
import { BaseModal } from '../../../../components/organisms/BaseModal'
import { genKeyName, getCachedData, updateCachedData } from '../../../../usecases/CachedDataCase'
import { setIsCacheReady } from '../../../../stores/CacheSlice'
import { checkMyDepartment } from '../../../../usecases/department/DepartmentCase'
import { departmentsToText } from '../../../../usecases/worker/CommonWorkerCase'
import { getContract } from '../../../../usecases/contract/CommonContractCase'
import { SiteType } from '../../../../models/site/Site'
import { DateDataType } from '../../../../models/date/DateDataType'
import { MyConstructionDetailUIType } from '../constructionDetail/ConstructionDetail'
import { InvReservationType } from '../../../../models/invReservation/InvReservation'
import { InputObject, InputObjectDropdownBox } from '../../../../components/organisms/inputBox/InputObjectDropdownBox'
import { DepartmentManageType } from '../../../../models/department/DepartmentManageType'
import { PartnerCompanyListType } from '../../../../models/company/PartnerCompanyListType'
import SearchCompanyBox from '../../company/SearchCompanyBox'
import { CachedReceiveListType } from '../../transaction/ReceiveList'
type NavProps = StackNavigationProp<RootStackParamList, 'EditConstruction'>
type RouteProps = RouteProp<RootStackParamList, 'EditConstruction'>

type InitialStateType = {
    id?: string
    contractId?: string
    update: number
    disable: boolean
    constructionDays: number
    dateRange: CustomDate[]
    contractingProject?: ProjectCLType
    isInstruction?: boolean
    instructionId?: string
    startDate?: CustomDate
    endDate?: CustomDate
    companies?: CompanyCLType[]
    orderCompany?: CompanyCLType
    constructionIds?: string[]
    similarProjects?: string[]
    newProjectName?: string
    newClientCompanyName?: string
    inputCompanyName?: string
    isCreateNewClientWithInputCompanyName?: boolean
    siteDate?: CustomDate
    siteMeetingTime?: CustomDate
    siteStartTime?: CustomDate
    siteEndTime?: CustomDate
    siteStartTimeIsNextDay?: boolean
    siteEndTimeIsNextDay?: boolean
    siteDefaultMeetingTime?: CustomDate
    siteDefaultStartTime?: CustomDate
    siteDefaultEndTime?: CustomDate
    siteDefaultStartTimeIsNextDay?: boolean
    siteDefaultEndTimeIsNextDay?: boolean
    isSelectExistingProject?: boolean
    isSelectExistingClientCompany?: boolean
    isConstructionNameEdited?: boolean
    isExceededPeriod?: boolean
    isFirstFetch?: boolean
    keepConstruction?: ConstructionCLType
    receiveCompanyDepartments?: InputObject[]
    selectedReceiveCompanyDepartments?: InputObject[]
} & ConstructionCLType

const initialState: InitialStateType = {
    update: 0,
    constructionDays: 0,
    disable: true,
    dateRange: [],
    instructionId: undefined,
    isInstruction: false,
    similarProjects: [],
    isSelectExistingProject: false,
    isSelectExistingClientCompany: false,
    isConstructionNameEdited: false,
    isExceededPeriod: false,
    isFirstFetch: true,
}

type ExtendedDateDataType = {
    monthlyData: DateDataType[]
    projects: ProjectType[]
}

const EditConstruction = (props: Partial<SwitchEditOrCreateProps>) => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const mode = props.mode ?? 'edit'
    const signInUser = useSelector((state: StoreType) => state.account.signInUser)
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const accountId = useSelector((state: StoreType) => state.account.signInUser?.accountId ?? '')
    const [appState, setAppState] = useState(AppState.currentState)
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const localUpdateScreens = useSelector((state: StoreType) => state?.util?.localUpdateScreens)
    const selectedProject = useSelector((state: StoreType) => state?.createProject?.selectedProject)

    const routeNameFrom = route.params?.routeNameFrom
    const isCreateProjectAndConstruction =
        routeNameFrom == 'AdminHome' || routeNameFrom == 'ConstructionList' || routeNameFrom == 'ReceiveList' || routeNameFrom == 'OrderList' || routeNameFrom == 'ContractingProjectConstructionList'
    const isCreateOnlyConstruction = routeNameFrom == 'ContractingProjectConstructionList'

    const targetDate = route.params?.selectedDate
    const holidays = useSelector((state: StoreType) => state?.util?.holidays)

    const inputFocused = useRef<boolean>(false)
    const unsubscribeConstructionRef = useRef<any>(null)
    const unsubscribeCompanyRef = useRef<any>(null)
    const isScreenOnRef = useRef<boolean>(false)

    const activeDepartments = useSelector((state: StoreType) => state?.account?.activeDepartments)
    const activeDepartmentIds = useMemo(() => activeDepartments?.map((dep) => dep?.departmentId).filter((data) => data != undefined) as string[], [activeDepartments])
    const isDefaultDepartment = useMemo(() => activeDepartments?.map((dep) => dep?.isDefault)[0], [activeDepartments])

    const [
        {
            id,
            name,
            update,
            disable,
            offDaysOfWeek,
            otherOffDays,
            requiredWorkerNum,
            siteAddress,
            remarks,
            siteBelongings,
            siteRemarks,
            siteRequiredNum,
            constructionDays,
            dateRange,
            contractingProject,
            contractId,
            startDate,
            endDate,
            fakeCompanyInvReservationId,
            constructionIds,
            similarProjects,
            companies,
            orderCompany,
            newProjectName,
            newClientCompanyName,
            inputCompanyName,
            isCreateNewClientWithInputCompanyName,
            siteDate,
            siteMeetingTime,
            siteStartTime,
            siteStartTimeIsNextDay,
            siteEndTime,
            siteEndTimeIsNextDay,
            siteDefaultMeetingTime,
            siteDefaultStartTime,
            siteDefaultStartTimeIsNextDay,
            siteDefaultEndTime,
            siteDefaultEndTimeIsNextDay,
            isSelectExistingProject,
            isSelectExistingClientCompany,
            isConstructionNameEdited,
            isExceededPeriod,
            contract,
            isFirstFetch,
            keepConstruction,
            receiveCompanyDepartments,
            selectedReceiveCompanyDepartments,
        },
        setState,
    ] = useState(initialState)
    const dispatch = useDispatch()

    const [size, onLayout] = useComponentSize()

    useEffect(() => {
        if (isCreateProjectAndConstruction && !isCreateOnlyConstruction) {
            navigation.setOptions({
                title: t('admin:CreateProjectAndConstruction'),
            })
        } else if (route.params?.isInstruction) {
            navigation.setOptions({
                title: t('admin:RequestEditingConstructionInfo'),
            })
        } else {
            navigation.setOptions({
                title: mode == 'new' ? t('admin:CreateConstruction') : t('admin:EditConstruction'),
            })
        }
    }, [navigation])

    useEffect(() => {
        isScreenOnRef.current = isFocused
    }, [isFocused])

    useEffect(() => {
        return () => setState(initialState)
    }, [myCompanyId])

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            setState((prev) => ({ ...prev, update: update + 1 }))
        }
    }, [isNavUpdating])

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        ;(async () => {
            try {
                if (id == undefined || contractId == undefined || isFocused != true || (isCreateProjectAndConstruction && !isCreateOnlyConstruction)) {
                    return
                }
                dispatch(setLoading(true))

                const projectResult = await getProjectFromContractId({
                    contractId,
                })
                if (projectResult.error) {
                    throw {
                        error: projectResult.error,
                    }
                }
                let _project = projectResult.success
                const cachedConstructionKey = genKeyName({ screenName: 'ConstructionDetail', accountId: accountId, constructionId: id ?? '', companyId: myCompanyId ?? '' })
                const cachedResult = await getCachedData<MyConstructionDetailUIType>(cachedConstructionKey)
                if (cachedResult.success) {
                    if (
                        projectResult.success?.projectId == undefined ||
                        (cachedResult.success.updatedAt && projectResult.success.updatedAt && cachedResult.success.updatedAt > projectResult.success?.updatedAt.totalSeconds)
                    ) {
                        // キャッシュよりDBが古い場合、更新しない
                        _project = { ...toProjectCLType(cachedResult.success.project) }
                    }
                }

                let construction: ConstructionCLType | undefined = undefined
                let _orderCompany: CompanyCLType | undefined = undefined
                if (mode == 'edit') {
                    const constructionResult = await getMyTotalConstruction({
                        id,
                    })
                    if (constructionResult.error) {
                        throw {
                            error: constructionResult.error,
                            errorCode: constructionResult.errorCode,
                        }
                    }
                    if (cachedResult.success) {
                        if (
                            constructionResult.success?.constructionId == undefined ||
                            (cachedResult.success.updatedAt && constructionResult.success.updatedAt && cachedResult.success.updatedAt > constructionResult.success?.updatedAt.totalSeconds)
                        ) {
                            // キャッシュよりDBが古い場合、更新しない
                            construction = { ...toConstructionCLType(cachedResult.success) }
                        } else {
                            construction = { ...constructionResult.success }
                        }
                    }
                } else {
                    //新規の場合、自部署の契約かどうか確認するために、契約を取得する。
                    // orderCompany: 工事作成画面の表示用
                    const _contractResult = await getContract({ contractId, options: { orderDepartments: true, receiveDepartments: true, orderCompany: true } })
                    if (_contractResult.error) {
                        throw {
                            error: _contractResult.error,
                            errorCode: _contractResult.errorCode,
                        }
                    }
                    construction = {
                        contract: _contractResult.success,
                    }
                    _orderCompany = _contractResult.success?.orderCompany
                }

                setState((prev) => ({
                    ...prev,
                    siteAddress: _project?.siteAddress as string,
                    contractingProject: _project,
                    ...construction,
                    keepConstruction: cloneDeep(construction),
                    startDate: _project?.startDate,
                    endDate: _project?.endDate,
                    orderCompany: _orderCompany,
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
                    dispatch(setLoading(false))
                    dispatch(setIsNavUpdating(false))
                }
            }
        })()
    }, [id, update, contractId])

    useEffect(() => {
        if (
            isEmpty(name) ||
            startDate == undefined ||
            endDate == undefined ||
            (isEmpty(newClientCompanyName) && isEmpty(orderCompany)) ||
            (selectedReceiveCompanyDepartments?.length == 0 && isCreateProjectAndConstruction && isSelectExistingProject)
        ) {
            setState((prev) => ({ ...prev, disable: true }))
            return
        }
        setState((prev) => ({ ...prev, disable: false }))
    }, [name, startDate, endDate, selectedReceiveCompanyDepartments, newClientCompanyName, orderCompany])

    useEffect(() => {
        if (inputCompanyName !== newClientCompanyName) {
            setState((prev) => ({ ...prev, newClientCompanyName: undefined, isCreateNewClientWithInputCompanyName: false }))
        }
    }, [inputCompanyName])

    useEffect(() => {
        if (route.params?.contractId == undefined && !isCreateProjectAndConstruction) {
            dispatch(
                setToastMessage({
                    text: t('admin:ContractIdNotExist'),
                    type: 'error',
                } as ToastMessage),
            )
        }
        if (mode === 'edit') {
            setState((prev) => ({
                ...prev,
                id: route.params?.constructionId,
                contractId: route.params?.contractId,
                isInstruction: route.params?.isInstruction,
                instructionId: route.params?.instructionId,
            }))
        } else {
            if (isCreateProjectAndConstruction) {
                setState((prev) => ({ ...prev, id: getUuidv4(), contractId: isCreateOnlyConstruction ? route.params?.contractId : undefined }))
            } else {
                setState((prev) => ({ ...prev, id: getUuidv4(), contractId: route.params?.contractId }))
            }
        }
        return () => {
            setState({ ...initialState })
        }
    }, [route])

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
            unsubscribeConstructionRef.current = db
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
    }, [myCompanyId, contractId, isFocused])

    useEffect(() => {
        ;(async () => {
            try {
                if (!isScreenOnRef.current) return

                const __cachedKey = genKeyName({
                    screenName: 'SelectCompany',
                    accountId: accountId,
                    companyId: myCompanyId as string,
                })

                const db = _getFirestore()
                unsubscribeCompanyRef.current = db
                    .collection('PartnerCompanyList')
                    .where('companyId', '==', myCompanyId)
                    .onSnapshot(async (data) => {
                        const _partnerCompanyList = data.docs.map((doc) => doc.data())[0] as PartnerCompanyListType | undefined
                        const displayCompanies = filterCompanies(_partnerCompanyList?.companies ?? [])
                        setState((prev) => ({ ...prev, companies: displayCompanies }))
                        dispatch(setLoading(false))
                        dispatch(setIsNavUpdating(false))

                        const cachedResult = await updateCachedData({ key: __cachedKey, value: _partnerCompanyList?.companies ?? [] })
                        if (cachedResult.error) {
                            const _error = cachedResult as CustomResponse
                            dispatch(
                                setToastMessage({
                                    text: getErrorToastMessage(_error),
                                    type: 'error',
                                }),
                            )
                        }
                    })
                const result = await getCachedData<CompanyCLType[]>(__cachedKey)
                if (result.success) {
                    const displayCompanies = filterCompanies(result.success ?? [])
                    setState((prev) => ({ ...prev, companies: displayCompanies }))
                    dispatch(setLoading(false))
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
    }, [myCompanyId, isFocused])

    const filterCompanies = (_companies: CompanyCLType[]) => {
        return _companies.filter((company) => company?.companyId != myCompanyId) ?? []
    }

    // 画面を閉じたときに時にonSnapshotをunsubscribeする
    useEffect(() => {
        return () => {
            if (isScreenOnRef.current) {
                isScreenOnRef.current = false
                if (unsubscribeConstructionRef.current) {
                    unsubscribeConstructionRef.current()
                    unsubscribeConstructionRef.current = null
                }
                if (unsubscribeCompanyRef.current) {
                    unsubscribeCompanyRef.current()
                    unsubscribeCompanyRef.current = null
                }
            }
        }
    }, [isFocused])

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

    useEffect(() => {
        if (isCreateProjectAndConstruction) {
            if (isSelectExistingProject) {
                if (contractingProject !== undefined) {
                    setState((prev) => ({
                        ...prev,
                        startDate: toCustomDateFromTotalSeconds((contractingProject as ProjectType)?.startDate as number),
                        endDate: toCustomDateFromTotalSeconds((contractingProject as ProjectType)?.endDate as number),
                        name: undefined,
                        orderCompany:
                            contractingProject?.companyContracts?.totalContracts?.items !== undefined ? contractingProject?.companyContracts?.totalContracts?.items[0].orderCompany : undefined,
                        contractId: contractingProject?.companyContracts?.totalContracts?.items !== undefined ? contractingProject?.companyContracts?.totalContracts?.items[0].contractId : undefined,
                    }))
                }
                // } else {
            } else if (!isCreateOnlyConstruction) {
                setState((prev) => ({
                    ...prev,
                    contractingProject: undefined,
                    startDate: targetDate ?? newCustomDate(),
                    endDate: nextMonth(targetDate ?? newCustomDate()),
                    orderCompany: undefined,
                    contractId: undefined,
                }))
                dispatch(setSelectedProject(undefined))
            }
        }
    }, [isSelectExistingProject, contractingProject])

    useEffect(() => {
        if (route.params?.siteDate !== undefined) {
            setState((prev) => ({ ...prev, siteDate: route.params?.siteDate }))
        } else if (targetDate !== undefined) {
            setState((prev) => ({ ...prev, siteDate: targetDate }))
        }
    }, [targetDate])

    useEffect(() => {
        if (isCreateProjectAndConstruction) {
            setState((prev) => ({
                ...prev,
                siteMeetingTime: DEFAULT_SITE_MEETING_TIME,
                siteStartTime: DEFAULT_SITE_START_TIME,
                siteEndTime: DEFAULT_SITE_END_TIME,
            }))
        }
    }, [])

    useEffect(() => {
        setState((prev) => ({ ...prev, siteDefaultMeetingTime: siteMeetingTime ?? (mode == 'new' ? DEFAULT_SITE_MEETING_TIME : undefined) }))
    }, [siteMeetingTime])

    useEffect(() => {
        setState((prev) => ({ ...prev, siteDefaultStartTime: siteStartTime ?? (mode == 'new' ? DEFAULT_SITE_START_TIME : undefined), siteDefaultStartTimeIsNextDay: siteStartTimeIsNextDay }))
    }, [siteStartTime, siteStartTimeIsNextDay])

    useEffect(() => {
        setState((prev) => ({ ...prev, siteDefaultEndTime: siteEndTime ?? (mode == 'new' ? DEFAULT_SITE_END_TIME : undefined), siteDefaultEndTimeIsNextDay: siteEndTimeIsNextDay }))
    }, [siteEndTime, siteEndTimeIsNextDay])

    useEffect(() => {
        if (isSelectExistingProject !== undefined) {
            setState((prev) => ({
                ...prev,
                contractingProject: selectedProject as ProjectCLType,
            }))
        }
    }, [selectedProject])

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

    const _closeModal = () => {
        setState((prev) => ({ ...prev, similarProjects: [] }))
    }

    /**
     * 現場と工事を作成する。
     * 案件や、その顧客も作成する場合もある。
     * 日付から遷移してきた場合に使われる。
     */
    const _createProjectAndConstruction = async (params: { isExistingProject: boolean }) => {
        try {
            const { isExistingProject } = params
            if (contract?.status == 'created') {
                throw {
                    error: t('admin:ContractHasNotBeenApproved'),
                    errorCode: 'CREATE_CONSTRUCTION_AND_SITE_ERROR',
                }
            }
            const topContract = contractingProject?.companyContracts?.totalContracts?.items?.filter((contract) => contract.receiveCompanyId == myCompanyId)[0]
            if (
                topContract?.receiveCompanyId == myCompanyId &&
                !checkMyDepartment({
                    targetDepartmentIds: topContract?.receiveDepartmentIds,
                    activeDepartmentIds,
                })
            ) {
                throw {
                    error: t('admin:TheContractIsInAnotherDepartmentPleaseSwitchDepartments') + '\n' + t('common:Department') + ': ' + departmentsToText(topContract?.receiveDepartments?.items),
                    errorCode: 'CREATE_CONSTRUCTION_AND_SITE_ERROR',
                }
            }
            if (startDate === undefined || endDate === undefined) {
                throw {
                    error: '工期の開始日、または終了日が設定されていません。',
                }
            }
            if (getDailyStartTime(startDate).totalSeconds > getDailyStartTime(endDate).totalSeconds) {
                throw {
                    error: '工期の開始日は終了日より以前にしてください。',
                }
            }

            if (siteDate === undefined) {
                throw {
                    error: '現場の日付がありません',
                }
            }

            if (getDailyStartTime(siteDate)?.totalSeconds < getDailyStartTime(startDate).totalSeconds || getDailyStartTime(siteDate)?.totalSeconds > getDailyStartTime(endDate)?.totalSeconds) {
                throw {
                    error: '現場の日付は工期内にしてください。',
                }
            }
            if (offDaysOfWeek?.includes(siteDate.dayOfWeekText)) {
                throw {
                    error: '現場の日付は工事の定休日以外にしてください。',
                }
            }
            if (otherOffDays?.includes(siteDate)) {
                throw {
                    error: '現場の日付は工事のその他の休日以外にしてください。',
                }
            }

            dispatch(setLoading('unTouchable'))
            if (isExistingProject) {
                //案件はあるので工事作成から
                const constructionResult = await _writeConstruction()
                if (constructionResult.error) {
                    throw {
                        error: constructionResult.error,
                        errorCode: constructionResult.errorCode,
                    }
                }
            } else {
                //案件作成から
                let newClientCompanyId
                if (!isSelectExistingClientCompany) {
                    //新規顧客（仮）会社作成
                    newClientCompanyId = getUuidv4()
                    const fakeCompanyResult = await _writeFakeCompany(newClientCompanyId)
                    if (fakeCompanyResult.error) {
                        throw {
                            error: fakeCompanyResult.error,
                            errorCode: fakeCompanyResult.errorCode,
                        }
                    }
                }

                const projectResult = await _writeProject(id, isSelectExistingClientCompany ? orderCompany?.companyId : newClientCompanyId)
                if (projectResult.error) {
                    throw {
                        error: projectResult.error,
                        errorCode: projectResult.errorCode,
                    }
                }
            }
            const suiteResult = await _writeSite(id, siteDate)
            if (suiteResult.error) {
                throw {
                    error: suiteResult.error,
                    errorCode: suiteResult.errorCode,
                }
            }
            navigation.goBack()
            if (selectedProject !== undefined) {
                dispatch(setSelectedProject(undefined))
            }

            dispatch(
                setToastMessage({
                    text:
                        isSelectExistingProject || isCreateOnlyConstruction
                            ? t('admin:NewConstructionAndSiteCreated')
                            : isSelectExistingClientCompany
                            ? t('admin:NewCaseAndConstructionAndSiteCreated')
                            : t('admin:NewClientAndCaseAndConstructionAndSiteCreated'),
                    type: 'success',
                } as ToastMessage),
            )

            // navigation.goBack()
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
     * 工事の作成・編集のみを行う関数の呼び出しとバリデーション。
     * 案件の工事一覧から工事を新規作成した場合にはこれが単体で使われる。
     */
    const __writeConstruction = async () => {
        try {
            if (id == undefined || contractId == undefined) {
                throw { error: t('common:NoId') }
            }
            if (contract?.status == 'created') {
                throw {
                    error: t('admin:ContractHasNotBeenApproved'),
                    errorCode: 'WRITE_CONSTRUCTION_ERROR',
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
                    errorCode: 'WRITE_CONSTRUCTION_ERROR',
                }
            }

            dispatch(setLoading('unTouchable'))

            const lockResult = await checkLockOfTarget({
                myWorkerId: signInUser?.workerId ?? 'no-id',
                targetId: id ?? 'no-id',
                modelType: 'construction',
            })
            if (lockResult.error) {
                throw {
                    error: lockResult.error,
                    errorCode: lockResult.errorCode,
                }
            }

            const constructionResult = await _writeConstruction()
            if (constructionResult.error) {
                throw {
                    error: constructionResult.error,
                    errorCode: constructionResult.errorCode,
                }
            }

            dispatch(
                setToastMessage({
                    text: constructionResult.success == 'create' ? t('admin:NewConstructionCreated') : t('admin:ConstructionUpdated'),
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
        } finally {
            if (isFocused) {
                dispatch(setLoading(false))
            }
        }
    }

    /**
     *
     * 工事の作成・編集を行う
     */
    const _writeConstruction = async (): Promise<CustomResponse<undefined>> => {
        try {
            if (contract?.status == 'created') {
                throw {
                    error: t('admin:ContractHasNotBeenApproved'),
                    errorCode: 'WRITE_CONSTRUCTION_ERROR',
                }
            }
            if (contract?.orderCompanyId == myCompanyId && !checkMyDepartment({ targetDepartmentIds: contract?.orderDepartmentIds, activeDepartmentIds })) {
                throw {
                    error: t('admin:TheContractIsInAnotherDepartmentPleaseSwitchDepartments') + '\n' + t('common:Department') + ': ' + departmentsToText(contract?.orderDepartments?.items),
                    errorCode: 'WRITE_CONSTRUCTION_ERROR',
                }
            }
            if (route.params?.isInstruction) {
                const result = await writeMyConstructionInstruction({
                    constructionId: id,
                    myCompanyId,
                    updateWorkerId: signInUser?.workerId,
                    contractId: contractId,
                    construction: {
                        siteAddress: keepConstruction?.siteAddress == undefined ? siteAddress : siteAddress ?? '',
                        siteBelongings: keepConstruction?.siteBelongings == undefined ? siteBelongings : siteBelongings ?? '',
                        siteEndTime: siteDefaultEndTime,
                        siteEndTimeIsNextDay: siteDefaultEndTimeIsNextDay,
                        siteMeetingTime: siteDefaultMeetingTime,
                        siteRemarks: keepConstruction?.siteRemarks == undefined ? siteRemarks : siteRemarks ?? '',
                        siteRequiredNum: keepConstruction?.siteRequiredNum == undefined ? siteRequiredNum : siteRequiredNum,
                        siteStartTime: siteDefaultStartTime,
                        siteStartTimeIsNextDay: siteDefaultStartTimeIsNextDay,
                        remarks: keepConstruction?.remarks == undefined ? remarks : remarks ?? '',
                        offDaysOfWeek: keepConstruction?.offDaysOfWeek == undefined ? offDaysOfWeek : offDaysOfWeek ?? [],
                        otherOffDays: keepConstruction?.otherOffDays == undefined ? otherOffDays : otherOffDays ?? [],
                        name,
                        requiredWorkerNum: keepConstruction?.requiredWorkerNum == undefined ? requiredWorkerNum : requiredWorkerNum,
                    },
                    project: {
                        projectId: contractingProject?.projectId,
                        startDate: startDate && getDailyStartTime(startDate),
                        endDate: endDate && getDailyStartTime(endDate),
                        siteAddress: keepConstruction?.siteAddress == undefined ? siteAddress : siteAddress ?? '',
                    },
                })
                if (result.error) {
                    throw {
                        error: result.error,
                        errorCode: result.errorCode,
                    }
                }
            } else {
                const _project: ProjectType = {
                    projectId: contractingProject?.projectId,
                    startDate: startDate && getDailyStartTime(startDate).totalSeconds,
                    endDate: endDate && getDailyStartTime(endDate).totalSeconds,
                    name: contractingProject?.name,
                }
                const _construction: ConstructionType = {
                    constructionId: id,
                    siteAddress,
                    siteBelongings,
                    siteEndTime: siteDefaultEndTime?.totalSeconds,
                    siteEndTimeIsNextDay: siteDefaultEndTimeIsNextDay,
                    siteMeetingTime: siteDefaultMeetingTime?.totalSeconds,
                    siteRemarks,
                    siteRequiredNum,
                    siteStartTime: siteDefaultStartTime?.totalSeconds,
                    siteStartTimeIsNextDay: siteDefaultStartTimeIsNextDay,
                    remarks,
                    offDaysOfWeek,
                    otherOffDays: otherOffDays?.map((item) => item?.totalSeconds),
                    name,
                    requiredWorkerNum,
                    project: _project,
                }

                dispatch(setIsCacheReady(false))
                const newConstructionResult = await writeNewConstructionToCache({
                    construction: _construction,
                    project: _project,
                    myCompanyId,
                    accountId: signInUser?.accountId,
                    date: siteDate?.totalSeconds,
                    contractId: contractId,
                    dispatch,
                })

                let cacheBackUp: ConstructionListCacheReturnType[] | undefined
                if (newConstructionResult.error) {
                    console.log('error: ', '削除した工事をキャッシュへ反映するのに失敗しました')
                    // throw {
                    //     error: newConstructionResult.error,
                    //     errorCode: newConstructionResult.errorCode,
                    // }
                } else {
                    cacheBackUp = newConstructionResult.success
                }
                dispatch(setIsCacheReady(true))

                const result = await writeMyConstruction({
                    constructionId: id,
                    myCompanyId,
                    updateWorkerId: signInUser?.workerId,
                    contractId: contractId,
                    construction: {
                        siteAddress,
                        siteBelongings,
                        siteEndTime: siteDefaultEndTime,
                        siteEndTimeIsNextDay: siteDefaultEndTimeIsNextDay,
                        siteMeetingTime: siteDefaultMeetingTime,
                        siteRemarks,
                        siteRequiredNum,
                        siteStartTime: siteDefaultStartTime,
                        siteStartTimeIsNextDay: siteDefaultStartTimeIsNextDay,
                        remarks,
                        offDaysOfWeek,
                        otherOffDays,
                        name,
                        requiredWorkerNum,
                    },
                    project: {
                        projectId: contractingProject?.projectId,
                        startDate: startDate && getDailyStartTime(startDate).totalSeconds,
                        endDate: endDate && getDailyStartTime(endDate).totalSeconds,
                        siteAddress,
                    },
                })

                if (result.error) {
                    if (cacheBackUp !== undefined) {
                        dispatch(setIsCacheReady(false))
                        const restoreConstructionsCacheResult = await restoreConstructionsCache({
                            cacheData: cacheBackUp,
                        })
                        dispatch(setIsCacheReady(true))
                        if (restoreConstructionsCacheResult.error) {
                            console.log('削除した工事のキャッシュデータ復元に失敗しました')
                            // throw {
                            //     error: restoreConstructionsCacheResult.error,
                            //     errorCode: restoreConstructionsCacheResult.errorCode,
                            // }
                        }
                    }

                    throw {
                        error: result.error,
                        errorCode: result.errorCode,
                    }
                } else {
                    if (startDate && endDate) {
                        if (constructionIds !== undefined && constructionIds?.length > 0) {
                            addUpdateScreens({
                                dispatch,
                                localUpdateScreens,
                                updateScreens: [
                                    {
                                        screenName: 'ConstructionDetail',
                                        ids: constructionIds,
                                    },
                                ],
                            })
                        } else {
                            addUpdateScreens({
                                dispatch,
                                localUpdateScreens,
                                updateScreens: [
                                    {
                                        screenName: 'ConstructionDetail',
                                        ids: [id].filter((data) => data != undefined) as string[],
                                    },
                                ],
                            })
                        }
                        const dateList = toCustomDatesListFromStartAndEnd(startDate, endDate)
                        const idAndDates = dateList?.map((month) => toIdAndMonthFromStrings(id, month)) ?? []
                        addUpdateScreens({
                            dispatch,
                            localUpdateScreens,
                            updateScreens: [
                                {
                                    screenName: 'ContractingProjectDetail',
                                    ids: [contractId].filter((data) => data != undefined) as string[],
                                },
                                {
                                    screenName: 'ConstructionSiteList',
                                    ids: idAndDates,
                                },
                            ],
                        })
                    }
                    if (fakeCompanyInvReservationId) {
                        addUpdateScreens({
                            dispatch,
                            localUpdateScreens,
                            updateScreens: [
                                {
                                    screenName: 'InvReservationDetail',
                                    ids: [fakeCompanyInvReservationId].filter((data) => data != undefined) as string[],
                                },
                            ],
                        })
                    }
                }
            }

            return Promise.resolve({
                success: undefined,
            })
        } catch (error) {
            return getErrorMessage(error)
        }
    }

    const _writeSite = async (constructionId?: string, date?: CustomDate): Promise<CustomResponse<undefined>> => {
        try {
            if (constructionId == undefined) {
                throw {
                    error: t('admin:NoConstructionInformationAvailable'),
                }
            }
            if (date == undefined) {
                throw {
                    error: t('admin:NoOnsiteDateAndTime'),
                }
            }

            const constructionResult = await getMyConstructionDetail({
                constructionId: id,
                myCompanyId,
                holidays,
            })
            if (constructionResult.error) {
                throw {
                    error: constructionResult.error,
                }
            }
            const construction = constructionResult.success
            if (construction?.constructionRelation == undefined) {
                throw {
                    error: t('admin:NoConstructionInformationAvailable'),
                }
            }

            const startTime = combineTimeAndDay(siteStartTime ?? DEFAULT_SITE_START_TIME, nextDay(date, siteStartTimeIsNextDay ? 1 : 0))
            const endTime = combineTimeAndDay(siteEndTime ?? DEFAULT_SITE_END_TIME, nextDay(date, siteEndTimeIsNextDay ? 1 : 0))
            const meetingTime = combineTimeAndDay(siteMeetingTime, date)
            const newSiteId = getUuidv4()

            // update AdminHome cache before creating the new site
            const adminHomeCacheKey = genKeyName({
                screenName: 'AdminHome',
                accountId: signInUser?.accountId as string,
                companyId: myCompanyId as string,
                month: date ? monthBaseText(getMonthlyFirstDay(date)).replace(/\//g, '-') : '',
            })
            const adminHomeCacheData = await getCachedData<ExtendedDateDataType>(adminHomeCacheKey)

            const newSite = {
                siteId: newSiteId,
                myCompanyId,
                constructionId,
                date,
                meetingTime,
                startTime,
                endTime,
                requiredNum: siteRequiredNum,
                remarks,
                address: siteAddress,
                belongings: siteBelongings,
                siteStartTimeIsNextDay,
                siteEndTimeIsNextDay,
                constructionRelation: construction.constructionRelation,
                projectId: contractingProject?.projectId,
                siteNameData: {
                    name: construction.displayName,
                },
                siteRelation: construction.constructionRelation,
                construction: construction as ConstructionType,
            } as SiteType
            const _siteDate = getDailyStartTime(date).totalSeconds as number
            adminHomeCacheData.success?.monthlyData.map((dateData) => {
                if (dateData.date == _siteDate && dateData.sites?.totalSites?.items) {
                    dateData.sites.totalSites.items = [...dateData?.sites?.totalSites?.items, cloneDeep(newSite)]
                }
                if (dateData.date == _siteDate && dateData?.arrangementSummary?.sitesCount) {
                    dateData.arrangementSummary.sitesCount = dateData?.arrangementSummary?.sitesCount + 1
                }
                if (dateData.date == _siteDate && dateData?.attendanceSummary?.sitesCount) {
                    dateData.attendanceSummary.sitesCount = dateData?.attendanceSummary?.sitesCount + 1
                }
            })

            const cachedResult = await updateCachedData({ key: adminHomeCacheKey, value: { monthlyData: adminHomeCacheData.success?.monthlyData ?? [] } })
            if (cachedResult.error) {
                throw {
                    error: cachedResult.error,
                    errorCode: cachedResult.errorCode,
                }
            }

            if (route.params?.isInstruction) {
                const result = await writeConstructionSiteInstruction({
                    siteId: newSiteId,
                    myCompanyId,
                    constructionId,
                    date,
                    startTime,
                    endTime,
                    meetingTime,
                    requiredNum: siteRequiredNum,
                    address: siteAddress,
                    siteEndTimeIsNextDay,
                    siteStartTimeIsNextDay,
                    belongings: siteBelongings,
                    remarks,
                    constructionRelation: construction.constructionRelation,
                    contractId: contractId,
                    projectId: contractingProject?.projectId,
                })
                if (result.error) {
                    throw {
                        error: result.error == 'siteAlreadyExistsOnTheDay' ? t('admin:SiteAlreadyExistsOnTheDay') : result.error,
                        errorCode: result.errorCode,
                    }
                }
            } else {
                const result = await writeConstructionSite({
                    siteId: newSiteId,
                    myCompanyId,
                    constructionId,
                    date,
                    startTime,
                    endTime,
                    meetingTime,
                    requiredNum: siteRequiredNum,
                    address: siteAddress,
                    siteEndTimeIsNextDay,
                    siteStartTimeIsNextDay,
                    belongings: siteBelongings,
                    remarks,
                    constructionRelation: construction.constructionRelation,
                    projectId: contractingProject?.projectId,
                })
                if (result.error) {
                    throw {
                        error: result.error == 'siteAlreadyExistsOnTheDay' ? t('admin:SiteAlreadyExistsOnTheDay') : result.error,
                        errorCode: result.errorCode,
                    }
                } else {
                    const meetingDate = combineTimeAndDay(meetingTime ?? siteDate, date)
                    const constructionIdAndDate = toIdAndMonthFromStrings(constructionId, meetingDate)
                    const newLocalUpdateScreens: UpdateScreenType[] = [
                        {
                            screenName: 'ConstructionSiteList',
                            idAndDates: [
                                ...flatten(localUpdateScreens.filter((screen) => screen.screenName == 'ConstructionSiteList').map((screen) => screen.idAndDates)),
                                constructionIdAndDate,
                            ]?.filter((data) => data != undefined) as string[],
                        },
                    ]
                    dispatch(setLocalUpdateScreens(uniqBy([...newLocalUpdateScreens, ...localUpdateScreens], 'screenName')))
                }
            }

            return Promise.resolve({
                success: undefined,
            })
        } catch (error) {
            return getErrorMessage(error)
        }
    }

    const _writeFakeCompany = async (companyId: string): Promise<CustomResponse<string>> => {
        try {
            if (companyId === undefined) {
                throw {
                    error: t('common:NoId'),
                }
            }

            const updateData = {
                id: companyId,
                myCompanyId,
                name: newClientCompanyName?.trim(),
            }
            const result = await writeFakeCompany(updateData)
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
            return getErrorMessage(error)
        }
    }

    const checkExistProject = async () => {
        try {
            if (myCompanyId === undefined) {
                throw {
                    error: t('common:NoId'),
                    errorCode: 'CHECK_EXIST_PROJECT_ERROR',
                }
            }

            dispatch(setLoading('unTouchable'))
            const projectsResult = await getMyCompanyProjects({ myCompanyId })
            if (projectsResult.error) {
                throw {
                    error: projectsResult.error,
                    errorCode: projectsResult.errorCode,
                }
            }
            const projects = projectsResult.success ?? []
            const _similarProjects =
                (projects
                    ?.filter((project) => project.name && newProjectName && project.name.indexOf(newProjectName) > -1)
                    .map((project) => project.name)
                    .filter((data) => data != undefined) as string[]) ?? []

            const sameNameProjects = _similarProjects.filter((projectName) => projectName === newProjectName)

            if (sameNameProjects.length > 0) {
                throw {
                    error: t('admin:TheSameNameProjectAlreadyExists'),
                    errorCode: 'CHECK_EXIST_PROJECT_ERROR',
                }
            }

            if (_similarProjects.length > 0) {
                setState((prev) => ({ ...prev, similarProjects: _similarProjects }))
            } else {
                await _createProjectAndConstruction({ isExistingProject: false })
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

    const _updateReceiveListCache = async (contractId: string, constructionId?: string) => {
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
                    imageUrl: undefined,
                    sImageUrl: undefined,
                    xsImageUrl: undefined,
                    imageColorHue: getRandomImageColorHue(),
                    siteAddress,
                    companyContracts: {
                        totalContracts: {
                            items: [
                                {
                                    contractId: contractId,
                                    orderCompany: {
                                        name: orderCompany?.name,
                                    },
                                    // receiveCompany: {
                                    //     name: receiveCompany?.name,
                                    //     companyPartnership: receiveCompany?.companyPartnership,
                                    // },
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

    const _writeProject = async (constructionId?: string, orderCompanyId?: string): Promise<CustomResponse<undefined>> => {
        try {
            setState((prev) => ({ ...prev, similarProjects: [] }))
            if (constructionId === undefined && orderCompanyId === undefined) {
                throw {
                    error: t('common:NoId'),
                    errorCode: 'WRITE_PROJECT_ERROR',
                }
            }
            const newReceiveDepartmentIds = selectedReceiveCompanyDepartments?.map((obj) => obj?.value).filter((data) => data != undefined) as string[]
            const projectId = getUuidv4()
            const _contractId = getUuidv4()
            // 取引一覧キャッシュ更新
            await _updateReceiveListCache(_contractId, constructionId)
            const result = await writeMyProject({
                projectId,
                name: newProjectName,
                myCompanyId,
                startDate,
                myWorkerId: signInUser?.workerId,
                endDate,
                orderCompanyId: orderCompanyId,
                receiveCompanyId: myCompanyId,
                constructionName: name,
                contractId: _contractId,
                constructionId,
                mode: 'create',
                orderCompany: orderCompany
                    ? orderCompany
                    : {
                          companyId: orderCompanyId,
                          name: newClientCompanyName,
                          isFake: true,
                      },
                receiveDepartmentIds: newReceiveDepartmentIds,
            })
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: result.errorCode,
                }
            }

            if (startDate && endDate) {
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

            return Promise.resolve({
                success: undefined,
            })
        } catch (error) {
            return getErrorMessage(error)
        }
    }

    useEffect(() => {
        if (startDate != undefined && endDate != undefined) {
            const _dateRange = getDateRange(startDate, endDate).filter(
                (date) => date.dayOfWeekText && !offDaysOfWeek?.includes(date.dayOfWeekText) && !(offDaysOfWeek?.includes('祝') && isHoliday(date, holidays)),
            )
            const days = calculateConstructionDays(startDate, endDate, offDaysOfWeek, otherOffDays, holidays)
            setState((prev) => ({ ...prev, constructionDays: days, dateRange: _dateRange }))
        }
    }, [startDate, endDate, offDaysOfWeek, otherOffDays])

    useEffect(() => {
        if (startDate != undefined && endDate != undefined) {
            const _dateRange = getDateRange(startDate, endDate).filter(
                (date) => date.dayOfWeekText && !offDaysOfWeek?.includes(date.dayOfWeekText) && !(offDaysOfWeek?.includes('祝') && isHoliday(date, holidays)),
            )
            setState((prev) => ({ ...prev, dateRange: _dateRange, isFirstFetch: false }))
            if (isFirstFetch == false) {
                if (startDate && endDate) {
                    //otherOffDaysがstartDateとendDateの範囲外の場合、otherOffDaysを範囲内のものに限定する
                    const _otherOffDays = otherOffDays?.filter((date) => {
                        return date?.totalSeconds >= startDate?.totalSeconds && date?.totalSeconds <= endDate?.totalSeconds
                    })
                    setState((prev) => ({ ...prev, otherOffDays: _otherOffDays }))
                } else {
                    setState((prev) => ({ ...prev, otherOffDays: [] }))
                }
            }
        }
    }, [startDate, endDate])

    useEffect(() => {
        if (id && signInUser?.workerId && appState == 'active' && isFocused) {
            ;(async () => {
                try {
                    const lockResult = await checkLockOfTarget({
                        myWorkerId: signInUser?.workerId ?? 'no-id',
                        targetId: id ?? 'no-id',
                        modelType: 'construction',
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
                        modelType: 'construction',
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
                    modelType: 'construction',
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

    return (
        <KeyboardAwareScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps={'always'}>
            {isCreateProjectAndConstruction && (
                <>
                    {isSelectExistingProject || isCreateOnlyConstruction ? (
                        <InputProjectBox
                            style={{ marginTop: isCreateOnlyConstruction ? 30 : 30 - dMarginTop }}
                            required={true}
                            disable={isCreateOnlyConstruction}
                            hideDropdown={isCreateOnlyConstruction}
                            title={t('common:Case')}
                            targetDate={targetDate}
                            selectedProject={contractingProject as ProjectType}
                            onValueChangeValid={(value) => {
                                setState((prev) => ({
                                    ...prev,
                                    contractingProject: value as ConstructionCLType,
                                }))
                            }}
                            infoText={t('admin:ThePrimeContractorForTheProjectWillBeCompanyItself')}
                        />
                    ) : (
                        <InputTextBox
                            style={{ marginTop: 30 }}
                            validation={'none'}
                            required={true}
                            title={t('admin:NewCaseName')}
                            placeholder={PLACEHOLDER.PROJECT_NAME}
                            value={newProjectName}
                            onValueChangeValid={(value) => {
                                setState((prev) => ({ ...prev, newProjectName: value }))
                                if (!isConstructionNameEdited) {
                                    setState((prev) => ({ ...prev, name: value }))
                                }
                            }}
                            infoText={t('admin:ThePrimeContractorForTheProjectWillBeCompanyItself')}
                        />
                    )}
                    {!isCreateOnlyConstruction && (
                        <Checkbox
                            size={20}
                            fontSize={12}
                            color={THEME_COLORS.BLUE.MIDDLE}
                            textColor={THEME_COLORS.BLUE.DEEP}
                            text={t('admin:SelectTheExistingCase')}
                            style={{
                                marginTop: 5,
                                marginLeft: 20,
                                alignItems: 'center',
                            }}
                            checked={isSelectExistingProject}
                            onChange={(value) => {
                                setState((prev) => ({ ...prev, isSelectExistingProject: value }))
                            }}
                        />
                    )}
                    {!isSelectExistingProject && !isCreateOnlyConstruction && !isDefaultDepartment && (
                        <InputObjectDropdownBox
                            title={t('common:ReceivedDepartments')}
                            required={true}
                            placeholder={PLACEHOLDER.DEPARTMENT}
                            selectableItems={receiveCompanyDepartments ?? []}
                            selectNum={'any'}
                            value={selectedReceiveCompanyDepartments}
                            style={{ marginTop: 30 - dMarginTop }}
                            onValueChangeValid={(value) => {
                                setState((prev) => ({ ...prev, selectedReceiveCompanyDepartments: value }))
                            }}
                        />
                    )}
                    {(isSelectExistingProject || isSelectExistingClientCompany || isCreateOnlyConstruction) && (
                        <InputCompanyBox
                            disable={isSelectExistingProject || isCreateOnlyConstruction}
                            disableNavigation
                            hideDropdown
                            style={{ marginTop: 30 - dMarginTop }}
                            required={true}
                            title={t('admin:SelectClient')}
                            selectedCompany={orderCompany}
                            withoutMyCompany
                            isCompanyAlreadyExists={!!orderCompany}
                            onValueChangeValid={(value: CompanyCLType | undefined) => {
                                setState((prev) => ({ ...prev, orderCompany: value }))
                            }}
                            onClear={() => {
                                setState((prev) => ({
                                    ...prev,
                                    orderCompany: undefined,
                                    inputCompanyName: undefined,
                                    isSelectExistingClientCompany: false,
                                    isCreateNewClientWithInputCompanyName: false,
                                }))
                            }}
                        />
                    )}
                    {!isSelectExistingClientCompany && !isSelectExistingProject && !isCreateOnlyConstruction && (
                        <View onLayout={onLayout}>
                            <InputTextBox
                                style={{ marginTop: 30 - dMarginTop }}
                                validation={'none'}
                                required={true}
                                title={t('admin:SelectClient')}
                                // infoText={t('admin:ClientWillBeCreatedAutomatically')}
                                placeholder={PLACEHOLDER.COMPANY_NAME}
                                value={newClientCompanyName}
                                onValueChangeValid={(value) => {
                                    setState((prev) => ({
                                        ...prev,
                                        inputCompanyName: value,
                                    }))
                                }}
                                onClear={() => {
                                    setState((prev) => ({
                                        ...prev,
                                        orderCompany: undefined,
                                        inputCompanyName: undefined,
                                        newClientCompanyName: undefined,
                                        isSelectExistingClientCompany: false,
                                        isCreateNewClientWithInputCompanyName: false,
                                    }))
                                }}
                            />
                        </View>
                    )}
                    {inputCompanyName && !isCreateNewClientWithInputCompanyName && (
                        <View
                            style={{
                                position: 'absolute',
                                top: (size?.y ?? 0) + (size?.height ?? 0),
                                zIndex: 10,
                                width: '98%',
                                margin: 'auto',
                                alignSelf: 'center',
                            }}>
                            <SearchCompanyBox
                                displayCompanies={companies}
                                inputCompanyName={inputCompanyName}
                                style={{
                                    maxHeight: 300,
                                    paddingTop: 2,
                                    paddingBottom: 5,
                                }}
                                onPressCompany={(value) => setState((prev) => ({ ...prev, orderCompany: value, inputCompanyName: undefined, isSelectExistingClientCompany: true }))}
                                onCreateCompany={(value) => {
                                    setState((prev) => ({
                                        ...prev,
                                        isCreateNewClientWithInputCompanyName: true,
                                        newClientCompanyName: value,
                                    }))
                                }}
                            />
                        </View>
                    )}
                    {/* {!isSelectExistingProject && (
                        <Checkbox
                            size={20}
                            fontSize={12}
                            color={THEME_COLORS.BLUE.MIDDLE}
                            textColor={THEME_COLORS.BLUE.DEEP}
                            text={t('admin:SelectTheExistingClient')}
                            style={{
                                marginTop: 10,
                                marginLeft: 20,
                                alignItems: 'center',
                            }}
                            checked={isSelectExistingClientCompany}
                            onChange={(value) => {
                                setState((prev) => ({ ...prev, isSelectExistingClientCompany: value }))
                            }}
                        />
                    )} */}
                </>
            )}
            {!isCreateProjectAndConstruction && (
                <InputTextBox
                    style={{ marginTop: 30 }}
                    validation={'none'}
                    required={true}
                    title={t('common:ConstructionName')}
                    placeholder={PLACEHOLDER.CONSTRUCTION_NAME}
                    value={name}
                    onValueChangeValid={(value) => {
                        setState((prev) => ({ ...prev, name: value }))
                    }}
                />
            )}
            <InputDateTimeBox
                style={{ marginTop: 30 - dMarginTop }}
                required={true}
                title={t('common:DurationStart')}
                value={startDate}
                initDateInput={startDate}
                // minDateTime={contractingProject?.startDate}
                dateInputMode="date"
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, startDate: value }))
                }}
                disable={isSelectExistingProject || fakeCompanyInvReservationId ? true : false}
            />
            <InputDateTimeBox
                style={{ marginTop: 30 - dMarginTop }}
                required={true}
                title={t('admin:ConstructionPeriodCompleted')}
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
                disable={isSelectExistingProject || fakeCompanyInvReservationId ? true : false}
            />
            {isCreateProjectAndConstruction && (
                <>
                    <InputTextBox
                        style={{ marginTop: 30 - dMarginTop }}
                        validation={'none'}
                        required={true}
                        title={isCreateOnlyConstruction ? t('common:ConstructionName') : t('common:ConstructionTypeName')}
                        placeholder={PLACEHOLDER.CONSTRUCTION_NAME}
                        value={name}
                        onValueChangeValid={(value) => {
                            setState((prev) => ({ ...prev, name: value }))
                            if (!isConstructionNameEdited) {
                                setState((prev) => ({ ...prev, isConstructionNameEdited: true }))
                            }
                        }}
                    />
                    <InputDateTimeBox
                        style={{ marginTop: 30 - dMarginTop }}
                        required={true}
                        title={t('common:SiteDate')}
                        value={siteDate}
                        initDateInput={siteDate}
                        dateInputMode="date"
                        onValueChangeValid={(value) => {
                            setState((prev) => ({ ...prev, siteDate: value }))
                        }}
                    />
                    <InputDateTimeBox
                        style={{ marginTop: 30 - dMarginTop }}
                        title={t('common:SiteMeetingTime')}
                        displayNextDayButton={false}
                        value={siteMeetingTime}
                        maxDateTime={siteStartTime}
                        initDateInput={siteMeetingTime}
                        dateInputMode={'time'}
                        onValueChangeValid={(value) => {
                            setState((prev) => ({ ...prev, siteMeetingTime: value }))
                        }}
                        defaultDateInput={DEFAULT_SITE_MEETING_TIME}
                        onClear={() => {
                            setState((prev) => ({ ...prev, siteMeetingTime: DEFAULT_SITE_MEETING_TIME }))
                        }}
                    />
                    <Checkbox
                        size={20}
                        fontSize={12}
                        color={BlueColor.deepColor}
                        textColor={BlueColor.deepTextColor}
                        text={t('common:SetAnUndeterminedTimeForTheMeeting')}
                        style={{
                            marginTop: 10,
                            marginLeft: 20,
                        }}
                        checked={siteMeetingTime == undefined ? true : false}
                        onChange={(value) => {
                            if (siteMeetingTime != undefined) {
                                setState((prev) => ({ ...prev, siteMeetingTime: undefined }))
                            } else {
                                setState((prev) => ({ ...prev, siteMeetingTime: DEFAULT_SITE_MEETING_TIME }))
                            }
                        }}
                    />
                    <InputDateTimeBox
                        style={{ marginTop: 30 - dMarginTop }}
                        required={true}
                        title={t('common:SiteStartTime')}
                        value={siteStartTime}
                        displayNextDayButton={true}
                        initDateInput={DEFAULT_SITE_START_TIME}
                        isNextDay={siteStartTimeIsNextDay}
                        maxDateTimeIsNextDay={siteEndTimeIsNextDay}
                        minDateTime={siteMeetingTime}
                        maxDateTime={siteEndTime}
                        dateInputMode={'time'}
                        onValueChangeValid={(value) => {
                            setState((prev) => ({ ...prev, siteStartTime: value }))
                        }}
                        onNextDayChanged={(value) => {
                            setState((prev) => ({ ...prev, siteStartTimeIsNextDay: value }))
                        }}
                        defaultDateInput={DEFAULT_SITE_START_TIME}
                        onClear={() => {
                            setState((prev) => ({
                                ...prev,
                                siteStartTime: DEFAULT_SITE_START_TIME,
                                siteStartTimeIsNextDay: false,
                            }))
                        }}
                    />
                    <InputDateTimeBox
                        style={{ marginTop: 30 - dMarginTop }}
                        required={true}
                        title={t('common:SiteEndTime')}
                        displayNextDayButton={true}
                        initDateInput={DEFAULT_SITE_END_TIME}
                        isNextDay={siteEndTimeIsNextDay}
                        minDateTimeIsNextDay={siteStartTimeIsNextDay}
                        value={siteEndTime}
                        minDateTime={siteStartTime}
                        dateInputMode={'time'}
                        onValueChangeValid={(value) => {
                            setState((prev) => ({ ...prev, siteEndTime: value }))
                        }}
                        onNextDayChanged={(value) => {
                            setState((prev) => ({ ...prev, siteEndTimeIsNextDay: value }))
                        }}
                        defaultDateInput={DEFAULT_SITE_END_TIME}
                        onClear={() => {
                            setState((prev) => ({ ...prev, siteEndTime: DEFAULT_SITE_END_TIME, siteEndTimeIsNextDay: false }))
                        }}
                    />
                </>
            )}
            <InputDropDownBox
                style={{ marginTop: 30 - dMarginTop }}
                title={t('common:RegularHolidays')}
                value={offDaysOfWeek as string[]}
                selectableItems={weekDayList as string[]}
                selectNum={'any'}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, offDaysOfWeek: value }))
                }}
                disable={fakeCompanyInvReservationId ? true : false}
                onClear={() => {
                    setState((prev) => ({ ...prev, offDaysOfWeek: undefined }))
                }}
            />
            <InputDateDropdownBox
                style={{ marginTop: 30 - dMarginTop }}
                title={t('common:OtherHolidays')}
                value={otherOffDays}
                selectableItems={dateRange}
                selectNum={'any'}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, otherOffDays: value }))
                }}
                disable={fakeCompanyInvReservationId ? true : false}
                onClear={() => {
                    setState((prev) => ({ ...prev, otherOffDays: undefined }))
                }}
            />
            <InputTextBox
                style={{ marginTop: 30 - dMarginTop }}
                validation={'none'}
                required={false}
                title={t('common:ConstructionRemarks')}
                placeholder={PLACEHOLDER.REMARKS}
                value={remarks}
                multiline={true}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, remarks: value }))
                }}
                onClear={() => {
                    setState((prev) => ({ ...prev, remarks: undefined }))
                }}
            />
            <InputNumberBox
                style={{ marginTop: 30 - dMarginTop }}
                required={false}
                title={t('admin:PlannedNoOfWorkers')}
                value={requiredWorkerNum}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, requiredWorkerNum: value }))
                }}
                onClear={() => {
                    setState((prev) => ({ ...prev, requiredWorkerNum: undefined }))
                }}
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
                infoText={t('common:AllAddressesOfTheCaseWillBeChanged')}
                onClear={() => {
                    setState((prev) => ({ ...prev, siteAddress: undefined }))
                }}
            />
            <InputNumberBox style={{ marginTop: 30 - dMarginTop }} disable={true} required title={t('common:ConstructionDays')} value={constructionDays} />
            <Line
                style={{
                    marginTop: 30 - dMarginTop,
                }}
            />
            <Text
                style={{
                    ...GlobalStyles.mediumText,
                    marginTop: 30 - dMarginTop,
                    paddingHorizontal: 10,
                    paddingVertical: 7,
                    backgroundColor: THEME_COLORS.BLUE.MIDDLE,
                    color: '#fff',
                }}>
                {t('admin:OnsiteDefaultSetting')}
            </Text>
            <Text
                style={{
                    ...GlobalStyles.smallGrayText,
                    marginTop: 5,
                    marginLeft: 10,
                }}>
                {t('admin:SettingCreatedWhenSiteCreated')}
            </Text>
            <InputDateTimeBox
                style={{ marginTop: 30 - dMarginTop }}
                required={false}
                title={t('common:TimeOfMeeting')}
                displayNextDayButton={false}
                initDateInput={siteDefaultMeetingTime}
                value={siteDefaultMeetingTime}
                dateInputMode="time"
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, siteDefaultMeetingTime: value }))
                }}
                defaultDateInput={DEFAULT_SITE_MEETING_TIME}
                onClear={() => {
                    setState((prev) => ({ ...prev, siteDefaultMeetingTime: DEFAULT_SITE_MEETING_TIME }))
                }}
            />
            <Checkbox
                size={20}
                fontSize={12}
                color={BlueColor.deepColor}
                textColor={BlueColor.deepTextColor}
                text={t('common:SetAnUndeterminedTimeForTheMeeting')}
                style={{
                    marginTop: 10,
                    marginLeft: 20,
                }}
                checked={siteDefaultMeetingTime == undefined ? true : false}
                onChange={(value) => {
                    if (siteDefaultMeetingTime != undefined) {
                        setState((prev) => ({ ...prev, siteDefaultMeetingTime: undefined }))
                    } else {
                        setState((prev) => ({ ...prev, siteDefaultMeetingTime: DEFAULT_SITE_MEETING_TIME }))
                    }
                }}
            />
            <InputDateTimeBox
                style={{ marginTop: 30 - dMarginTop }}
                required={false}
                title={t('common:AssignmentStartTime')}
                displayNextDayButton={true}
                value={siteDefaultStartTime}
                initDateInput={siteDefaultStartTime}
                minDateTime={siteDefaultMeetingTime}
                maxDateTimeIsNextDay={siteDefaultEndTimeIsNextDay}
                maxDateTime={siteDefaultEndTime}
                isNextDay={siteDefaultStartTimeIsNextDay}
                dateInputMode="time"
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, siteDefaultStartTime: value }))
                }}
                onNextDayChanged={(value) => {
                    setState((prev) => ({ ...prev, siteDefaultStartTimeIsNextDay: value }))
                }}
                defaultDateInput={DEFAULT_SITE_START_TIME}
                onClear={() => {
                    setState((prev) => ({ ...prev, siteDefaultStartTime: DEFAULT_SITE_START_TIME, siteDefaultStartTimeIsNextDay: false }))
                }}
            />
            <InputDateTimeBox
                style={{ marginTop: 30 - dMarginTop }}
                required={false}
                title={t('common:AssignmentEndTime')}
                value={siteDefaultEndTime}
                displayNextDayButton={true}
                initDateInput={siteDefaultEndTime}
                isNextDay={siteDefaultEndTimeIsNextDay}
                minDateTime={siteDefaultStartTime}
                minDateTimeIsNextDay={siteDefaultStartTimeIsNextDay}
                dateInputMode="time"
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, siteDefaultEndTime: value }))
                }}
                onNextDayChanged={(value) => {
                    setState((prev) => ({ ...prev, siteDefaultEndTimeIsNextDay: value }))
                }}
                defaultDateInput={DEFAULT_SITE_END_TIME}
                onClear={() => {
                    setState((prev) => ({ ...prev, siteDefaultEndTime: DEFAULT_SITE_END_TIME, siteDefaultEndTimeIsNextDay: false }))
                }}
            />
            <InputNumberBox
                style={{ marginTop: 30 - dMarginTop }}
                required={false}
                title={t('common:AverageEmployeesPerDay')}
                value={siteRequiredNum}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, siteRequiredNum: value }))
                }}
                onClear={() => {
                    setState((prev) => ({ ...prev, siteRequiredNum: undefined }))
                }}
            />
            <InputTextBox
                style={{ marginTop: 30 - dMarginTop }}
                required={false}
                title={t('common:PersonalEffects')}
                placeholder={PLACEHOLDER.BELONGING}
                value={siteBelongings}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, siteBelongings: value }))
                }}
                onClear={() => {
                    setState((prev) => ({ ...prev, siteBelongings: undefined }))
                }}
            />
            <InputTextBox
                style={{ marginTop: 30 - dMarginTop }}
                required={false}
                title={t('common:SiteRemarks')}
                placeholder={PLACEHOLDER.REMARKS}
                value={siteRemarks}
                multiline={true}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, siteRemarks: value }))
                }}
                onClear={() => {
                    setState((prev) => ({ ...prev, siteRemarks: undefined }))
                }}
            />
            <AppButton
                style={{ marginTop: 30, marginHorizontal: 20 }}
                title={mode == 'edit' ? t('common:Save') : t('common:Create')}
                disabled={disable}
                onPress={async () => {
                    if (isCreateProjectAndConstruction) {
                        if (isSelectExistingProject || isCreateOnlyConstruction) {
                            await _createProjectAndConstruction({ isExistingProject: true })
                        } else {
                            await checkExistProject()
                        }
                    } else {
                        await __writeConstruction()
                    }
                }}
            />
            <BaseModal
                isVisible={similarProjects?.length ? similarProjects.length > 0 : false}
                onPress={() => {
                    _createProjectAndConstruction({ isExistingProject: false })
                }}
                buttonTitle={t('common:Making')}
                onClose={_closeModal}>
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

export default EditConstruction

const styles = StyleSheet.create({})
