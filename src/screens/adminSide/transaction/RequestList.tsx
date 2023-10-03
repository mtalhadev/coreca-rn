/* eslint-disable indent */
import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { View, StyleSheet, ListRenderItem, ListRenderItemInfo } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { useIsFocused } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { BottomMargin } from '../../../components/atoms/BottomMargin'
import { StoreType } from '../../../stores/Store'
import { deleteParamOfLocalUpdateScreens, setLoading, setToastMessage, ToastMessage } from '../../../stores/UtilSlice'
import { CustomDate, getMonthlyFinalDay, getMonthlyFirstDay, monthBaseText, newCustomDate, toCustomDateFromTotalSeconds, YYYYMMDateType } from '../../../models/_others/CustomDate'
import { THEME_COLORS } from '../../../utils/Constants'
import { CustomResponse } from '../../../models/_others/CustomResponse'
import { RootStackParamList } from '../../Router'
import { IconParam } from '../../../components/organisms/IconParam'
import { SwitchPage } from '../../../components/template/SwitchPage'
import { getRequestConstructionListOfTargetCompanyAndMonth } from '../../../usecases/construction/ConstructionListCase'
import { SelectButton } from '../../../components/organisms/SelectButton'
import { ConstructionWithSites } from '../../../components/organisms/construction/ConstructionWithSites'
import { ConstructionType } from '../../../models/construction/Construction'
import cloneDeep from 'lodash/cloneDeep'
import sumBy from 'lodash/sumBy'
import { match } from 'ts-pattern'
import { RequestDirectionType } from '../../../components/organisms/request/Request'
import { updateCachedData, getCachedData, genKeyName } from '../../../usecases/CachedDataCase'
import { getErrorToastMessage } from '../../../services/_others/ErrorService'
import { useSafeUnmount, useSafeLoadingUnmount } from '../../../fooks/useUnmount'
import { setIsNavUpdating } from '../../../stores/NavigationSlice'
import { getUpdateScreenOfTargetAccountAndScreen, deleteParamOfUpdateScreens } from '../../../usecases/updateScreens/CommonUpdateScreensCase'
import { useTextTranslation } from './../../../fooks/useTextTranslation'

export type RequestDisplayType = RequestDirectionType | 'both'

type NavProps = StackNavigationProp<RootStackParamList, 'RequestList'>
type RouteProps = RouteProp<RootStackParamList, 'RequestList'>

type InitialStateType = {
    selectedMonth: CustomDate
    isFetching: boolean
    updateCache: number
    constructions?: RequestConstructionListUIType
    monthData?: ConstructionType[]
    displayType: RequestDisplayType
    updateMonths?: number[]
    /**
     * localUpdateScreensにより、updateScreens取得前に更新した日付
     */
    updatedMonths?: YYYYMMDateType[]
}

//
// todo: 外へ切り出してimportする（ConstructionListCase.tsxがよさそう）
//
export type RequestConstructionUIType = ConstructionType
type ConstructionListUIType = { [Month in string]: RequestConstructionUIType[] }

type _changeMonthDataProp = {
    types?: RequestDisplayType
    month?: CustomDate
    newConstructions?: RequestConstructionListUIType
}

//
// todo: 外へ切り出してimportする（ConstructionListCase.tsxがよさそう）
//TODO:月別DBフェッチ・キャッシュ化によって、フロント側で月別オブジェクトを保持する必要がなくなったので単純な配列にする。
// type RequestConstructionListUIType = {
export type RequestConstructionListUIType = {
    both: ConstructionListUIType
    order: ConstructionListUIType
    receive: ConstructionListUIType
}

const initialState: InitialStateType = {
    selectedMonth: newCustomDate(),
    isFetching: false,
    updateCache: 0,
    displayType: 'both',
    constructions: { both: {}, order: {}, receive: {} },
}

/**
 * 使用停止
 * @returns 常用一覧。
 */
const RequestList = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const loading = useSelector((state: StoreType) => state.util.loading)
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const accountId = useSelector((state: StoreType) => state.account.signInUser?.accountId ?? '')
    const [{ constructions, selectedMonth, isFetching, monthData, displayType, updateCache, updateMonths, updatedMonths }, setState] = useState(initialState)
    const dispatch = useDispatch()
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const localUpdateScreens = useSelector((state: StoreType) => state?.util?.localUpdateScreens)
    const cachedConstructionsKey = useRef(
        genKeyName({ screenName: 'RequestList', accountId: accountId, companyId: myCompanyId ?? '', month: selectedMonth ? monthBaseText(selectedMonth).replace(/\//g, '-') : '' }),
    )
    const [dateUpdate, setDateUpdate] = useState(0)
    useSafeUnmount(setState, initialState, () => setDateUpdate(dateUpdate + 1))

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            setState((prev) => ({ ...prev, isFetching: true }))
        }
    }, [isNavUpdating])

    useEffect(() => {
        if (isFocused) {
            ;(async () => {
                const updateResult = await getUpdateScreenOfTargetAccountAndScreen({
                    accountId,
                    screenName: 'RequestList',
                })
                const updateScreen = updateResult.success
                setState((prev) => ({ ...prev, updateMonths: updateScreen?.dates ?? [] }))
            })()
        }
    }, [isFocused])

    /**
     * 作成編集削除により、キャッシュと表示内容が異なる場合にDBフェッチ
     */
    useEffect(() => {
        ;(async () => {
            if (selectedMonth && isFocused) {
                const LocalTargetScreen = localUpdateScreens.filter((screen) => screen.screenName == 'RequestList')[0]
                const localTargetMonths = LocalTargetScreen?.dates?.filter(
                    (_date: number) => _date >= getMonthlyFirstDay(selectedMonth).totalSeconds && _date <= getMonthlyFinalDay(selectedMonth).totalSeconds,
                )
                if (localTargetMonths && localTargetMonths.length > 0) {
                    /**
                     * 作成編集者本人はUpdateScreensが更新される前に遷移するため、Storeで対応
                     */
                    dispatch(setIsNavUpdating(true))
                    setState((prev) => ({ ...prev, updatedMonths: [...(updatedMonths ?? []), monthBaseText(selectedMonth)] }))
                } else {
                    const targetMonths = updateMonths?.filter(
                        (_date) =>
                            _date >= getMonthlyFirstDay(selectedMonth).totalSeconds &&
                            _date <= getMonthlyFinalDay(selectedMonth).totalSeconds &&
                            !updatedMonths?.includes(monthBaseText(toCustomDateFromTotalSeconds(_date))),
                    )
                    if (targetMonths && targetMonths?.length > 0) {
                        dispatch(setIsNavUpdating(true))
                        setState((prev) => ({ ...prev, updatedMonths: [...(updatedMonths ?? []), monthBaseText(selectedMonth)] }))
                    }
                }
            }
        })()
    }, [selectedMonth, updateMonths])

    useEffect(() => {
        if (myCompanyId && selectedMonth) {
            // __DEV__ && logger.logAccessInfo('\n2. キャッシュキー生成の副作用フック')
            // __DEV__ && console.log('\n2-1. キャッシュキーを更新: '+ (selectedMonth? monthBaseText(selectedMonth).replace(/\//g, '-') : '') + '\n')
            cachedConstructionsKey.current = genKeyName({
                screenName: 'RequestList',
                accountId: accountId,
                companyId: myCompanyId,
                /** "/" はKVSのキーに使えない文字のため "-" に変換 */
                month: selectedMonth ? monthBaseText(selectedMonth).replace(/\//g, '-') : '',
            })
        }
    }, [myCompanyId, selectedMonth])

    const headerInfos = useMemo(() => {
        const orderPreNum =
            sumBy(
                monthData?.map((construction) =>
                    sumBy(
                        construction?.sites?.items?.map((site) =>
                            sumBy(site.allRequests?.items?.filter((request) => request.companyId == myCompanyId).map((request) => request.requestMeter?.companyRequiredNum)),
                        ),
                    ),
                ),
            ) ?? 0

        const orderNum =
            sumBy(
                monthData?.map((construction) =>
                    sumBy(
                        construction?.sites?.items?.map((site) =>
                            sumBy(
                                site.allRequests?.items
                                    ?.filter((request) => request.companyId == myCompanyId)
                                    .map((request) => (request.requestedCompany?.isFake ? request.requestMeter?.companyRequiredNum : request.requestMeter?.companyPresentNum)),
                            ),
                        ),
                    ),
                ),
            ) ?? 0
        const receivePreNum =
            sumBy(
                monthData?.map((construction) =>
                    sumBy(
                        construction?.sites?.items?.map((site) =>
                            sumBy(site.allRequests?.items?.filter((request) => request.requestedCompanyId == myCompanyId  && request?.isApplication == true).map((request) => request.requestMeter?.companyRequiredNum)),
                        ),
                    ),
                ),
            ) ?? 0
        const receiveNum =
            sumBy(
                monthData?.map((construction) =>
                    sumBy(
                        construction?.sites?.items?.map((site) =>
                            sumBy(site.allRequests?.items?.filter((request) => request.requestedCompanyId == myCompanyId  && request?.isApplication == true).map((request) => request.requestMeter?.companyPresentNum)),
                        ),
                    ),
                ),
            ) ?? 0
        return {
            orderPreNum,
            orderNum,
            receivePreNum,
            receiveNum
        }
    }, [monthData, myCompanyId])

    const _content: ListRenderItem<RequestConstructionUIType> = (info: ListRenderItemInfo<RequestConstructionUIType>) => {
        const { item, index } = info
        return (
            <ConstructionWithSites
                style={{
                    marginTop: 10,
                    marginHorizontal: 10,
                }}
                construction={item}
                key={index.toString()}
                onPress={() => {
                    /**
                     * 他社工事は見れない。
                     */
                    if (item.constructionRelation != 'other-company') {
                        navigation.push('ConstructionDetailRouter', {
                            projectId: item.project?.projectId,
                            constructionId: item.constructionId,
                            title: item.name,
                        })
                    }
                }}
                displayType={displayType}
            />
        )
    }

    const _header = useMemo(() => {
        return (
            <View
                style={{
                    paddingTop: 55,
                    backgroundColor: '#fff',
                    paddingBottom: 10,
                    borderBottomWidth: 1,
                    paddingHorizontal: 10,
                    borderColor: THEME_COLORS.OTHERS.BORDER_COLOR,
                }}>
                <SelectButton
                    items={[t('common:All'), t('admin:Order'), t('admin:AcceptingAnOrder')]}
                    onChangeItem={(value) => {
                        if (value == t('common:All')) {
                            onRequestTypeChange('both')
                        }
                        if (value == t('admin:AcceptingAnOrder')) {
                            onRequestTypeChange('receive')
                        }
                        if (value == t('admin:Order')) {
                            onRequestTypeChange('order')
                        }
                    }}
                    selected={match(displayType)
                        .with('order', () => t('admin:Order'))
                        .with('receive', () => t('admin:AcceptingAnOrder'))
                        .otherwise(() => t('common:All'))}
                    style={{ marginTop: 10 }}
                />
          <View>
                {
                    displayType != 'receive' && 
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginTop: 15,
                        }}>
                        <IconParam
                            flex={1.1}
                            iconName={'transferReceive'}
                            paramName={ t('admin:NumberOfPeopleExpectedToCome')}
                            iconSize={20}
                            count={headerInfos.orderPreNum ?? 0}
                        />
                        <IconParam
                            flex={1}
                            iconName={'transferReceive'}
                            paramName={t('admin:NumberOfPeopleWhoCame')}
                            hasBorder
                            count={headerInfos.orderNum ?? 0}
                        />
                    </View>
                }
                {
                    displayType != 'order' && 
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginTop: 15,
                        }}>
                        <IconParam
                            flex={1.1}
                            iconName={'transfer'}
                            paramName={ t('admin:NumberOfPeopleToBeSent')}
                            iconSize={20}
                            count={headerInfos.receivePreNum ?? 0}
                        />
                        <IconParam
                            flex={1}
                            iconName={'transfer'}
                            paramName={t('admin:NumberOfPeopleSent')}
                            hasBorder
                            count={headerInfos.receiveNum ?? 0}
                        />
                    </View>
                }
                </View>
            </View>
        )
    }, [displayType, headerInfos.orderPreNum, headerInfos.orderNum, headerInfos.receivePreNum, headerInfos.receiveNum])

    const _footer = () => {
        return (
            <View
                style={{
                    marginTop: 20,
                    marginHorizontal: 10,
                }}>
                <BottomMargin />
            </View>
        )
    }

    const _changeMonthData = ({ types, month, newConstructions }: _changeMonthDataProp): ConstructionType[] | undefined => {
        const currentTypes = types ?? displayType
        const currentMonth = month ?? selectedMonth
        const currentConstructions = newConstructions ?? constructions
        const newMonthData = currentConstructions && currentConstructions[currentTypes][monthBaseText(currentMonth)]

        return newMonthData
    }

    const _onDateChange = (date: CustomDate) => {
        setState((prev) => ({
            ...prev,
            selectedMonth: date,
        }))
    }

    const onRequestTypeChange = (types: RequestDisplayType) => {
        const newMonthData = _changeMonthData({ types })

        setState((prev) => ({
            ...prev,
            displayType: types,
            monthData: newMonthData,
        }))
    }

    useEffect(() => {
        return () => {
            setState(initialState)
            setDateUpdate(dateUpdate + 1)
        }
    }, [myCompanyId])

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        ;(async () => {
            try {
                if (myCompanyId == undefined || isFetching != true) {
                    setState((prev) => ({ ...prev, isFetching: false }))
                    return
                }
                if (isFocused) {
                    dispatch(setLoading(true))
                }
                const result = await getRequestConstructionListOfTargetCompanyAndMonth({
                    companyId: myCompanyId,
                    month: selectedMonth,
                })
                setState((prev) => ({ ...prev, isFetching: false }))
                dispatch(setIsNavUpdating(false))
                if (result.error) {
                    throw {
                        error: result.error,
                    }
                }
                /**
                 * キャッシュアップデート前に先に表示データを更新。
                 */
                const fetchMonthBaseText = cachedConstructionsKey.current.substring(cachedConstructionsKey.current.length - 7).replace(/-/g, '/')
                if (monthBaseText(selectedMonth) == fetchMonthBaseText) {
                    // __DEV__ && console.log('3-4、カレント月とフェッチデータが一致したので表示データを更新')
                    const _constructions = cloneDeep(constructions) ?? { both: {}, order: {}, receive: {} }
                    _constructions.both[monthBaseText(selectedMonth)] = (result.success?.totalConstructions && result.success?.totalConstructions.items?.filter(con => con.fakeCompanyInvReservationId == undefined)) ?? []
                    _constructions.order[monthBaseText(selectedMonth)] = (result.success?.orderConstructions && result.success?.orderConstructions.items?.filter(con => con.fakeCompanyInvReservationId == undefined)) ?? []
                    _constructions.receive[monthBaseText(selectedMonth)] = (result.success?.receiveConstructions && result.success?.receiveConstructions.items?.filter(con => con.fakeCompanyInvReservationId == undefined)) ?? []
                    setState((prev) => ({
                        ...prev,
                        constructions: _constructions,
                    }))
                    const cachedRequestConstructionsResult = await updateCachedData({ key: cachedConstructionsKey.current, value: _constructions })
                    if (cachedRequestConstructionsResult.error) {
                        dispatch(
                            setToastMessage({
                                text: cachedRequestConstructionsResult.error,
                                type: 'error',
                            }),
                        )
                    }
                    deleteParamOfLocalUpdateScreens({
                        screens: localUpdateScreens,
                        screenName: 'RequestList',
                        startDate: getMonthlyFirstDay(selectedMonth).totalSeconds,
                        endDate: getMonthlyFinalDay(selectedMonth).totalSeconds,
                        paramName: 'dates',
                    })
                    await deleteParamOfUpdateScreens({
                        accountId,
                        screenName: 'RequestList',
                        startDate: getMonthlyFirstDay(selectedMonth).totalSeconds,
                        endDate: getMonthlyFinalDay(selectedMonth).totalSeconds,
                        paramName: 'dates',
                    })
                } else {
                    /**
                     * カレント月とフェッチデータが一致しないので、フェッチデータは捨てる（日送り連打対策）
                     */
                    //  __DEV__ && console.log('3-5、日送り連打でカレント月とフェッチデータが一致しない（フェッチデータは捨てる）')
                    // __DEV__ && console.log('currentDate: ' + monthBaseText(month) + '\nfetchDate: ' + fetchDayBaseTextWithoutDate)
                    dispatch(setIsNavUpdating(true))
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
        })()
    }, [isFetching])

    /**
     * @summary 常用依頼の工事一覧のキャッシュを更新する副作用関数
     * @purpose アプリ側にKVSによるキャッシュを設けて一覧の初期表示速度を改善する
     * @author Okuda
     */
    useEffect(() => {
        ;(async () => {
            const result = await getCachedData<RequestConstructionListUIType>(cachedConstructionsKey.current)
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
                setState((prev) => ({ ...prev, constructions: result.success }))
            }
        })()
    }, [updateCache])

    useEffect(() => {
        if (isFocused) {
            setState((prev) => ({ ...prev, updateCache: updateCache + 1 }))
        }
    }, [isFocused, route, myCompanyId, selectedMonth])

    useEffect(() => {
        if (constructions) {
            const newMonthData = _changeMonthData({})
            setState((prev) => ({ ...prev, monthData: newMonthData }))
        }
    }, [constructions])

    const _onRefresh = async () => {
        if (isFocused) dispatch(setLoading(true))
        setState((prev) => ({ ...prev, isFetching: true }))
    }

    return (
        <SwitchPage
            dateUpdate={dateUpdate}
            dateInitValue={selectedMonth}
            data={monthData}
            header={_header}
            content={_content}
            emptyProps={
                loading
                    ? undefined
                    : {
                          text: t('admin:ThereIsNoConstructionForTheCurrentMonthYet'),
                      }
            }
            onRefresh={_onRefresh}
            footer={_footer}
            onDateChange={_onDateChange}
        />
    )
}
export default RequestList

const styles = StyleSheet.create({})
