import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Text, Pressable, View, Image, ViewStyle, FlatList, Animated, Easing } from 'react-native'
import { GlobalStyles } from '../../../utils/Styles'
import sumBy from 'lodash/sumBy'
import { newDate } from '../../../utils/ext/Date.extensions'
import { CustomDate } from "../../../models/_others/CustomDate"
import { IconParam } from '../IconParam'
import { getUuidv4 } from '../../../utils/Utils'
import { ConstructionSite, ConstructionSiteUIType } from '../construction/ConstructionSite'
import { ShadowBoxWithToggle } from '../shadowBox/ShadowBoxWithToggle'
import { countSiteArrangements } from '../../../usecases/construction/ConstructionListCase'
import { CompanyCLType } from '../../../models/company/Company'
import { CompanyCL } from './CompanyCL'
import { useTextTranslation } from '../../../fooks/useTextTranslation'

export type CompanyRelationSitesProps = {
    company?: CompanyCLType
    sites?: ConstructionSiteUIType[]
    onPress?: () => void
    onPressSite?: (id?: string) => void
    style?: ViewStyle
}

export const CompanyRelationSites = React.memo((props: Partial<CompanyRelationSitesProps>) => {
    const { company, sites, onPress, onPressSite, style } = props
    const listKey = useMemo(() => getUuidv4(), [])
    const { t } = useTextTranslation()
    return (
        <ShadowBoxWithToggle
            style={{
                padding: 10,
                ...style,
            }}
            onPress={onPress}
            bottomChildren={
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}
                >
                    <IconParam iconName={'site'} paramName={t('common:NoOfSites')} count={sites?.length} />
                    <IconParam iconName={'attend-worker'} paramName={t('common:AllArrangements')} suffix={t('common:Name')} count={sumBy(sites, (site) => countSiteArrangements(site))} />
                </View>
            }
            hideChildren={
                <FlatList
                    data={sites}
                    listKey={listKey}
                    keyExtractor={(item, index) => index.toString()}
                    ListEmptyComponent={() => {
                        return (
                            <View
                                style={{
                                    marginTop: 5,
                                }}
                            >
                                <Text style={GlobalStyles.smallText}>{t('common:ThereIsNoSite')}</Text>
                            </View>
                        )
                    }}
                    renderItem={({ item, index }) => {
                        return (
                            <ConstructionSite
                                onPress={() => {
                                    if (onPressSite) {
                                        onPressSite(item.siteId)
                                    }
                                }}
                                site={item}
                                key={item.siteId}
                                style={{
                                    marginTop: 10,
                                }}
                            />
                        )
                    }}
                />
            }
        >
            <CompanyCL style={{}} company={company} />
        </ShadowBoxWithToggle>
    )
})
