import React, { useState, useEffect, useContext, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { View, StyleSheet, ListRenderItem, ListRenderItemInfo, RefreshControl } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { FlatList } from 'react-native-gesture-handler'
import * as Clipboard from 'expo-clipboard'
// import * as FileSystem from 'expo-file-system'
// import Papa from 'papaparse'
import { WorkerCL } from '../../../components/organisms/worker/WorkerCL'
import { ShadowBoxWithHeader } from '../../../components/organisms/shadowBox/ShadowBoxWithHeader'
import { AppButton } from '../../../components/atoms/AppButton'
import { IconParam } from '../../../components/organisms/IconParam'
import { EmptyScreen } from '../../../components/template/EmptyScreen'
import { THEME_COLORS, WINDOW_WIDTH } from '../../../utils/Constants'
import { companyRoleToNum, companyRoleToText } from '../../../usecases/company/CommonCompanyCase'
import { StoreType } from '../../../stores/Store'
import { setLoading, setToastMessage, ToastMessage } from '../../../stores/UtilSlice'
import { getUuidv4 } from '../../../utils/Utils'
import { CustomResponse } from '../../../models/_others/CustomResponse'
import { AdminMyPageRouterContextType } from './AdminMyPageRouter'
import { getWorkersOfMyCompany, GetWorkersOfMyCompanyResponse } from '../../../usecases/worker/WorkerListCase'
import { useIsFocused } from '@react-navigation/native'
import { WorkerCLType } from '../../../models/worker/Worker'
import { InvoiceDownloadButton } from '../../../components/organisms/invoice/InvoiceDownloadButton'
import { updateCachedData, getCachedData, genKeyName } from '../../../usecases/CachedDataCase'
import { useSafeLoadingUnmount, useSafeUnmount } from '../../../fooks/useUnmount'
import { setIsNavUpdating } from '../../../stores/NavigationSlice'
import { deleteScreenOfUpdateScreens, checkUpdateOfTargetScreen } from '../../../usecases/updateScreens/CommonUpdateScreensCase'
import { getErrorMessage, getErrorToastMessage } from '../../../services/_others/ErrorService'
import { useTextTranslation } from './../../../fooks/useTextTranslation'
import { workerLeftDateToNum } from '../../../usecases/worker/CommonWorkerCase'
import { BottomMargin } from '../../../components/atoms/BottomMargin'
import { SelectButton } from '../../../components/organisms/SelectButton'
import { match } from 'ts-pattern'
import { checkMyDepartment } from '../../../usecases/department/DepartmentCase'
import { Search } from '../../../components/organisms/Search'
import { getInviteUrl, GetInviteWorkerUrlParam } from '../../../usecases/worker/InviteMyWorkerCase'
import isEmpty from 'lodash/isEmpty'
import flatten from 'lodash/flatten'
import uniq from 'lodash/uniq'

type NavProps = StackNavigationProp<RootStackParamList, 'Default'>
type RouteProps = RouteProp<RootStackParamList, 'Default'>

// type WorkerDataType = {
//     name: string
//     phoneNumber?: string
//     companyRole?: string[]
//     offDaysOfWeek?: WeekOfDay[]
//     isOfficeWorker?: boolean
// }

type InitialStateType = {
    workers?: MyCompanyWorkerUIType[]
    displayWorkers?: MyCompanyWorkerUIType[]
    refreshing: boolean
    updateCache: number
}
export type MyCompanyWorkerUIType = WorkerCLType

const initialState: InitialStateType = {
    refreshing: false,
    updateCache: 0,
}

const MyCompanyWorkerList = () => {
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const { t } = useTextTranslation()

    const [{ workers, displayWorkers, refreshing, updateCache }, setState] = useState(initialState)
    const dispatch = useDispatch()
    const [textFilter, setTextFilter] = useState<string | undefined>(undefined)

    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const { update } = useContext(AdminMyPageRouterContextType)
    const signInUser = useSelector((state: StoreType) => state.account.signInUser)
    const accountId = signInUser?.accountId ?? ''
    const cachedCompanyWorkerListKey = genKeyName({ screenName: 'MyCompanyWorkerList', accountId: accountId, companyId: myCompanyId ?? '' })

    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const localUpdateScreens = useSelector((state: StoreType) => state?.util?.localUpdateScreens)
    const activeDepartments = useSelector((state: StoreType) => state.account.activeDepartments)
    const activeDepartmentIds = useMemo(() => activeDepartments?.map((dep) => dep?.departmentId).filter((data) => data != undefined) as string[], [activeDepartments])

    useEffect(() => {
        if (isFocused) {
            setState((prev) => ({ ...prev, updateCache: updateCache + 1 }))

            /**
             * 作成編集削除により、キャッシュと表示内容が異なる場合にDBフェッチ
             */
            ;(async () => {
                const isUpdateResult = await checkUpdateOfTargetScreen({ accountId: signInUser?.accountId, targetScreenName: 'MyCompanyWorkerList', localUpdateScreens })
                if (isUpdateResult.success) {
                    dispatch(setIsNavUpdating(true))
                }
            })()
        }
    }, [isFocused])

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            setState((prev) => ({ ...prev, refreshing: true }))
        }
    }, [isNavUpdating])

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        return () => setState(initialState)
    }, [myCompanyId])

    useSafeUnmount(setState, initialState)

    useEffect(() => {
        ;(async () => {
            try {
                if (isEmpty(myCompanyId) || isEmpty(signInUser?.workerId)) {
                    dispatch(setIsNavUpdating(false))
                    setState((prev) => ({ ...prev, refreshing: false }))
                    return
                }
                if (isFocused) dispatch(setLoading(true))
                const workersResult: CustomResponse<GetWorkersOfMyCompanyResponse> = await getWorkersOfMyCompany({
                    myCompanyId,
                    myWorkerId: signInUser?.workerId,
                })
                if (workersResult.error) {
                    dispatch(
                        setToastMessage({
                            text: workersResult.error,
                            type: 'error',
                        } as ToastMessage),
                    )
                    return
                }
                /**
                 * キャッシュアップデート前に先に表示データを更新。
                 */
                setState((prev) => ({
                    ...prev,
                    workers: workersResult.success,
                    displayWorkers: workersResult.success?.filter((worker) =>
                        checkMyDepartment({
                            targetDepartmentIds: worker.departmentIds,
                            activeDepartmentIds,
                        }),
                    ),
                }))
                const cachedResult = await updateCachedData({ key: cachedCompanyWorkerListKey, value: workersResult.success })
                if (cachedResult.error) {
                    dispatch(
                        setToastMessage({
                            text: cachedResult.error,
                            type: 'error',
                        }),
                    )
                }
                await deleteScreenOfUpdateScreens({ accountId, screenName: 'MyCompanyWorkerList' })
            } catch (error) {
                const _error = error as CustomResponse
                dispatch(
                    setToastMessage({
                        text: getErrorToastMessage(_error),
                        type: 'error',
                    } as ToastMessage),
                )
            } finally {
                setState((prev) => ({ ...prev, refreshing: false }))
                if (isFocused) {
                    dispatch(setIsNavUpdating(false))
                    dispatch(setLoading(false))
                }
            }
        })()
    }, [refreshing, isFocused])

    /**
     * @summary updateCacheフラグが変化した時の副作用フック（KVSから表示データを再取得更新）
     * @purpose アプリ側にKVSによるキャッシュを設けて一覧の初期表示速度を改善する
     * @author Okuda
     */
    useEffect(() => {
        ;(async () => {
            const result = await getCachedData<GetWorkersOfMyCompanyResponse>(cachedCompanyWorkerListKey)
            if (result.error) {
                if (result.errorCode != 'FIRST_FETCH') {
                    dispatch(
                        setToastMessage({
                            text: result.error,
                            type: 'error',
                        }),
                    )
                }
                setState((rev) => ({ ...rev, refreshing: true }))
            } else {
                setState((rev) => ({
                    ...rev,
                    workers: result.success,
                    displayWorkers: result.success?.filter((worker) =>
                        checkMyDepartment({
                            targetDepartmentIds: worker.departmentIds,
                            activeDepartmentIds,
                        }),
                    ),
                }))
            }
        })()
    }, [updateCache])

    useEffect(() => {
        setTextFilter(undefined)
    }, [workers, activeDepartmentIds])

    useEffect(() => {
        if (isFocused != true) {
            return
        }
        let filteredData = workers
        if (textFilter && textFilter.length > 0) {
            filteredData = workers?.filter((worker) => (worker?.nickname ?? worker?.name)?.includes(textFilter)) ?? []
        }

        const _workers = filteredData?.filter((worker) =>
            checkMyDepartment({
                targetDepartmentIds: worker.departmentIds,
                activeDepartmentIds,
            }),
        )
        setState((prev) => ({
            ...prev,
            displayWorkers: _workers,
        }))
    }, [textFilter, isFocused])

    const _content: ListRenderItem<MyCompanyWorkerUIType> = (info: ListRenderItemInfo<MyCompanyWorkerUIType>) => {
        const { item, index } = info
        const left = item.workerTags?.includes('left-business')
        return (
            <ShadowBoxWithHeader
                style={{
                    marginHorizontal: 10,
                    marginTop: 10,
                    backgroundColor: left ? THEME_COLORS.OTHERS.BORDER_COLOR : '#fff',
                }}
                key={item.workerId}
                headerColor={left ? THEME_COLORS.OTHERS.LIGHT_GRAY : undefined}
                titleColor={item.companyRole == 'owner' || item.companyRole == 'manager' ? THEME_COLORS.BLUE.MIDDLE_DEEP : item.leftDate != undefined ? THEME_COLORS.OTHERS.BLACK : undefined}
                title={left ? t('admin:Withdrawn') : companyRoleToText(item.companyRole)}
                onPress={() => {
                    navigation.push('WorkerDetailRouter', {
                        workerId: item.workerId,
                        title: item.name,
                    })
                }}>
                <WorkerCL worker={item} />
            </ShadowBoxWithHeader>
        )
    }

    const _header = useMemo(() => {
        const leftCount = displayWorkers?.filter((worker) => worker.workerTags?.includes('left-business')).length ?? 0
        return (
            <View>
                <View
                    style={{
                        paddingVertical: 10,
                        backgroundColor: '#fff',
                        borderBottomWidth: 1,
                        borderBottomColor: THEME_COLORS.OTHERS.BORDER_COLOR,
                        flexDirection: 'row',
                    }}>
                    <IconParam
                        style={{
                            marginLeft: 10,
                        }}
                        paramName={t('admin:InHouseWorkers')}
                        suffix={t('common:Name')}
                        count={(displayWorkers?.length ?? 0) - leftCount}
                        iconName={'worker'}
                        onPress={() => {
                            navigation.push('AddMyWorker', {})
                        }}
                    />
                    <IconParam
                        style={{
                            marginLeft: 10,
                        }}
                        hasBorder
                        color={THEME_COLORS.OTHERS.GRAY}
                        paramName={t('admin:Withdrawn')}
                        suffix={t('common:Name')}
                        count={displayWorkers?.filter((worker) => worker.workerTags?.includes('left-business')).length ?? 0}
                        iconName={'worker'}
                    />
                </View>
                <InvoiceDownloadButton title={t('admin:DownloadStatementForEmployees')} style={{ margin: 10 }} invoiceType={'workers'} />
            </View>
        )
    }, [displayWorkers])

    type UnregisteredWorkerType = {
        workerId?: string
        name?: string
        nickname?: string
        departments?: string[]
        link?: string
    }

    const _copyAllUnregisteredWorkersInvitationURLs = async () => {
        try {
            const _unregisteredWorkers = workers?.filter((worker) => worker.workerTags?.includes('unregister')) ?? []

            if (_unregisteredWorkers.length === 0) {
                dispatch(
                    setToastMessage({
                        text: t('admin:NoUnregisteredWorkerExists'),
                        type: 'warn',
                    } as ToastMessage),
                )
                return
            }

            const promises = _unregisteredWorkers.map(async (worker): Promise<CustomResponse<UnregisteredWorkerType>> => {
                try {
                    const linkResult = await _getInviteUrl(worker?.workerId, worker?.name, worker?.nickname)
                    if (linkResult.error) {
                        throw {
                            error: linkResult.error,
                            errorCode: linkResult.errorCode,
                        }
                    }

                    return Promise.resolve({
                        success: {
                            workerId: worker?.workerId,
                            name: worker?.name,
                            nickname: worker?.nickname,
                            departments: worker?.departments?.items?.map((item) => item?.departmentName) as string[],
                            link: linkResult.success,
                        },
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

            const unregisteredWorkers = results.map((result) => result.success) as UnregisteredWorkerType[]

            const departmentNames = uniq(flatten(unregisteredWorkers.map((worker) => worker.departments).filter((item) => item && item.length > 0))) as string[]
            const sortedDepartmentNames = departmentNames.sort((a, b) => (a ?? '').localeCompare(b ?? '', 'ja', { sensitivity: 'base' }))

            let _text: string[] = []
            _text.push('以下のリストの中の、ご自身のURLをタップして「CORECA」をインストールしてください。\n')

            // 複数部署所属者
            const _workersInDepartments = sortedDepartmentNames.map((departmentName) => {
                if (departmentName === undefined) return
                return unregisteredWorkers.filter((worker) => worker.departments?.includes(departmentName) && worker.departments?.length > 1)
            })
            const workersInDepartments = uniq(flatten(_workersInDepartments)) as UnregisteredWorkerType[]

            if (workersInDepartments.length > 0) {
                _text.push(`\n【複数部署所属】\n`)
                workersInDepartments
                    .sort((a, b) => (a.nickname ?? a.name ?? '').localeCompare(b.nickname ?? b.name ?? b.name ?? '', 'ja', { sensitivity: 'base' }))
                    .forEach((worker) => {
                        if (worker.nickname === undefined) {
                            _text.push(`  ${worker.name}` + '  [', (worker.departments as string[]).join('、') + '] \n')
                            _text.push(`  ${worker.link}\n\n`)
                        } else {
                            _text.push(`  ${worker.nickname}（${worker.name}）` + '  [', (worker.departments as string[]).join('、') + '] \n')
                            _text.push(`  ${worker.link}\n\n`)
                        }
                    })
            }

            // 単一部署所属者
            sortedDepartmentNames.forEach((departmentName) => {
                if (departmentName === undefined) return

                const _workers = unregisteredWorkers.filter((worker) => worker.departments?.includes(departmentName) && worker.departments?.length === 1)

                if (_workers.length === 0) return

                _text.push(`\n【${departmentName}】\n`)
                _workers
                    .sort((a, b) => (a.nickname ?? a.name ?? '').localeCompare(b.nickname ?? b.name ?? b.name ?? '', 'ja', { sensitivity: 'base' }))
                    .forEach((worker) => {
                        if (worker.nickname === undefined) {
                            _text.push(`  ${worker.name}\n`)
                            _text.push(`  ${worker.link}\n\n`)
                        } else {
                            _text.push(`  ${worker.nickname}（${worker.name}）\n`)
                            _text.push(`  ${worker.link}\n\n`)
                        }
                    })
            })

            // 部署名未入力者
            const workersNoDepartment = unregisteredWorkers.filter((worker) => worker.departments === undefined || worker.departments.length === 0)

            if (workersNoDepartment.length > 0) {
                _text.push(`\n【部署名未入力】\n`)

                workersNoDepartment
                    .sort((a, b) => (a.nickname ?? a.name ?? '').localeCompare(b.nickname ?? b.name ?? b.name ?? '', 'ja', { sensitivity: 'base' }))
                    .forEach((worker) => {
                        if (worker.nickname === undefined) {
                            _text.push(`  ${worker.name}\n`)
                            _text.push(`  ${worker.link}\n\n`)
                        } else {
                            _text.push(`  ${worker.nickname}（${worker.name}）\n`)
                            _text.push(`  ${worker.link}\n\n`)
                        }
                    })
            }

            const text = _text.join('')

            await Clipboard.setStringAsync(text)

            dispatch(
                setToastMessage({
                    text: t('admin:CopiedAllInvitationURLsToClipboard'),
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

    const _getInviteUrl = async (workerId?: string, workerName?: string, workerNickname?: string): Promise<CustomResponse<string>> => {
        try {
            if (myCompanyId === undefined) {
                throw {
                    error: 'myCompanyId is undefined',
                }
            }
            if (workerId === undefined || workerName === undefined) {
                throw {
                    error: 'workerId or workerName is undefined',
                }
            }

            const metroPort = '8081'

            const result = await getInviteUrl({ myCompanyId, workerId, workerName, workerNickname, metroPort } as GetInviteWorkerUrlParam)
            if (result.error) {
                throw {
                    error: result.error,
                }
            }

            return Promise.resolve({
                success: result.success,
            })
        } catch (error) {
            return getErrorMessage(error)
        }
    }

    // const _writeMyCompanyWorker = async (worker: WorkerDataType): Promise<CustomResponse<undefined>> => {
    //     try {
    //         if (myCompanyId == undefined) {
    //             throw {
    //                 error: t('admin:YourCompanyInformationisMissingPleaseLoginAgain'),
    //             }
    //         }

    //         const { name, phoneNumber, companyRole, offDaysOfWeek, isOfficeWorker } = worker

    //         const result = await createMyCompanyWorker({
    //             workerId: getUuidv4(),
    //             myCompanyId,
    //             name,
    //             phoneNumber,
    //             companyRole,
    //             offDaysOfWeek,
    //             isOfficeWorker,
    //             // image,
    //             // imageColorHue,
    //             // imageUrl,
    //             // sImageUrl,
    //             // xsImageUrl,
    //         })
    //         if (result.error) {
    //             throw {
    //                 error: result.error,
    //             }
    //         }

    //         return Promise.resolve({
    //             success: undefined,
    //         })
    //     } catch (error) {
    //         return getErrorMessage(error)
    //     }
    // }

    // const _addWorkersFromCSV = async () => {
    //     try {
    //         const result = await pickDocument()

    //         if (result?.type === 'cancel') {
    //             return
    //         }

    //         if (result?.type !== 'success') {
    //             throw {
    //                 error: 'CSVファイルの取得に失敗しました',
    //                 errorcode: 'FAIL_TO_PICK_FILE',
    //             }
    //         }

    //         const { uri } = result

    //         if (!uri) {
    //             throw {
    //                 error: 'CSVファイルのパスが取得できません。',
    //                 errorcode: 'FAIL_TO_PICK_FILE',
    //             }
    //         }

    //         dispatch(setLoading('untouchable'))

    //         await _parseCSVAndAddWorkers(uri)

    //         dispatch(setLocalUpdateScreens([...localUpdateScreens, { screenName: 'MyCompanyWorkerList' }]))
    //         dispatch(setLoading(false))
    //         dispatch(
    //             setToastMessage({
    //                 text: t('admin:InHouseWorkersWereCreated'),
    //                 type: 'success',
    //             } as ToastMessage),
    //         )

    //         setState((rev) => ({ ...rev, refreshing: true }))
    //     } catch (error) {
    //         const _error = error as CustomResponse
    //         dispatch(
    //             setToastMessage({
    //                 text: _error,
    //                 type: 'error',
    //             } as ToastMessage),
    //         )
    //     }
    // }

    // const _parseCSVAndAddWorkers = async (uri: string) => {
    //     try {
    //         const resultString = await FileSystem.readAsStringAsync(uri)

    //         if (isEmpty(resultString)) {
    //             throw {
    //                 error: 'データが存在しません。',
    //                 errorCode: 'NO_DATA',
    //             }
    //         }

    //         Papa.parse(resultString, {
    //             complete: async (result) => {
    //                 const workersData = result.data

    //                 if (isEmpty(workersData)) {
    //                     throw {
    //                         error: 'データが存在しません。',
    //                         errorCode: 'NO_DATA',
    //                     }
    //                 }

    //                 const resultAddWorkers = await _addWorkers(workersData)
    //                 if (resultAddWorkers.error) {
    //                     throw {
    //                         error: resultAddWorkers.error,
    //                         errorCode: resultAddWorkers.errorCode,
    //                     }
    //                 }
    //             },
    //         })
    //     } catch (error) {
    //         return getErrorMessage(error)
    //     }
    // }

    // const _addWorkers = async (workersData: []): Promise<CustomResponse<undefined>> => {
    //     try {
    //         const lastElement = workersData[workersData.length - 1] as string[]
    //         const _workersData = lastElement?.length === 1 && !!!lastElement[0] ? workersData.slice(0, -1) : workersData // remove the last blank line if exists.

    //         const workers = _workersData.map((data) => {
    //             const name = data[0]

    //             if (!name) {
    //                 throw {
    //                     error: '作業員の名前が存在しません',
    //                     errorCode: 'NOT_ENOUGH_DATA',
    //                 }
    //             }

    //             const validatedData = _workerDataValidator(data as string[])

    //             return {
    //                 name,
    //                 ...validatedData,
    //                 companyRole: [validatedData.companyRole],
    //             }
    //         })

    //         const promises = workers?.map(async (worker, index) => {
    //             return await _writeMyCompanyWorker(worker)
    //         })

    //         const results = await Promise.all(promises)

    //         results.forEach((result) => {
    //             if (result.error) {
    //                 throw {
    //                     error: result.error,
    //                     errorCode: result.errorCode,
    //                 }
    //             }
    //         })

    //         return Promise.resolve({
    //             success: undefined,
    //         })
    //     } catch (error) {
    //         return getErrorMessage(error)
    //     }
    // }

    // const _workerDataValidator = (data: string[]) => {
    //     const companyRole = data[1]?.trim() === '一般作業員' || data[1]?.trim() === '管理者' ? data[1].trim() : '一般作業員'
    //     const offDaysOfWeek = _getOffDaysOfWeek(data[2])
    //     const phoneNumber = data[3]
    //     const isOfficeWorker = _getIsOfficeWorker(data[4], companyRole)

    //     return { companyRole, offDaysOfWeek, phoneNumber, isOfficeWorker }
    // }

    // const _getOffDaysOfWeek = (days: string): string[] => {
    //     if (!days) {
    //         return ['土', '日', '祝']
    //     }

    //     const _days = days.split('')
    //     const offDays = _days
    //         .map((day) => {
    //             return day && weekDayList.includes(day) ? day : undefined
    //         })
    //         .filter((data) => data !== undefined) as string[]

    //     return offDays.length > 0 ? offDays : ['土', '日', '祝']
    // }

    // const _getIsOfficeWorker = (data: string, role: string): boolean => {
    //     if (data === '手配可') {
    //         return false
    //     }
    //     if (data === '手配不可') {
    //         return true
    //     }
    //     if (role === '一般作業員') {
    //         return false
    //     }
    //     if (role === '管理者') {
    //         return true
    //     }
    //     return false
    // }

    const _footer = () => {
        return (
            <View
                style={{
                    alignItems: 'center',
                    padding: 15,
                    flex: 1,
                }}>
                <AppButton
                    style={{
                        flex: 1,
                        width: WINDOW_WIDTH - 20,
                    }}
                    title={t('admin:AddWorkers')}
                    onPress={() => {
                        navigation.push('AddMyWorker', {})
                    }}
                />
                <AppButton
                    isGray={true}
                    style={{
                        flex: 1,
                        marginTop: 15,
                        width: WINDOW_WIDTH - 20,
                    }}
                    title={t('admin:CopyAllInvitationURLs')}
                    onPress={() => {
                        _copyAllUnregisteredWorkersInvitationURLs()
                    }}
                />
                {/* <AppButton
                    isGray={true}
                    style={{
                        marginTop: 15,
                        width: WINDOW_WIDTH - 20,
                    }}
                    title={t('admin:AddWorkersFromCSV')}
                    onPress={async () => {
                        await _addWorkersFromCSV()
                    }}
                /> */}
                <BottomMargin />
            </View>
        )
    }

    const _onRefresh = async () => {
        setState((prev) => ({ ...prev, refreshing: true }))
    }

    const listKey = useMemo(() => getUuidv4(), [])

    return (
        <>
            <View style={{ backgroundColor: '#fff' }}>
                <Search
                    style={{ marginTop: 8, marginBottom: 0, marginHorizontal: 10 }}
                    text={textFilter}
                    title={t('common:SearchByWorkerName')}
                    onChange={setTextFilter}
                    clearText={() => setTextFilter(undefined)}
                    placeholder={t('common:SearchByWorkerName')}
                    onBlur={undefined}
                />
            </View>
            <FlatList
                style={{
                    flex: 1,
                    backgroundColor: '#fff',
                }}
                listKey={listKey}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={_onRefresh}
                        progressViewOffset={-500} //not displaying progress indicator (android only)
                    />
                }
                data={displayWorkers
                    ?.sort((a, b) => -companyRoleToNum(a.companyRole) + companyRoleToNum(b.companyRole))
                    .sort((a, b) => -workerLeftDateToNum(a.leftDate) + workerLeftDateToNum(b.leftDate))}
                keyExtractor={(item, index) => index.toString()}
                renderItem={_content}
                extraData={displayWorkers}
                ListEmptyComponent={<EmptyScreen text={t('admin:InHouseWorkersNotExist')} />}
                ListHeaderComponent={_header}
                ListFooterComponent={_footer}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
            />
        </>
    )
}
export default MyCompanyWorkerList

const styles = StyleSheet.create({})
