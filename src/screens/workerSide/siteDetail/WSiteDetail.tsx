/* eslint-disable indent */
import React, { useState, useEffect, useContext } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, View, StyleSheet, ViewStyle } from 'react-native'
import { useNavigation, useRoute, RouteProp, useIsFocused } from '@react-navigation/core'
import { StackNavigationProp } from '@react-navigation/stack'
import isEmpty from 'lodash/isEmpty'
import { BottomMargin } from '../../../components/atoms/BottomMargin'
import { TableArea } from '../../../components/atoms/TableArea'
import { CompanyCL } from '../../../components/organisms/company/CompanyCL'
import { AddressMap } from '../../../components/organisms/AddressMap'
import { ShadowBoxWithHeader } from '../../../components/organisms/shadowBox/ShadowBoxWithHeader'
import { SiteHeaderCL } from '../../../components/organisms/site/SiteHeaderCL'
import { WorkerInfoType, WorkerInfo } from '../../../components/organisms/worker/WorkerInfo'
import { SiteCLType } from '../../../models/site/Site'
import { WorkerCLType } from '../../../models/worker/Worker'
import { StoreType } from '../../../stores/Store'
import { setLoading, setToastMessage, ToastMessage } from '../../../stores/UtilSlice'
import { getWSiteDetail } from '../../../usecases/site/MySiteCase'
import { CustomResponse } from '../../../models/_others/CustomResponse'
import { GlobalStyles } from '../../../utils/Styles'
import { WSiteRouterContext } from './WSiteRouter'
import { RootStackParamList } from '../../Router'
import { Line } from '../../../components/atoms/Line'
import { WorkerCL } from '../../../components/organisms/worker/WorkerCL'
import { AttendanceCLType } from '../../../models/attendance/Attendance'
import { Attendance } from '../../../components/organisms/attendance/Attendance'
import { getErrorToastMessage } from '../../../services/_others/ErrorService'
import { updateCachedData, getCachedData, genKeyName } from '../../../usecases/CachedDataCase'
import { getTextBetweenAnotherDate, isTodayOrBefore, timeBaseText } from '../../../models/_others/CustomDate'
import { ScrollViewInstead } from '../../../components/atoms/ScrollViewInstead'
import { useSafeLoadingUnmount, useSafeUnmount } from '../../../fooks/useUnmount'
import { setIsNavUpdating } from '../../../stores/NavigationSlice'
import { deleteParamOfUpdateScreens, checkUpdateOfTargetScreen } from '../../../usecases/updateScreens/CommonUpdateScreensCase'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
// import { createLogger } from '../../../services/_others/LoggerServiceNative' // for log rerendering
type NavProps = StackNavigationProp<RootStackParamList, 'WSiteDetail'>
type RouteProps = RouteProp<RootStackParamList, 'WSiteDetail'>

type InitialStateType = {
    id?: string
    site?: SiteCLType
    attendances?: AttendanceCLType[]
    isFetching: boolean
    updateCache: number
}

export type WorkerUIWithInfoType = WorkerCLType & WorkerInfoType

const initialState: InitialStateType = {
    isFetching: false,
    updateCache: 0,
}

// const logger = createLogger() // for log rerendering

/**
 *
 * @returns requestIdがあると常用依頼詳細画面になる。
 */
const WSiteDetail = () => {
    const { t, i18n } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()

    const [{ id, site, isFetching, attendances, updateCache }, setState] = useState(initialState)
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
    const { siteId, update } = useContext(WSiteRouterContext)

    const myCompanyId = useSelector((state: StoreType) => state.account?.belongCompanyId)
    const signInUser = useSelector((state: StoreType) => state.account?.signInUser)
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const accountId = signInUser?.accountId ?? ''
    const cachedWSiteDetailKey = genKeyName({ screenName: 'WSiteDetail', accountId: accountId, siteId: siteId ?? '', companyId: myCompanyId ?? '', workerId: signInUser?.workerId ?? '' })

    const editable = startDate ? isTodayOrBefore(startDate) : false

    useSafeUnmount(setState, initialState)

    useEffect(() => {
        if (isFocused) {
            // __DEV__ && logger.logAccessInfo('Focus取得時の副作用フック（localUpdate＆updateCache更新）')
            setState((prev) => ({ ...prev, updateCache: updateCache + 1, isFetching: true }))

            /**
             * 作成編集削除により、キャッシュと表示内容が異なる場合にDBフェッチ
             */
            ;(async () => {
                const isUpdateResult = await checkUpdateOfTargetScreen({ targetId: id ?? siteId, accountId: signInUser?.accountId, targetScreenName: 'WSiteDetail' })
                if (isUpdateResult.success) {
                    dispatch(setIsNavUpdating(true))
                }
            })()
        }
    }, [isFocused, id, signInUser, myCompanyId, update])

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            setState((prev) => ({ ...prev, isFetching: true }))
        }
    }, [isNavUpdating])

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        if (siteId) {
            // __DEV__ && logger.logAccessInfo('mount時の副作用フック（siteIdステート更新）')
            // __DEV__ && console.log(`siteId: ${siteId}`)
            setState((prev) => ({ ...prev, id: siteId }))
        }
    }, [siteId])

    useEffect(() => {
        if (signInUser) {
            // __DEV__ && logger.logAccessInfo('signInUser変化時の副作用フック（ステート全体の初期化）')
            return () => setState(initialState)
        }
    }, [signInUser])

    useEffect(() => {
        ;(async () => {
            try {
                if (!id || isEmpty(siteId) || isEmpty(myCompanyId) || isEmpty(signInUser) || isFetching != true) {
                    return
                }
                // __DEV__ && logger.logAccessWarning('id, signInUser, myCompanyId, update, localUpdate変化時の副作用フック（フェッチ実行＆キャッシュ更新）')
                // __DEV__ && console.log(`{`)
                // __DEV__ && console.log(`  id: ${id}`)
                // __DEV__ && console.log(`  signInUser: ${signInUser?.workerId}`)
                // __DEV__ && console.log(`  myCompanyId: ${myCompanyId}`)
                // __DEV__ && console.log(`  update: ${update}, isFetching: ${isFetching}`)
                // __DEV__ && console.log('  key: ' + cachedWSiteDetailKey)
                // __DEV__ && console.log(`}`)
                if (isFocused) dispatch(setLoading(true))
                // __DEV__ && logger.anchor()
                const siteResult = await getWSiteDetail({
                    siteId: siteId,
                    myCompanyId,
                    myWorkerId: signInUser?.workerId,
                })
                // __DEV__ && logger.logPerformance( {place: 'getWSiteDetail'} )
                if (siteResult.error || siteResult.success == undefined) {
                    throw {
                        error: siteResult.error,
                    }
                }
                /**
                 * キャッシュアップデート前に先に表示データを更新。
                 */
                setState((prev) => ({ ...prev, site: siteResult.success?.site, attendances: siteResult.success?.attendances }))
                await deleteParamOfUpdateScreens({
                    accountId,
                    screenName: 'WSiteDetail',
                    id,
                    paramName: 'ids',
                })
                // __DEV__ && logger.anchor()
                const cachedResult = await updateCachedData({ key: cachedWSiteDetailKey, value: siteResult.success?.attendances ?? [] })
                // __DEV__ && logger.logPerformance( {place: 'updateCachedData'} )
                if (cachedResult.error) {
                    dispatch(
                        setToastMessage({
                            text: cachedResult.error,
                            type: 'error',
                        }),
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
     * @summary updateCacheフラグ更新時の副作用フック（KVSから表示データを取得更新）
     * @purpose アプリ側にKVSによるキャッシュを設けて一覧の初期表示速度を改善する
     * @author Okuda
     */
    useEffect(() => {
        ;(async () => {
            if (updateCache) {
                // __DEV__ && logger.anchor()
                const result = await getCachedData<AttendanceCLType[]>(cachedWSiteDetailKey)
                // __DEV__ && logger.logPerformance( {place: 'getCachedData'} )
                if (result.error) {
                    // __DEV__ && console.log('キャッシュなし')
                    if (result.errorCode != 'FIRST_FETCH') {
                        dispatch(
                            setToastMessage({
                                text: result.error,
                                type: 'error',
                            }),
                        )
                    }
                    //siteの詳細が取れないので、キャッシュがあってもDBフェッチ
                    // setState((prev) => ({ ...prev, isFetching: true }))
                } else {
                    setState((prev) => ({ ...prev, attendances: result.success }))
                }
            }
        })()
    }, [updateCache])

    // __DEV__ && logger.logAccessInfo('Rerendering')

    return (
        <ScrollViewInstead
            style={{
                flex: 1,
                backgroundColor: '#fff',
            }}>
            {site != undefined && (
                <>
                    <SiteHeaderCL
                        style={{
                            marginHorizontal: 10,
                            marginTop: 15,
                        }}
                        displayDay
                        displayMeter={false}
                        titleStyle={
                            {
                                ...GlobalStyles.smallGrayText,
                            } as ViewStyle
                        }
                        displaySitePrefix={false}
                        siteNameStyle={
                            {
                                ...GlobalStyles.boldText,
                            } as ViewStyle
                        }
                        site={{ ...site }}
                    />

                    <Line
                        style={{
                            marginTop: 15,
                            marginHorizontal: 10,
                        }}
                    />
                    <TableArea
                        style={{
                            margin: 10,
                            marginTop: 15,
                        }}
                        columns={[
                            { key: '集合時間', content: meetingDate ? timeBaseText(meetingDate) : '未定' },
                            { key: '作業開始', content: startDate ? getTextBetweenAnotherDate(startDate, endDate) : undefined },
                            { key: '持ち物', content: belongings },
                            { key: '備考', content: remarks },
                        ]}
                    />
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
                    {managerWorker != undefined && (
                        <ShadowBoxWithHeader
                            style={{
                                marginHorizontal: 10,
                                marginTop: 10,
                            }}
                            title={t('worker:PersonInchargeLine')}>
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
                                {managerWorker.name == undefined && <Text style={[GlobalStyles.smallText]}>現場責任者がいません。</Text>}
                            </>
                        </ShadowBoxWithHeader>
                    )}

                    {construction?.constructionRelation != 'other-company' && siteCompanies?.managerCompany != undefined && (
                        <ShadowBoxWithHeader
                            style={{
                                marginHorizontal: 10,
                                marginTop: 10,
                            }}
                            title={t('worker:constructionCompany')}>
                            <CompanyCL
                                style={{
                                    flex: 1,
                                }}
                                displayCompanyPrefix={false}
                                company={siteCompanies?.managerCompany}
                            />
                        </ShadowBoxWithHeader>
                    )}
                    {(attendances?.length ?? 0) > 0 && (
                        <View>
                            <Line
                                style={{
                                    marginTop: 10,
                                }}
                            />
                            <Text
                                style={{
                                    ...GlobalStyles.mediumText,
                                    marginLeft: 10,
                                    marginTop: 15,
                                }}>
                                ■ あなたの勤怠
                            </Text>
                        </View>
                    )}
                    {attendances?.map((attendance) => (
                        <Attendance
                            key={attendance.attendanceId}
                            style={{
                                padding: 10,
                            }}
                            attendance={attendance}
                            canEdit={editable ? !attendance.isReported : false}
                            arrangement={attendance.arrangement}
                            side={'worker'}
                            withBorderLine
                            siteDate={site?.startDate}
                        />
                    ))}
                    <BottomMargin />
                </>
            )}
        </ScrollViewInstead>
    )
}
export default WSiteDetail

const styles = StyleSheet.create({})
