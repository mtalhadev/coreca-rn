import React, { useState, useEffect, useMemo } from 'react'
import { Pressable, View, ViewStyle, FlatList, ListRenderItem, ListRenderItemInfo, RefreshControl } from 'react-native'

import { THEME_COLORS } from '../../utils/Constants'
import { IconParam } from '../organisms/IconParam'
import { EmptyScreen } from './EmptyScreen'
import { useNavigation } from '@react-navigation/native'
import { useDispatch, useSelector } from 'react-redux'
import { ConstructionCLType } from '../../models/construction/Construction'
import { BottomMargin } from '../atoms/BottomMargin'
import { ConstructionItem } from '../organisms/construction/ConstructionItem'
import { StoreType } from '../../stores/Store'
import { getUuidv4 } from '../../utils/Utils'
import { useTextTranslation } from '../../fooks/useTextTranslation'

export type ConstructionListScreenProps = {
    constructions: ConstructionCLType[]
    onPressConstruction?: (construction: ConstructionCLType) => void
    onRefresh?: () => void
    style?: ViewStyle
}

export const ConstructionListScreen = React.memo((props: ConstructionListScreenProps) => {
    const { style, onPressConstruction, constructions, onRefresh } = props
    const [filter, setFilter] = useState<string[]>([])
    const loading = useSelector((state: StoreType) => state.util.loading)
    const [displayConstructions, setDisplayConstructions] = useState<ConstructionCLType[]>([])
    const navigation = useNavigation<any>()
    const dispatch = useDispatch()
    const [refreshing, setRefreshing] = useState<boolean>(false)
    const { t } = useTextTranslation()

    useEffect(() => {
        return () => {
            setDisplayConstructions([])
        }
    }, [])

    const _onRefresh = async () => {
        setRefreshing(true)
        if (onRefresh) {
            await onRefresh()
        }
        setRefreshing(false)
    }

    const _header = () => {
        return (
            <View
                style={{
                    backgroundColor: '#fff',
                    borderBottomWidth: 1,
                    borderColor: THEME_COLORS.OTHERS.BORDER_COLOR,
                    padding: 10,
                }}
            >
                <IconParam
                    style={{
                        marginTop: 5,
                    }}
                    iconName={'construction'}
                    paramName={t('common:Construction')}
                    // eslint-disable-next-line react/prop-types
                    count={displayConstructions.length}
                    // onPress={() => {
                    //     navigation.push('CreateConstruction', {})
                    // }}
                />
            </View>
        )
    }

    const _footer = () => {
        return (
            <View
                style={
                    {
                        // marginBottom: 100,
                        // marginHorizontal: 10,
                    }
                }
            >
                <BottomMargin />
            </View>
        )
    }

    const _content: ListRenderItem<ConstructionCLType> = (info: ListRenderItemInfo<ConstructionCLType>) => {
        const { item, index } = info
        return (
            <Pressable
                onPress={() => {
                    if (onPressConstruction) {
                        onPressConstruction(item)
                    }
                }}
                style={{
                    marginHorizontal: 10,
                    marginTop: 10,
                }}
                key={item.constructionId}
            >
                <ConstructionItem construction={item} project={item.project}/>
            </Pressable>
        )
    }

    useEffect(() => {
        setDisplayConstructions(constructions)
    }, [filter, constructions])
    const listKey = useMemo(() => getUuidv4(), [])

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: '#fff',
                ...style,
            }}
        >
            <FlatList
                listKey={listKey}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={_onRefresh} />}
                data={displayConstructions}
                ListEmptyComponent={loading ? <></> : <EmptyScreen text={t('common:NoConstruction')} />}
                renderItem={_content}
                ListHeaderComponent={_header}
                ListFooterComponent={_footer}
            />
        </View>
    )
})
