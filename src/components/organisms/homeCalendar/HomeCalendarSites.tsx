import { useNavigation } from '@react-navigation/native'
import React, { useCallback, useMemo } from 'react'
import { View, Text, FlatList, ViewStyle } from 'react-native'
import { SiteType } from '../../../models/site/Site'
import { THEME_COLORS } from '../../../utils/Constants'
import { CustomDate, dayBaseText } from '../../../models/_others/CustomDate'
import { GlobalStyles } from '../../../utils/Styles'
import { getRandomImageColorHue } from '../../../utils/Utils'
import { imageColorHueToBackFillColorValue } from '../ImageIcon'

type HomeCalendarSitesProps = {
    date: CustomDate
    sites: SiteType[]
    preDateConstructionIds?: string[]
    style?: ViewStyle
    useSmartDisplay?: boolean
    useOnlyNewSiteDisplay?: boolean
}

/**
 * @remarks スケジュールの日付を定義。
 * @param props
 * @returns
 */
export const HomeCalendarSites = React.memo((props: HomeCalendarSitesProps) => {
    const { date, sites, useSmartDisplay, useOnlyNewSiteDisplay, preDateConstructionIds, style } = props
    const preDateConstructionIdsSet = useMemo(() => new Set(preDateConstructionIds), [preDateConstructionIds])
    const navigation = useNavigation<any>()
    const filteredSites = useMemo(() => sites.filter((site) => site.constructionId != undefined), [sites])
    const sortFilteredSites = useMemo(() => filteredSites.sort((a, b) => ((a.siteNameData?.siteNumber ?? 1) < (b.siteNameData?.siteNumber ?? 1)) ? -1 : 1), [filteredSites])
    
    
    // const __onPress = useCallback(() => {
    //     /**
    //      * 現場を直接タップする場合、現場が見たい場合が多いので、拡張せずに。
    //      */
    //     navigation.push('DateRouter', {
    //         date: date,
    //     })
    // }, [date])

    const __isNewSite = useCallback((item: SiteType): boolean => {
        return item.siteNameData?.siteNumber == 1
    }, [])

    const __isOmitSite = useCallback(
        (item: SiteType): boolean => {
            if (useOnlyNewSiteDisplay == true) {
                return !__isNewSite(item)
            }
            return useSmartDisplay == true && (preDateConstructionIdsSet?.has(item?.constructionId ?? 'no-id') ?? false)
        },
        [preDateConstructionIds, useSmartDisplay]
    )

    /**
     * 省略したかどうかのリスト
     */
    const isOmitSiteList = useMemo(() => sortFilteredSites.map((item) => __isOmitSite(item)), [sortFilteredSites])
    // const omitCount = useMemo(() => isOmitSiteList.filter((bool) => bool).length ?? 0, [isOmitSiteList])

    const renderItem = useCallback(({ item, index }: any) => {
        if (item.constructionId == undefined) {
            return <></>
        }
        return <HomeCalendarSite isNewSite={item.siteNameData?.siteNumber == 0} isOmit={isOmitSiteList[index]} site={item} />
    }, [])

    const keyExtractor = useCallback((item: SiteType, index: number) => index.toString(), [])

    return (
        <View
            // onPress={__onPress}
            style={{
                flex: 1,
                ...style,
            }}
        >
            <FlatList
                listKey={dayBaseText(date) + 'i'}
                style={{}}
                keyExtractor={keyExtractor}
                data={[...sortFilteredSites]}
                renderItem={renderItem}
                // ListFooterComponent={() => (<>
                //     {(useSmartDisplay == true && omitCount > 0) && <Text style={{
                //         ...GlobalStyles.smallGrayText,
                //         fontSize: 9,
                //         lineHeight: 11,
                //         padding: 3,
                //     }}>{`...他${omitCount}件`}</Text>}
                // </>)}
            />
        </View>
    )
})

// ==============================

/**
 * @param isOmit - 省略するかどうか
 */
type HomeCalendarSiteProps = {
    site: SiteType
    isOmit?: boolean
    isNewSite?: boolean
    style?: ViewStyle
}

const HomeCalendarSite = React.memo((props: HomeCalendarSiteProps) => {
    const { site, style, isNewSite, isOmit } = props
    
    if (isOmit) {
        return <></>
    }

    const backgroundColor = useMemo(
        () => 
        {
            let color = imageColorHueToBackFillColorValue(site.construction?.project?.imageColorHue ?? site.siteNameData?.project?.imageColorHue ?? getRandomImageColorHue())
            if (site.siteRelation=="manager"){
                color = THEME_COLORS.OTHERS.TIMER_SKY_BLUE
            } else if (site.siteRelation=="order-children" || site.siteRelation=="fake-company-manager") {
                color = THEME_COLORS.OTHERS.LIGHT_PINK
            } else if (site.siteRelation=="other-company") {
                color = THEME_COLORS.OTHERS.BORDER_COLOR
            }
            return color
        }
        , [site]
        )
    return (
        <View
            key={site.siteId}
            style={{
                padding: 3,
                borderRadius: 3,
                borderWidth: 1,
                borderColor: '#fff',
                // flex: 1,
                backgroundColor: backgroundColor,
                flexDirection: 'row',
                alignItems: 'center',
                ...style,
            }}
        >
            {isNewSite == true && (
                <View
                    style={{
                        backgroundColor: THEME_COLORS.OTHERS.ALERT_RED,
                        borderWidth: 1,
                        borderColor: '#fff',
                        padding: 1,
                        height: 7,
                        width: 7,
                        borderRadius: 8,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 2,
                    }}
                ></View>
            )}
            <Text numberOfLines={1} ellipsizeMode={'clip'} style={{ ...GlobalStyles.smallText, fontSize: 9, lineHeight: 11, color: THEME_COLORS.OTHERS.BLACK }}>
                {site.siteNameData?.name}
            </Text>
        </View>
    )
})
