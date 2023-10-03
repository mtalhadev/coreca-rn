import { RouteProp, useNavigation, useRoute, useIsFocused } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import flatten from 'lodash/flatten'
import uniqBy from 'lodash/uniqBy'
import React, { useState, useEffect, useMemo } from 'react'
import { Alert, AppState } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import ArrangementManage, { SiteManageSetting } from '../../../../components/template/ArrangementManage'
import { _addInvReservationLocalInsideWorker, _deleteInvReservationLocalInsideWorker } from '../../../../components/template/ArrangementManageUtils'
import { useTextTranslation } from '../../../../fooks/useTextTranslation'
import { useSafeUnmount, useSafeLoadingUnmount } from '../../../../fooks/useUnmount'
import { SiteArrangementDataType, SiteArrangementWorkerType } from '../../../../models/arrangement/SiteArrangementDataType'
import { InvReservationType } from '../../../../models/invReservation/InvReservation'
import { RequestMeterType } from '../../../../models/request/RequestMeterType'
import { SiteMeterType } from '../../../../models/site/SiteMeterType'
import { UpdateScreenType } from '../../../../models/updateScreens/UpdateScreens'
import { ArrangementWorkerType } from '../../../../models/worker/ArrangementWorkerListType'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { getErrorMessage, getErrorToastMessage } from '../../../../services/_others/ErrorService'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'
import { StoreType } from '../../../../stores/Store'
import { setToastMessage, ToastMessage, setLocalUpdateScreens, setLoading } from '../../../../stores/UtilSlice'
import { getArrangementDataOfTargetInvReservation, makeInvReservationNotifications, setSiteCertainInTargetInvRequests } from '../../../../usecases/arrangement/SiteArrangementCase'
import { checkMyDepartment } from '../../../../usecases/department/DepartmentCase'
import { setInvRequestsArrangement, setInvRequestsApplication } from '../../../../usecases/invRequest/InvRequestArrangementCase'
import { checkLockOfTarget, updateLockOfTarget } from '../../../../usecases/lock/CommonLockCase'
import { LOCK_INTERVAL_TIME } from '../../../../utils/Constants'
import { RootStackParamList } from '../../../Router'

type NavProps = StackNavigationProp<RootStackParamList, 'InvReservationArrangementManage'>
type RouteProps = RouteProp<RootStackParamList, 'InvReservationArrangementManage'>

type InitialStateType = {
    localUpdate: number

    // UI表示用の手配数
    localPresentNum?: number

    setting?: SiteManageSetting
    targetMeter?: SiteMeterType | RequestMeterType
    cantManage?: boolean
    invReservation?: InvReservationType
    invReservationArrangementData?: SiteArrangementDataType

    // Diff用
    updateArrangementDetail: number

    //申請のまとめて手配にて
    isBundleArrange?: boolean //手配反映
    isBundleConfirmed?: boolean
}

const initialState: InitialStateType = {
    localUpdate: 0,
    isBundleArrange: false,
    updateArrangementDetail: 0,
}

const InvReservationArrangementManage = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()

    const [{ localUpdate, cantManage, localPresentNum, setting, invReservation, invReservationArrangementData, targetMeter, isBundleArrange, isBundleConfirmed, updateArrangementDetail }, setState] =
        useState(initialState)

    useSafeUnmount(setState, initialState)

    const dispatch = useDispatch()
    const myCompanyId = useSelector((state: StoreType) => state.account?.belongCompanyId)
    const myWorkerId = useSelector((state: StoreType) => state.account.signInUser?.workerId)
    const signInUser = useSelector((state: StoreType) => state.account?.signInUser)
    const loading = useSelector((state: StoreType) => state.util.loading)
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const localUpdateScreens = useSelector((state: StoreType) => state?.util?.localUpdateScreens)
    const activeDepartments = useSelector((state: StoreType) => state.account.activeDepartments)
    const activeDepartmentIds = useMemo(() => activeDepartments?.map((dep) => dep?.departmentId).filter((data) => data != undefined) as string[], [activeDepartments])
    /**
     * requestIdは使わない。代わりにrespondRequestIdを使用する。
     */
    const invReservationId = route.params?.invReservationId

    const isFocused = useIsFocused()
    const [appState, setAppState] = useState(AppState.currentState)

    /**
     * Hiruma
     * isFocusedで取得しないように。
     */
    useEffect(() => {
        if (isFocused) {
            setState((prev) => ({ ...prev, localUpdate: localUpdate + 1 }))
        }
    }, [isFocused])

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            setState((prev) => ({ ...prev, localUpdate: localUpdate + 1 }))
        }
    }, [isNavUpdating])

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        return () => setState(initialState)
    }, [myCompanyId])

    useEffect(() => {
        if (invReservationId) {
            navigation.setOptions({
                title: t('admin:ArrangementsToSendInSupport'),
            })
        }
    }, [navigation])

    useEffect(() => {
        if (invReservationId && myWorkerId && appState == 'active' && isFocused && !cantManage) {
            ;(async () => {
                try {
                    const lockResult = await checkLockOfTarget({
                        myWorkerId: myWorkerId ?? 'no-id',
                        targetId: invReservationId ?? 'no-id',
                        modelType: 'invReservation',
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
                        myWorkerId: myWorkerId ?? 'no-id',
                        targetId: invReservationId ?? 'no-id',
                        modelType: 'invReservation',
                    })
                    return _update
                })(),
                LOCK_INTERVAL_TIME,
            )
            return () => {
                clearInterval(keepLock)
                updateLockOfTarget({
                    myWorkerId: myWorkerId ?? 'no-id',
                    targetId: invReservationId ?? 'no-id',
                    modelType: 'invReservation',
                    unlock: true,
                })
            }
        }
    }, [invReservationId, myWorkerId, appState, isFocused, cantManage])

    useEffect(() => {
        const appState = AppState.addEventListener('change', setAppState)
        return () => {
            appState.remove()
        }
    }, [])

    /**
     * 他の手配とは結構違い、エラーハンドリングがだいぶ少ないためここで固有に定義
     */
    const _onPressAtPostSelfContent = (item: SiteArrangementWorkerType): Promise<CustomResponse> => {
        /**
         * 自分の部署以外の作業員かどうかを判別する
         */
        const isDifferentDepartment = !(
            item.worker?.invRequestId != undefined ||
            checkMyDepartment({
                targetDepartmentIds: item.worker?.departmentIds,
                activeDepartmentIds,
            })
        )
        if (isDifferentDepartment) {
            throw {
                error: t('admin:TheWorkerIsInAnotherDepartmentPleaseSwitchDepartments'),
                errorCode: 'PRESS_POST_SELF_ERROR',
                type: 'error',
            }
        }
        if (item.worker?.workerId && invReservationArrangementData && (targetMeter || invReservationArrangementData)) {
            /**
             * deepCloneが重くて、依頼数をオーバーすることを防ぐ。
             */
            setState((prev) => ({
                ...prev,
                localPresentNum: Math.max(0, (localPresentNum ?? 0) - 1),
            }))
            if (invReservationArrangementData && targetMeter) {
                item = _deleteInvReservationLocalInsideWorker(item, targetMeter)
            }
        }
        return Promise.resolve({ success: true })
    }

    /**
     * 他の手配とは結構違い、エラーハンドリングがだいぶ少ないためここで固有に定義
     */
    const _onPressAtPreSelfContent = async (item: SiteArrangementWorkerType, arrangeCount: number): Promise<CustomResponse> => {
        try {
            if (arrangeCount <= 0 && invReservationArrangementData && item?.worker?.workerId && (targetMeter || invReservationArrangementData) && localPresentNum != undefined) {
                if (item.worker.companyId != undefined && invReservation?.targetCompanyId == item.worker.companyId) {
                    throw {
                        error: t('admin:ArrangementsCannotBeMadeWithTheSourceOfTheSupportApplication'),
                        type: 'warn',
                    }
                }
                /**
                 * deepCloneが重くて、依頼数をオーバーすることを防ぐ。
                 */
                setState((prev) => ({
                    ...prev,
                    localPresentNum: (localPresentNum ?? 0) + 1,
                }))
                if (invReservationArrangementData && invReservationId && targetMeter) {
                    item = _addInvReservationLocalInsideWorker(item, item?.worker?.workerId, invReservationId, targetMeter)
                }
            }
            return Promise.resolve({ success: true })
        } catch (error) {
            return getErrorMessage(error)
        }
    }
    useEffect(() => {
        ;(async () => {
            try {
                if (invReservationId == undefined || signInUser == undefined || myCompanyId == undefined || signInUser.workerId == undefined) {
                    return
                }
                if (loading == false) {
                    if (invReservationArrangementData && !isNavUpdating) {
                        dispatch(setLoading(true))
                    } else {
                        if (isFocused) {
                            dispatch(setLoading(true))
                        }
                    }
                }

                if (invReservationId) {
                    //TODO:できれば、期間内全てに申請手配されている作業員がいるならその人も表示したい。その場合は、setInvRequestsArrangementのinvRequestWorkersとdepartmentsFilterも要変更
                    const result = await getArrangementDataOfTargetInvReservation({
                        invReservationId,
                        myCompanyId,
                    })
                    if (result.error) {
                        throw {
                            error: result.error,
                        }
                    }
                    setState((prev) => ({
                        ...prev,
                        invReservation: result.success?.invReservation,
                        invReservationArrangementData: result.success?.invReservationArrangementData,
                        targetMeter: result.success?.targetMeter,
                        // localPresentNum: 0,
                        localPresentNum: 0,
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
    }, [localUpdate])

    const __onError = (error: any) => {
        const _error = error as CustomResponse
        if (__DEV__) {
            console.log('error', _error.error, 'errorCode', _error.errorCode)
        }
        dispatch(
            setToastMessage({
                text: getErrorToastMessage(_error),
                type: 'error',
            } as ToastMessage),
        )
        if (isFocused) dispatch(setLoading(true))
        setState((prev) => ({ ...prev, localUpdate: localUpdate + 1, continuityIndex: 0, continuityCompanyId: undefined, updateArrangementDetail: updateArrangementDetail + 1 }))
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

    useMemo(() => {
        if (invReservationId) {
            const _setting: SiteManageSetting = {
                hideMeter: false,
                hideArrangeableWorkers: invReservation?.myCompanyId == myCompanyId ? false : true,
                hideCopyHistory: true,
                // perspective?: "my-company" | "other-company" | undefined;
                displayNothing: false,
            }
            setState((prev) => ({
                ...prev,
                setting: _setting,
                cantManage: _setting?.hideArrangeableWorkers == true || _setting?.displayNothing == true || _setting == undefined,
            }))
        }
    }, [invReservationArrangementData])

    /**
     * 確定ボタンを押したら発火。
     * その時の状況により、何を確定するか分岐する。
     * template化したら、各々のscreensで必要なものだけになるので簡略化される
     */
    const _setCertain = async () => {
        if (invReservation?.targetCompany?.isFake && isBundleArrange) {
            //仮会社へ送る場合は、すでに申請が全て通っているので、まとめて現場確定
            Alert.alert(t('admin:DoYouWantToFinalizeAndNotifyTheSiteInBulk'), undefined, [
                { text: t('common:FinalizeAndNotif'), onPress: () => _setFakeSitesCertain() },
                {
                    text: t('common:Cancel'),
                    style: 'cancel',
                },
            ])
        } else if (invReservation && isBundleArrange) {
            //まとめて申請手配反映済み
            Alert.alert(t('admin:DoYouWantToFinalizeAndApplyForArrangementsForTheDateToBeSentWithAllSupport'), undefined, [
                {
                    text: t('common:FinalizeAndFileAnApplication'),
                    onPress: () => {
                        _setInvRequestsCertain()
                    },
                },
                {
                    text: t('common:Cancel'),
                    style: 'cancel',
                },
            ])
        } else if (invReservation && !isBundleArrange) {
            //まとめて申請手配未反映
            Alert.alert(t('admin:ReflectsTheArrangementOnTheDayItIsSentWithUnarrangedSupport'), undefined, [
                { text: t('admin:ReflectsTheArrangementOnTheDayItIsSentWithUnarrangedSupport'), onPress: () => _setInvRequestsApply() },
                {
                    text: t('common:Cancel'),
                    style: 'cancel',
                },
            ])
        }
    }

    /**
     * まとめて常用で送る手配を反映
     */
    const _setInvRequestsApply = async () => {
        try {
            if (loading) {
                __onInvisibleLoad()
                return
            }
            dispatch(setLoading('unTouchable'))
            const lockResult = await checkLockOfTarget({
                myWorkerId: myWorkerId ?? 'no-id',
                targetId: invReservationId ?? 'no-id',
                modelType: 'invReservation',
            })
            if (lockResult.error) {
                if (isFocused) dispatch(setLoading(false))
                throw {
                    error: lockResult.error,
                }
            }
            const result = await setInvRequestsArrangement({
                invRequestIds: invReservation?.invRequestIds,
                myWorkerId,
                workerIds: invReservationArrangementData?.selfSide
                    ?.filter((side) => side.targetInvRequest?.invRequestId == invReservationId)
                    .map((worker) => worker.worker?.workerId)
                    .filter((data) => data != undefined) as string[],
                workers: invReservationArrangementData?.selfSide
                    ?.filter((side) => side.targetInvRequest?.invRequestId == invReservationId)
                    .map((worker) => worker.worker)
                    .filter((data) => data != undefined) as ArrangementWorkerType[],
                myCompanyId,
            })

            if (isFocused) {
                dispatch(setLoading(false))
            }
            if (result.error) {
                throw {
                    error: result.error,
                }
            }
            const newLocalUpdateScreens: UpdateScreenType[] = [
                {
                    screenName: 'InvRequestDetail',
                    ids: [...flatten(localUpdateScreens.filter((screen) => screen.screenName == 'InvRequestDetail').map((screen) => screen.ids)), ...(invReservation?.invRequestIds ?? [])]?.filter(
                        (data) => data != undefined,
                    ) as string[],
                },
            ]
            dispatch(setLocalUpdateScreens(uniqBy([...newLocalUpdateScreens, ...localUpdateScreens], 'screenName')))
            setState((prev) => ({ ...prev, isBundleArrange: true }))
            dispatch(
                setToastMessage({
                    text: t('common:ArrangementsReflected'),
                    type: 'success',
                } as ToastMessage),
            )
            if (invReservation?.targetCompany?.isFake) {
                Alert.alert(t('admin:DoYouWantToFinalizeAndNotifyTheSiteInBulk'), undefined, [
                    { text: t('common:FinalizeAndNotif'), onPress: () => _setFakeSitesCertain() },
                    {
                        text: t('common:Cancel'),
                        style: 'cancel',
                    },
                ])
            } else {
                Alert.alert(t('admin:DoYouWantToFinalizeAndApplyForArrangementsForTheDateToBeSentWithAllSupport'), undefined, [
                    {
                        text: t('common:FinalizeAndFileAnApplication'),
                        onPress: () => {
                            _setInvRequestsCertain()
                        },
                    },
                    {
                        text: t('common:Cancel'),
                        style: 'cancel',
                    },
                ])
            }
        } catch (error) {
            __onError(error)
        }
    }

    /**
     * まとめて常用で送る常用を申請
     */
    const _setInvRequestsCertain = async () => {
        try {
            if (loading) {
                __onInvisibleLoad()
                return
            }
            dispatch(setLoading('unTouchable'))
            const lockResult = await checkLockOfTarget({
                myWorkerId: myWorkerId ?? 'no-id',
                targetId: invReservationId ?? 'no-id',
                modelType: 'invReservation',
            })
            if (lockResult.error) {
                if (isFocused) dispatch(setLoading(false))
                throw {
                    error: lockResult.error,
                }
            }
            const result = await setInvRequestsApplication({
                invRequestIds: invReservation?.invRequestIds,
                myCompanyId,
            })

            await makeInvReservationNotifications(invReservation)
            if (isFocused) {
                dispatch(setLoading(false))
            }
            if (result.error) {
                throw {
                    error: result.error,
                }
            }
            const newLocalUpdateScreens: UpdateScreenType[] = [
                {
                    screenName: 'InvRequestDetail',
                    ids: [...flatten(localUpdateScreens.filter((screen) => screen.screenName == 'InvRequestDetail').map((screen) => screen.ids)), ...(invReservation?.invRequestIds ?? [])]?.filter(
                        (data) => data != undefined,
                    ) as string[],
                },
            ]
            dispatch(setLocalUpdateScreens(uniqBy([...newLocalUpdateScreens, ...localUpdateScreens], 'screenName')))
            setState((prev) => ({ ...prev, isBundleConfirmed: true }))
            dispatch(
                setToastMessage({
                    text: t('common:FinalizedAndFiled'),
                    type: 'success',
                } as ToastMessage),
            )
            navigation.goBack()
        } catch (error) {
            __onError(error)
        }
    }

    /**
     * 仮会社への常用で送る
     * まとめて現場を確定
     */
    const _setFakeSitesCertain = async () => {
        try {
            if (loading) {
                __onInvisibleLoad()
                return
            }
            dispatch(setLoading('unTouchable'))
            const lockResult = await checkLockOfTarget({
                myWorkerId: myWorkerId ?? 'no-id',
                targetId: invReservationId ?? 'no-id',
                modelType: 'invReservation',
            })
            if (lockResult.error) {
                if (isFocused) dispatch(setLoading(false))
                throw {
                    error: lockResult.error,
                }
            }
            const result = await setSiteCertainInTargetInvRequests({
                invRequestIds: invReservation?.invRequestIds,
                myCompanyId,
                signInUser,
                invReservationId,
            })

            //上の関数内で通知しているので不要
            // await makeInvReservationNotifications(invReservation)
            if (isFocused) {
                dispatch(setLoading(false))
            }
            if (result.error) {
                throw {
                    error: result.error,
                }
            }
            const newLocalUpdateScreens: UpdateScreenType[] = [
                {
                    screenName: 'InvRequestDetail',
                    ids: [...flatten(localUpdateScreens.filter((screen) => screen.screenName == 'InvRequestDetail').map((screen) => screen.ids)), ...(invReservation?.invRequestIds ?? [])]?.filter(
                        (data) => data != undefined,
                    ) as string[],
                },
            ]
            dispatch(setLocalUpdateScreens(uniqBy([...newLocalUpdateScreens, ...localUpdateScreens], 'screenName')))
            setState((prev) => ({ ...prev, isBundleConfirmed: true }))
            dispatch(
                setToastMessage({
                    text: t('common:FinalizedAndFiled'),
                    type: 'success',
                } as ToastMessage),
            )
            navigation.goBack()
        } catch (error) {
            __onError(error)
        }
    }

    return (
        <ArrangementManage
            localUpdate={localUpdate}
            setting={setting}
            invReservation={invReservation}
            arrangementData={invReservationArrangementData}
            isBundleArrange={isBundleArrange}
            isBundleConfirmed={isBundleConfirmed}
            invReservationId={invReservationId}
            cantManage={cantManage}
            /**
             * bottomシート
             */
            bottomOnClose={() => setState((prev) => ({ ...prev, updateArrangementDetail: updateArrangementDetail + 1 }))}
            /**
             * 関数系
             */
            _setCertain={_setCertain}
            navigation={navigation}
            myWorkerId={myWorkerId}
            _onPressAtPostSelfContent={_onPressAtPostSelfContent}
            _onPressAtPreSelfContent={_onPressAtPreSelfContent}
            updateArrangementDetail={updateArrangementDetail}
            isDraft={true}
        />
    )
}
export default InvReservationArrangementManage
