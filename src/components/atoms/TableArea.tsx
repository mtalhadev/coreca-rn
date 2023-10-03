/* eslint-disable prefer-const */
import React, { Fragment, useMemo } from 'react'
import { Text, View, ViewStyle, StyleSheet, FlatList } from 'react-native'
import { THEME_COLORS } from '../../utils/Constants'
import { FontStyle } from '../../utils/Styles'
import isEmpty from 'lodash/isEmpty'
import { getUuidv4 } from '../../utils/Utils'
import { useTextTranslation } from '../../fooks/useTextTranslation'

export type ColumnType =
    | {
          key: string
          content: string | undefined
          textColor?: string
      }
    | undefined

export type TableAreaProps = {
    columns: ColumnType[]
    textColor: string
    color: string
    contentRatio: number
    lineHight?: number
    style?: ViewStyle
}

export const TableArea = React.memo((props: Partial<TableAreaProps>) => {
    let { columns, textColor, color, contentRatio, lineHight, style } = props
    contentRatio = contentRatio ?? 3
    const listKey = useMemo(() => getUuidv4(), [])
    const { t } = useTextTranslation()

    return (
        <View
            style={[
                {
                    padding: 10,
                    borderRadius: 5,
                    backgroundColor: color ?? THEME_COLORS.OTHERS.TABLE_AREA_PURPLE,
                },
                style,
            ]}>
            {columns?.map((item, index) => {
                const emptyContent = isEmpty(item?.content) || item?.content == 'undefined'
                if (item == undefined) {
                    return <Fragment key={index}></Fragment>
                }
                return (
                    <View key={index + listKey}>
                        {item != undefined && (
                            <View
                                style={{
                                    flexDirection: 'row',
                                    marginTop: index > 0 ? 5 : 0,
                                }}>
                                <Text
                                    style={{
                                        flex: 1,
                                        fontFamily: FontStyle.regular,
                                        fontSize: 12,
                                        lineHeight: lineHight ? lineHight : 18,
                                        color: textColor,
                                    }}>
                                    {item.key}
                                </Text>
                                <Text
                                    style={{
                                        flex: contentRatio,
                                        paddingLeft: 10,
                                        fontFamily: FontStyle.regular,
                                        fontSize: 12,
                                        lineHeight: lineHight ? lineHight : 18,
                                        color: emptyContent ? THEME_COLORS.OTHERS.LIGHT_GRAY : item.textColor ?? textColor,
                                    }}>
                                    {emptyContent ? t('common:None') : item.content}
                                </Text>
                            </View>
                        )}
                    </View>
                )
            })}
        </View>
    )
})

const styles = StyleSheet.create({})
