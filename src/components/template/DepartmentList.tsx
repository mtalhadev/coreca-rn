import React, { useMemo, useState } from 'react'
import { FlatList, ListRenderItem, ListRenderItemInfo, RefreshControl, View, ViewStyle, Text, Pressable } from 'react-native'
import { useSelector } from 'react-redux'
import { useTextTranslation } from '../../fooks/useTextTranslation'
import { DepartmentType } from '../../models/department/DepartmentType'
import { StoreType } from '../../stores/Store'
import { THEME_COLORS } from '../../utils/Constants'
import { BlueColor, FontStyle } from '../../utils/Styles'
import { getUuidv4 } from '../../utils/Utils'
import { ShadowBox } from '../organisms/shadowBox/ShadowBox'
import { EmptyScreen } from './EmptyScreen'

/**
 * departments - 表示する部署一覧
 * activeDepartments - 現在アクティブな部署
 * onPressDepartment - 部署をタップした際の挙動。
 * onRefresh - リロード
 * footer - 一覧の下に表示するもの。選択にした場合は無効
 */
type DepartmentListProps = {
    departments?: DepartmentType[]
    activeDepartments?: DepartmentType[]
    onPressDepartment?: (department: DepartmentType) => void
    onRefresh?: () => void
    footer?: () => JSX.Element
    style?: ViewStyle
}

/**
 * 部署一覧
 */
const DepartmentList = (props: DepartmentListProps) => {
    const { departments, activeDepartments, onPressDepartment, onRefresh, footer, style } = props
    const loading = useSelector((state: StoreType) => state.util.loading)
    const { t } = useTextTranslation()

    const [refreshing, setRefreshing] = useState<boolean>(false)

    const _onRefresh = async () => {
        setRefreshing(true)
        if (onRefresh) {
            onRefresh()
        }
        setRefreshing(false)
    }

    const _content: ListRenderItem<DepartmentType> = (info: ListRenderItemInfo<DepartmentType>) => {
        const { item, index } = info
        const selectedIdsSet = new Set(activeDepartments?.map((dep) => dep.departmentId)?.filter((data) => data != undefined))
        const selected = selectedIdsSet.has(item.departmentId)

        return (
            <ShadowBox
                onPress={() => {
                    if (onPressDepartment) {
                        onPressDepartment(item)
                    }
                }}
                style={{
                    padding: 8,
                    borderColor: selected ? BlueColor.subColor : THEME_COLORS.OTHERS.BORDER_COLOR,
                    marginHorizontal: 8,
                    marginTop: 10,
                    alignItems: 'center',
                    height: 54,
                    flexDirection: 'row',
                }}
                key={item?.departmentId ?? index}>
                <Text
                    style={{
                        fontFamily: FontStyle.regular,
                        fontSize: 14,
                        lineHeight: 16,
                        marginLeft: 15,
                    }}>
                    {item.departmentName}
                </Text>
            </ShadowBox>
        )
    }

    const listKey = useMemo(() => getUuidv4(), [])

    const _footer = () => {
        if (footer) {
            return footer()
        } else {
            return <></>
        }
    }

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: '#fff',
                ...style,
            }}>
            <FlatList
                style={{
                    marginTop: 5,
                }}
                listKey={listKey}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={_onRefresh} />}
                data={departments}
                ListEmptyComponent={loading ? <></> : <EmptyScreen text={t('common:NoDepartment')} />}
                renderItem={_content}
                ListFooterComponent={_footer}
            />
        </View>
    )
}
export default DepartmentList
