/* eslint-disable prefer-const */
import React, { useCallback, useMemo, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { View, ViewStyle, StyleSheet, FlatList, Alert } from 'react-native'

import { FontStyle } from '../../../utils/Styles'
import { THEME_COLORS, WINDOW_WIDTH } from '../../../utils/Constants'
import { getUuidv4 } from '../../../utils/Utils'
import { SiteHeader } from '../site/SiteHeader'
import { WorkerList } from '../worker/WorkerList'
import { ShadowBox } from '../shadowBox/ShadowBox'
import { useIsFocused, useNavigation } from '@react-navigation/native'
import { SiteType } from '../../../models/site/Site'
import { WorkerType } from '../../../models/worker/Worker'
import { Request } from '../request/Request'
import { ShadowBoxWithHeader } from '../shadowBox/ShadowBoxWithHeader'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { setLoading, setLocalUpdateScreens, setToastMessage, ToastMessage } from '../../../stores/UtilSlice'
import { checkLockOfTarget } from '../../../usecases/lock/CommonLockCase'
import { toIdAndMonthFromTotalSeconds, UpdateScreenType } from '../../../models/updateScreens/UpdateScreens'
import flatten from 'lodash/flatten'
import uniqBy from 'lodash/uniqBy'
import cloneDeep from 'lodash/cloneDeep'
import isEmpty from 'lodash/isEmpty'
import { getErrorMessage } from '../../../services/_others/ErrorService'
import { CustomResponse } from '../../../models/_others/CustomResponse'
import { StoreType } from '../../../stores/Store'
import { deleteConstructionSite } from '../../../usecases/site/MySiteCase'
import { CustomDate, newCustomDate } from '../../../models/_others/CustomDate'
import { checkMyDepartment } from '../../../usecases/department/DepartmentCase'
import { getCachedData, updateCachedData } from '../../../usecases/CachedDataCase'
import { DateDataType } from '../../../models/date/DateDataType'
import { ExtendedDateDataType } from '../../../screens/adminSide/date/DateRouter'
import { deleteLocalSiteArrangement } from '../../../usecases/arrangement/SiteArrangementCase'
import { setIsNavUpdating } from '../../../stores/NavigationSlice'
// import DatePicker from 'react-native-date-picker'
export type DateArrangementProps = {
    data: SiteType
    onPress?: () => void
    displayDay?: boolean
    displayWorker?: boolean
    hasShadow?: boolean
    routeNameFrom?: string
    dateCacheKey?: string
    adminHomeCacheKey?: string
    date?: CustomDate
    isDeleting?: boolean
    setIsDeleting?: (id?: string) => void
    update?: () => void
    style?: ViewStyle
}

export const DateArrangement = React.memo((props: Partial<DateArrangementProps>) => {
    const dispatch = useDispatch()
    const isFocused = useIsFocused()
    const { t } = useTextTranslation()
    let { data, onPress, displayDay, displayWorker, hasShadow, routeNameFrom, dateCacheKey, adminHomeCacheKey, date, isDeleting, setIsDeleting, update, style } = props
    const navigation = useNavigation<any>()
    const listKey = useMemo(() => getUuidv4(), [])
    const workers = useMemo(() => data?.siteMeter?.presentArrangements?.items?.map((arr) => arr.worker).filter((data) => data != undefined) as WorkerType[], [data])
    const requests = useMemo(() => data?.siteMeter?.presentRequests?.items, [data])
    const requestSites = useMemo(() => data?.companyRequests?.receiveRequests?.items?.filter((item) => (item.requestMeter?.companyRequiredNum ?? 0) > 0), [data])

    const localUpdateScreens = useSelector((state: StoreType) => state?.util?.localUpdateScreens)
    const signInUser = useSelector((state: StoreType) => state.account?.signInUser)
    const myCompanyId = useSelector((state: StoreType) => state?.account.belongCompanyId)
    const activeDepartments = useSelector((state: StoreType) => state.account?.activeDepartments)
    const activeDepartmentIds = useMemo(() => activeDepartments?.map((dep) => dep?.departmentId).filter((data) => data != undefined) as string[], [activeDepartments])

    const [isDeletingLocal, setIsDeletingLocal] = useState(false)

    const _deleteSite = async (site?: SiteType) => {
        try {
            if (site?.siteId == undefined) {
                throw {
                    error: t('common:NoFieldInfoAvailable'),
                }
            }
            if (site?.fakeCompanyInvRequestId != undefined) {
                throw {
                    error: t('admin:ThisSiteCannotBeDeletedDirectly'),
                }
            }
            dispatch(setLoading('unTouchable'))
            setIsDeletingLocal(true)
            if (setIsDeleting) setIsDeleting(data?.siteId)

            const lockResult = await checkLockOfTarget({
                myWorkerId: signInUser?.workerId ?? 'no-id',
                targetId: site?.siteId ?? 'no-id',
                modelType: 'site',
            })
            if (lockResult.error) {
                throw {
                    error: lockResult.error,
                }
            }

            /**
             * 現場をサーバーから削除前に、キャッシュから削除
             */
            let adminHomeData: ExtendedDateDataType | undefined
            if (adminHomeCacheKey) {
                try {
                    const resultAdminHomeCache = await _deleteSiteFromAdminHomeCache(adminHomeCacheKey, site.siteId)
                    if (resultAdminHomeCache.error) {
                        throw {
                            error: resultAdminHomeCache.error,
                            errorCode: resultAdminHomeCache.errorCode,
                        }
                    }

                    adminHomeData = resultAdminHomeCache.success
                } catch (error) {
                    // キャッシュ取得・更新に失敗しても削除を中断させないためコンソール出力のみ
                    console.log('error:  ', error)
                }
            }

            if (dateCacheKey) {
                try {
                    const resultDateArrangementsCache = await _deleteSiteFromDateArrangementsCache(dateCacheKey, site.siteId)
                    if (resultDateArrangementsCache.error) {
                        throw {
                            error: resultDateArrangementsCache.error,
                            errorCode: resultDateArrangementsCache.errorCode,
                        }
                    }
                    if (update) update()
                } catch (error) {
                    // キャッシュ取得・更新に失敗しても削除を中断させないためコンソール出力のみ
                    console.log('error:  ', error)
                }
            }

            const result = await deleteConstructionSite({
                siteId: site?.siteId,
            })

            if (isFocused) dispatch(setLoading(false))
            if (result.error) {
                // キャッシュを現場削除前に戻す
                if (adminHomeCacheKey && adminHomeData !== undefined && !isEmpty(adminHomeData)) {
                    const cachedResult = await updateCachedData({ key: adminHomeCacheKey, value: adminHomeData })
                    if (cachedResult.error) {
                        console.log(cachedResult.error)
                        // throw {
                        //     error: cachedResult.error,
                        //     errorCode: cachedResult.errorCode,
                        // }
                    }
                }

                throw {
                    error: result.error,
                }
            }
            const _date = site.siteDate ?? site.meetingDate
            const constructionIdAndDate = toIdAndMonthFromTotalSeconds(site?.construction?.constructionId, _date)
            let newLocalUpdateScreens: UpdateScreenType[] = [
                {
                    screenName: 'ConstructionSiteList',
                    idAndDates: [...flatten(localUpdateScreens.filter((screen) => screen.screenName == 'ConstructionSiteList').map((screen) => screen.idAndDates)), constructionIdAndDate]?.filter(
                        (data) => data != undefined,
                    ) as string[],
                },
            ]
            dispatch(setLocalUpdateScreens(uniqBy([...newLocalUpdateScreens, ...localUpdateScreens], 'screenName')))
        } catch (error) {
            const _error = error as CustomResponse
            dispatch(
                setToastMessage({
                    text: getErrorMessage(_error),
                    type: 'error',
                } as ToastMessage),
            )
        } finally {
            if (isFocused) dispatch(setLoading(false))
            // if (setIsDeleting) setIsDeleting(undefined)
            setIsDeletingLocal(false)
        }
    }

    const _deleteSiteFromAdminHomeCache = async (adminHomeCacheKey: string, siteId: string): Promise<CustomResponse<ExtendedDateDataType>> => {
        try {
            const adminHomeCacheData = await getCachedData<ExtendedDateDataType>(adminHomeCacheKey ?? 'no-id')
            if (adminHomeCacheData.error) {
                throw {
                    error: adminHomeCacheData.error,
                    errorCode: adminHomeCacheData.errorCode,
                }
            }
            const adminHomeData = adminHomeCacheData.success

            if (adminHomeData === undefined || isEmpty(adminHomeData)) {
                return Promise.resolve({
                    success: undefined,
                })
            }

            const _adminHomeData = cloneDeep(adminHomeData)
            _adminHomeData?.monthlyData.forEach((adminHomeDateData) => {
                if (adminHomeDateData.date == date?.totalSeconds) {
                    const filteredData = adminHomeDateData?.sites?.totalSites?.items?.filter((item) => item?.siteId !== siteId)
                    if (filteredData !== undefined && adminHomeDateData?.sites?.totalSites?.items !== undefined) {
                        adminHomeDateData.sites.totalSites.items = filteredData
                        adminHomeDateData.updatedAt = newCustomDate().totalSeconds
                    }
                }
            })

            const cachedResult = await updateCachedData({
                key: adminHomeCacheKey,
                value: {
                    monthlyData: _adminHomeData?.monthlyData,
                    projects: _adminHomeData?.projects,
                },
            })
            if (cachedResult.error) {
                throw {
                    error: cachedResult.error,
                    errorCode: cachedResult.errorCode,
                }
            }

            return Promise.resolve({
                success: _adminHomeData,
            })
        } catch (error) {
            return getErrorMessage(error)
        }
    }

    const _deleteSiteFromDateArrangementsCache = async (dateCacheKey: string, siteId: string): Promise<CustomResponse<DateDataType>> => {
        try {
            const dateArrangementsCacheData = await getCachedData<DateDataType>(dateCacheKey ?? 'no-id')

            if (dateArrangementsCacheData.error) {
                throw {
                    error: dateArrangementsCacheData.error,
                    errorCode: dateArrangementsCacheData.errorCode,
                }
            }
            const __dateArrangementsData = dateArrangementsCacheData.success

            if (__dateArrangementsData === undefined || isEmpty(__dateArrangementsData)) {
                return Promise.resolve({
                    success: undefined,
                })
            }

            const _dateArrangementsData = cloneDeep(__dateArrangementsData)
            const filteredData = _dateArrangementsData?.sites?.totalSites?.items?.filter((item) => item?.siteId !== siteId)

            let newDateArrangementsData: DateDataType | undefined
            if (filteredData !== undefined && _dateArrangementsData?.sites?.totalSites?.items !== undefined) {
                _dateArrangementsData.sites.totalSites.items = filteredData
                _dateArrangementsData.updatedAt = newCustomDate().totalSeconds
                const cachedResult = await updateCachedData({ key: dateCacheKey, value: newDateArrangementsData })
                if (cachedResult.error) {
                    throw {
                        error: cachedResult.error,
                        errorCode: cachedResult.errorCode,
                    }
                }
            }

            return Promise.resolve({
                success: newDateArrangementsData,
            })
        } catch (error) {
            return getErrorMessage(error)
        }
    }

    const canEdit = useMemo(
        () => (data?.siteRelation == 'manager' ? checkMyDepartment({ targetDepartmentIds: data?.construction?.contract?.receiveDepartmentIds, activeDepartmentIds }) : false),
        [activeDepartmentIds],
    )

    const displayAlert = useCallback(() => {
        Alert.alert(
            `${data?.siteNameData?.name}`,
            '',
            canEdit
                ? data?.fakeCompanyInvRequestId || data?.siteRelation == 'order-children'
                    ? [
                          {
                              text: `${t('worker:cancel')}`,
                              style: 'cancel',
                          },
                          {
                              text: `${t('admin:Details')}`,
                              onPress: () => {
                                  navigation.push('SiteDetail', {
                                      siteId: data?.siteId,
                                      title: data?.siteNameData?.name,
                                      siteNumber: data?.siteNameData?.siteNumber,
                                  })
                              },
                          },
                          {
                              text: `${t('worker:edit')}`,
                              onPress: () => {
                                  navigation.push('EditSite', {
                                      siteId: data?.siteId,
                                      constructionId: data?.constructionId,
                                      mode: 'edit',
                                      isInstruction: data?.siteRelation == 'order-children',
                                      projectId: data?.construction?.projectId,
                                  })
                              },
                          },
                          {
                              text: `${t('admin:DeleteDraft')}`,
                              onPress: () => {
                                  deleteLocalSiteArrangement(
                                      data?.fakeCompanyInvRequestId ? data.siteId : data?.companyRequests?.receiveRequests?.items && data?.companyRequests?.receiveRequests?.items[0]?.requestId,
                                  )
                                  dispatch(setIsNavUpdating(true))
                              },
                          },
                      ]
                    : [
                          {
                              text: `${t('worker:cancel')}`,
                              style: 'cancel',
                          },
                          {
                              text: `${t('admin:Details')}`,
                              onPress: () => {
                                  navigation.push('SiteDetail', {
                                      siteId: data?.siteId,
                                      title: data?.siteNameData?.name,
                                      siteNumber: data?.siteNameData?.siteNumber,
                                  })
                              },
                          },
                          {
                              text: `${t('worker:edit')}`,
                              onPress: () => {
                                  navigation.push('EditSite', {
                                      siteId: data?.siteId,
                                      constructionId: data?.constructionId,
                                      mode: 'edit',
                                      projectId: data?.construction?.project?.projectId,
                                  })
                              },
                          },
                          {
                              text: `${t('worker:deletion')}`,
                              onPress: () => {
                                  if (data?.siteMeter?.companyPresentNum) {
                                      Alert.alert(`${t('admin:WantToDeleteTheSite')}`, `${t('admin:ArrangementsWillBeDeleted')}`, [
                                          {
                                              text: `${t('worker:deletion')}`,
                                              onPress: () => {
                                                  _deleteSite(data)
                                              },
                                          },
                                          {
                                              text: `${t('worker:cancel')}`,
                                              style: 'cancel',
                                          },
                                      ])
                                  } else {
                                      _deleteSite(data)
                                  }
                              },
                          },
                          {
                              text: `${t('admin:DeleteDraft')}`,
                              onPress: () => {
                                  deleteLocalSiteArrangement(data?.siteId)
                                  dispatch(setIsNavUpdating(true))
                              },
                          },
                      ]
                : [
                      {
                          text: `${t('worker:cancel')}`,
                          style: 'cancel',
                      },
                      {
                          text: `${t('admin:Details')}`,
                          onPress: () => {
                              navigation.push('SiteDetail', {
                                  siteId: data?.siteId,
                                  title: data?.siteNameData?.name,
                                  siteNumber: data?.siteNameData?.siteNumber,
                                  requestId: data?.companyRequests?.receiveRequests?.items?.[0]?.requestId,
                              })
                          },
                      },
                      {
                          text: `${t('admin:DeleteDraft')}`,
                          onPress: () => {
                              deleteLocalSiteArrangement(data?.companyRequests?.receiveRequests?.items && data?.companyRequests?.receiveRequests?.items[0]?.requestId)
                              dispatch(setIsNavUpdating(true))
                          },
                      },
                  ],
        )
    }, [data])

    return (
        <ShadowBox
            onPress={() => {
                if (isDeleting) return

                if (onPress) {
                    onPress()
                } else {
                    navigation.push('SiteDetail', {
                        title: data?.siteNameData?.name,
                        siteId: data?.siteId,
                        siteNumber: data?.siteNameData?.siteNumber,
                    })
                }
            }}
            onLongPress={!isDeleting ? displayAlert : undefined}
            key={getUuidv4()}
            hasShadow={hasShadow}
            style={{
                opacity: isDeletingLocal ? 0.5 : 1,
                paddingBottom: 5,
                ...style,
            }}>
            <SiteHeader
                site={data}
                style={{
                    backgroundColor: THEME_COLORS.OTHERS.PURPLE_GRAY,
                    padding: 8,
                    borderTopEndRadius: 10,
                    borderTopStartRadius: 10,
                }}
                displayMeter={data?.siteRelation == 'manager' || data?.siteRelation == 'fake-company-manager'}
                titleStyle={
                    {
                        lineHeight: 14,
                        fontSize: 12,
                        fontFamily: FontStyle.regular,
                    } as ViewStyle
                }
                siteNameWidth={WINDOW_WIDTH - 40}
                isDateArrangement={true}
                displayDay={displayDay}
                displayAlert={displayAlert}
                isDeleting={isDeleting}
                routeNameFrom={routeNameFrom}
            />
            {(data?.siteRelation == 'manager' || data?.siteRelation == 'fake-company-manager' || displayWorker) && (
                <View
                    style={{
                        flexDirection: 'row',
                        paddingHorizontal: 10,
                        marginTop: 3,
                    }}>
                    <WorkerList requests={requests} workers={workers} />
                </View>
            )}

            {data?.siteRelation != 'fake-company-manager' && (
                <FlatList
                    data={requestSites}
                    listKey={listKey}
                    renderItem={({ item, index }) => {
                        return (
                            <ShadowBoxWithHeader
                                title={t('common:RequestForSupportForYourCompany')}
                                style={{
                                    marginHorizontal: 10,
                                    marginBottom: 5,
                                    marginTop: 10,
                                }}
                                hasShadow={false}
                                onPress={() => {
                                    if (isDeleting) return

                                    if (onPress) {
                                        onPress()
                                    } else {
                                        navigation.push('SiteDetail', {
                                            title: data?.siteNameData?.name,
                                            siteId: data?.siteId,
                                            siteNumber: data?.siteNameData?.siteNumber,
                                            requestId: item.requestId,
                                        })
                                    }
                                }}
                                key={data?.siteId}>
                                <Request iconSize={28} request={item} type={'order'} />
                            </ShadowBoxWithHeader>
                        )
                    }}
                />
            )}
        </ShadowBox>
    )
})

const styles = StyleSheet.create({})
