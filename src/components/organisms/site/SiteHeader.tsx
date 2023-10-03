import React, { useMemo } from 'react'
import { Pressable, Text, View, ViewStyle } from 'react-native'

import { FontStyle } from '../../../utils/Styles'
import { THEME_COLORS, WINDOW_WIDTH } from '../../../utils/Constants'
import { CustomDate, compareWithToday, dayBaseText, getTextBetweenAnotherDate, getTextBetweenAnotherDateOver24Hours, toCustomDateFromTotalSeconds } from '../../../models/_others/CustomDate'
import { TimeIcon } from '../TimeIcon'
import { SiteMeter } from './SiteMeter'
import { NewBadge } from '../../atoms/NewBadge'
import { isNoValueObject, useComponentSize } from '../../../utils/Utils'
import { Tag } from '../Tag'
import { SiteType } from '../../../models/site/Site'
import { SitePrefix } from './SitePrefix'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import ThreeDotsSvg from '../../../../assets/images/threeDots.svg'

export type SiteHeaderProps = {
    batchSize?: number
    style?: ViewStyle
    titleStyle?: ViewStyle
    siteNameStyle?: ViewStyle
    meterStyle?: ViewStyle
    displayMeter?: boolean
    displaySitePrefix?: boolean
    siteNameWidth?: number
    isRequest?: boolean
    displayAlert?: () => void
    isDeleting?: boolean
    /**
     * 現場名の表示を日付のみにする。
     */
    isOnlyDateName?: boolean
    displayDay?: boolean
    site?: SiteType
    isDateArrangement?: boolean
    routeNameFrom?: string
}

export const SiteHeader = React.memo((props: Partial<SiteHeaderProps>) => {
    let {
        site,
        style,
        batchSize,
        isOnlyDateName,
        displaySitePrefix,
        displayMeter,
        isRequest,
        titleStyle,
        siteNameWidth,
        siteNameStyle,
        meterStyle,
        displayDay,
        isDeleting,
        isDateArrangement,
        routeNameFrom,
        displayAlert,
    } = props
    const [size, onLayout] = useComponentSize()
    batchSize = batchSize ?? 18
    displayDay = displayDay ?? false
    displayMeter = displayMeter ?? true
    displaySitePrefix = displaySitePrefix ?? true
    const { t } = useTextTranslation()

    const siteName = useMemo(() => {
        if (isOnlyDateName) {
            if (site?.siteNameData?.name) {
                const name = (site?.siteNameData?.name).split('-')
                return name[name.length - 1].trim()
            }
        }

        //現場名が工事名だけの場合に、工事名が長くても省略しないようにする
        const _siteName = site?.siteNameData?.name?.split('/')
        if (_siteName?.length == 2) {
            return site?.siteNameData?.name
        } else if (_siteName?.length == 1) {
            const _constructionName = site?.construction?.name?.trim()
            const _day = _siteName?.[0]?.split('-')?.[1]?.trim()

            return _constructionName != undefined && _day != undefined ? _constructionName + ' - ' + _day : site?.siteNameData?.name
        }
    }, [site?.siteNameData?.name])

    const meetingDate = useMemo(() => {
        return site?.meetingDate ? toCustomDateFromTotalSeconds(site?.meetingDate) : undefined
    }, [site?.meetingDate])

    const siteDate = useMemo(() => {
        return site?.siteDate ? toCustomDateFromTotalSeconds(site?.siteDate) : undefined
    }, [site?.siteDate])

    const endDate = useMemo(() => {
        return site?.endDate ? toCustomDateFromTotalSeconds(site?.endDate) : undefined
    }, [site?.endDate])

    return (
        <>
            {!isNoValueObject(site) && site != undefined && (
                <View onLayout={onLayout} style={[{}, style]}>
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginVertical: displayAlert ? -8 : 0,
                        }}>
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}>
                            {displayDay && (
                                <Text
                                    style={[
                                        {
                                            fontFamily: FontStyle.black,
                                            fontSize: 22,
                                            lineHeight: 26,
                                            marginRight: 5,
                                        },
                                        titleStyle,
                                    ]}>
                                    {meetingDate || siteDate ? dayBaseText(meetingDate ?? (siteDate as CustomDate)) : t('common:Undecided')}
                                </Text>
                            )}
                            {endDate != undefined && !isDateArrangement && (
                                <>
                                    <Text
                                        style={[
                                            {
                                                fontFamily: FontStyle.black,
                                                fontSize: 22,
                                                lineHeight: 26,
                                            },
                                            titleStyle,
                                        ]}>
                                        {getTextBetweenAnotherDate(meetingDate, endDate, true)}
                                    </Text>
                                    <TimeIcon
                                        targetDate={meetingDate}
                                        endDate={endDate}
                                        style={{
                                            marginLeft: 10,
                                        }}
                                    />
                                </>
                            )}
                            {endDate != undefined && isDateArrangement && (
                                <>
                                    <Text
                                        style={[
                                            {
                                                fontFamily: FontStyle.black,
                                                fontSize: 22,
                                                lineHeight: 26,
                                            },
                                            titleStyle,
                                        ]}>
                                        {getTextBetweenAnotherDateOver24Hours(meetingDate, endDate, true)}
                                    </Text>
                                    {/* <TimeIcon
                                        targetDate={meetingDate}
                                        endDate={endDate}
                                        style={{
                                            marginLeft: 10,
                                        }}
                                    /> */}
                                </>
                            )}
                        </View>
                        {displayAlert && (
                            <Pressable
                                style={{ paddingHorizontal: 15, paddingVertical: 10, marginRight: -8 }}
                                onPress={() => {
                                    if (!isDeleting && displayAlert) {
                                        displayAlert()
                                    }
                                }}>
                                <ThreeDotsSvg fill={'#000'} />
                            </Pressable>
                        )}
                    </View>
                    <View
                        style={{
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            marginTop: 5,
                            width: siteNameWidth ?? size?.width ?? WINDOW_WIDTH,
                        }}>
                        {displaySitePrefix == true && (
                            <SitePrefix
                                style={{
                                    marginRight: 5,
                                    marginBottom: 5,
                                }}
                                type={site.siteRelation}
                            />
                        )}

                        <Text
                            ellipsizeMode={'middle'}
                            numberOfLines={2}
                            style={[
                                {
                                    fontFamily: FontStyle.bold,
                                    fontSize: 12,
                                    lineHeight: 14,
                                    marginRight: 5,
                                    marginBottom: 5,
                                },
                                siteNameStyle,
                            ]}>
                            {siteName ?? ''}
                        </Text>
                        {/* {!(site?.isConfirmed == true) && (site.siteRelation == 'manager' || site.siteRelation == 'fake-company-manager' || isRequest == true) && (
                            <Tag
                                tag={t('common:Unnoticed')}
                                fontSize={9}
                                color={THEME_COLORS.OTHERS.ALERT_RED}
                                style={{
                                    marginRight: 5,
                                }}
                            />
                        )}
                        {site.siteDate &&
                            (site.siteRelation == 'manager' || site.siteRelation == 'fake-company-manager') &&
                            compareWithToday(toCustomDateFromTotalSeconds(site.siteDate)).totalMilliseconds < 0 && <NewBadge size={batchSize} />} */}
                    </View>
                    {isRequest != true && site.siteMeter != undefined && site.siteRelation != 'other-company' && displayMeter == true && (
                        <SiteMeter
                            presentCount={site.siteMeter?.companyPresentNum}
                            requiredCount={site.siteMeter?.companyRequiredNum}
                            routeNameFrom={routeNameFrom}
                            style={{ marginTop: 5, ...meterStyle }}
                        />
                    )}
                    {isRequest == true && site.siteMeter != undefined && displayMeter == true && (
                        <SiteMeter presentCount={site.siteMeter?.companyPresentNum} requiredCount={site.siteMeter?.companyRequiredNum} style={{ marginTop: 5, ...meterStyle }} />
                    )}
                </View>
            )}
        </>
    )
})
