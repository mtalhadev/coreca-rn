import React, { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { WorkerUIType } from './chatGroupMembers/SelectUsersForCustomGroup'
import { SCREEN_WIDTH, THEME_COLORS } from '../../../utils/Constants'
import { FontStyle, GlobalStyles } from '../../../utils/Styles'
import { Checkbox } from '../../atoms/Checkbox'
import { Chip } from '../../atoms/Chip'
import { ImageIcon } from '../ImageIcon'
import { RootStackParamList } from '../../../screens/Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { useNavigation } from '@react-navigation/native'
import { Tag } from '../Tag'
import VectorIcon from '../../atoms/VectorIcon'

type NavProps = StackNavigationProp<RootStackParamList, 'AdminChatSettings'>

/**
 * チェックボックスのタップ範囲を広げるために
 */
const PADDING_TO_TAP = 10000

export const ChatUserItem = React.memo((props: WorkerUIType) => {
    const { t } = useTextTranslation()

    const { workerId, name, imageUrl, company, selected, roomRole, isShowSelected, onSelect, onRemove, iconSize } = props

    const _iconSize = iconSize ?? 40
    const _imageUri = (_iconSize <= 30 ? props?.xsImageUrl : _iconSize <= 50 ? props?.sImageUrl : props?.imageUrl) ?? props?.imageUrl
    const _imageColorHue = props?.imageColorHue

    return (
        <View style={[styles.container]}>
            {isShowSelected && (
                <Checkbox
                    size={20}
                    style={{
                        alignItems: 'center',
                        // marginLeft: 10,
                        paddingVertical: 40,
                        padding: 10,

                        paddingRight: PADDING_TO_TAP,
                    }}
                    checked={selected}
                    onChange={(value) => {
                        if (onSelect && workerId) onSelect(workerId)
                    }}
                />
            )}
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginLeft: isShowSelected ? -PADDING_TO_TAP : 0,
                    zIndex: -1,
                }}
                // onPress={() => {
                // 	navigation.push('WorkerDetailRouter', {
                // 		workerId: workerId,
                // 		title: name,
                // 	})
                // }}
            >
                <View style={{ alignItems: 'center' }}>
                    <ImageIcon
                        imageUri={_imageUri}
                        imageColorHue={_imageColorHue}
                        type={'worker'}
                        size={_iconSize}
                        style={{ width: _iconSize, height: _iconSize, marginRight: 10 }}
                        borderRadius={_iconSize}
                        borderWidth={1}
                    />
                    {roomRole && (
                        <Tag
                            tag={roomRole == 'admin' ? t('admin:RoomManager') : t('common:General')}
                            color={roomRole == 'admin' ? THEME_COLORS.OTHERS.CUSTOMER_PURPLE : THEME_COLORS.OTHERS.BLACK}
                            fontSize={7}
                            style={{ marginRight: 8, marginTop: -12, height: 16 }}
                        />
                    )}
                </View>

                <View style={styles.content}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: SUB_ITEM_WIDTH - 70 }}>
                        <View>
                            <Text style={styles.title}>{name}</Text>
                            <Text style={styles.subtitle} numberOfLines={1} ellipsizeMode="tail">
                                {company?.name || ''}
                            </Text>
                        </View>
                        {roomRole != 'admin' && onRemove != undefined && (
                            <Pressable onPress={onRemove}>
                                <VectorIcon.Feather name="trash-2" color={THEME_COLORS.BLUE.MIDDLE_DEEP} size={20} />
                            </Pressable>
                        )}
                    </View>
                </View>
            </View>
        </View>
    )
})

const SUB_ITEM_WIDTH = SCREEN_WIDTH - 30
const styles = StyleSheet.create({
    container: {
        width: SUB_ITEM_WIDTH,
        height: 60,
        alignItems: 'center',
        borderRadius: 3,
        marginBottom: 10,
        backgroundColor: '#FFF',
        flexDirection: 'row',
        paddingBottom: 8,
    },
    content: {
        width: SUB_ITEM_WIDTH,
        justifyContent: 'space-between',
    },
    title: {
        ...GlobalStyles.mediumText,
    },
    subtitle: {
        ...GlobalStyles.smallGrayText,
        marginTop: 2,
    },
})
