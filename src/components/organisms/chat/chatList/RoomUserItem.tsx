import React, { useState } from 'react'
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native'
import { RoomEnumType, RoomType } from '../../../../models/room/Room'
import { CustomDate, dayBaseText, dayBaseTextWithoutDate, newCustomDate, timeBaseText, timeText } from '../../../../models/_others/CustomDate'
import { SCREEN_WIDTH, THEME_COLORS } from '../../../../utils/Constants'
import { FontStyle, GlobalStyles } from '../../../../utils/Styles'
import { Chip } from '../../../atoms/Chip'
import { RoomUserUIType } from './ChatProjectList'
import { Tag } from '../../Tag'
import { useTextTranslation } from '../../../../fooks/useTextTranslation'
import { _getFirestore } from '../../../../services/firebase/FirestoreService'
import { Badge } from '../../../atoms/Badge'

type RoomUserItemProps = {
    roomId: string
    rootThreadId: string
    roomType: RoomEnumType
    name: string
    companyName: string
    lastMessage: string
    updatedAt: CustomDate
    unreadCount: number
    style: ViewStyle
    onEnter: () => void
    onUpdate: (lastMessage: string) => void
}

const RoomUserItem = (props: RoomUserItemProps) => {
    const { roomId, roomType, name, companyName, style, lastMessage: _lastMessage, updatedAt, unreadCount, onEnter, onUpdate } = props
    const { t } = useTextTranslation()
    const editLastUpdate = (date: CustomDate | undefined): string => {
        date = date ?? newCustomDate()
        const day = dayBaseTextWithoutDate(date).substring(5)
        const time = timeText(date).substring(0, 5)

        return day + ' ' + time
    }

    let label: string = ''
    let labelColor: string = ''
    if (roomType == 'project') {
        label = t('admin:ProjectChatTag')
        labelColor = THEME_COLORS.OTHERS.LIGHT_PURPLE
    } else if (roomType == 'construction' || roomType == 'owner' || roomType == 'contract') {
        label = t('admin:ConstructionChatTag')
        labelColor = THEME_COLORS.OTHERS.LIGHT_ORANGE
    }

    const [lastMessage, setLastMessage] = useState<string>(_lastMessage ?? '');

    React.useEffect(() => {
        const db = _getFirestore()
        const listener = db.collection('Room')
            .where('roomId', '==', roomId)
            .onSnapshot((data) => {
                const room = data.docs.map((doc) => doc.data())[0] as RoomType | undefined
                console.log('>>>>>>> room: ', room);
                setLastMessage(room?.lastMessage ?? '');
                onUpdate(room?.lastMessage ?? '');
            })
        return () => {
            listener && listener()
        }
    }, [])

    return (
        <Pressable
            style={{
                ...style,
                // width: SUB_ITEM_WIDTH,
                alignItems: 'center',
                borderColor: '#999',
                borderWidth: 1,
                borderRadius: 10,
                backgroundColor: '#FFF',
                flexDirection: 'row',
                padding: 5,
                paddingTop: 1,
                paddingBottom: 3,
                flex: 1,
            }}
            onPress={() => onEnter()}>
            <View
                style={{
                    flex: 1,
                }}>
                <View
                    style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        /* justifyContent: 'space/-between', */
                    }}>
                    <View
                        style={{
                            flex: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}>
                        <Tag tag={label} color={labelColor} fontColor={THEME_COLORS.OTHERS.BLACK} style={{ marginRight: 8, height: 20, marginTop: 2, paddingTop: 2 }} />
                        <Text
                            style={{
                                ...GlobalStyles.smallText,
                                marginTop: 1,
                                width: SUB_ITEM_WIDTH - 120,
                            }}
                            numberOfLines={1}
                            ellipsizeMode="tail">
                            {getRoomName(props)}
                        </Text>
                    </View>
                    {unreadCount > 0 && <Badge batchCount={unreadCount} size={20} />}

                    {/* {(unreadCount != undefined && unreadCount > 0) && (
                        <View
                            style={{
                                marginRight: -11,
                                marginTop: -4,
                            }}>
                        </View>
                    )} */}
                </View>
                <View style={{ flexDirection: 'row', marginTop: 3, justifyContent: 'space-between', alignItems: 'center', flex: 1 }}>
                    <Text
                        style={{
                            ...GlobalStyles.smallGrayText,
                            marginLeft: 2,
                        }}
                        numberOfLines={1}
                        ellipsizeMode="tail">
                        {lastMessage.length > 0 ? lastMessage : t('admin:NoChatMessage')}
                    </Text>

                    {lastMessage && (
                        <Text
                            style={{
                                ...GlobalStyles.smallGrayText,
                                fontSize: 10,
                                lineHeight: 12,
                            }}
                            testID='updatedAt'>
                            {editLastUpdate(updatedAt)}
                        </Text>
                    )}
                </View>

                {/* <Text>{roomId.substring(0, 20)}</Text> */}
            </View>
            <View style={{ alignItems: 'flex-end', height: 48, marginRight: 10 }}></View>
        </Pressable>
    )
}

export const getRoomName = (roomUser: RoomUserUIType): string => {
    if (roomUser.roomType == 'project') {
        return roomUser.name ?? ''
    } else if (roomUser.roomType == 'construction' || roomUser.roomType == 'owner') {
        return roomUser.name ?? ''
    } else if (roomUser.roomType == 'contract') {
        return roomUser.name + ' ' + roomUser.companyName
    }

    return ''
}

const SUB_ITEM_WIDTH = SCREEN_WIDTH - 50
const styles = StyleSheet.create({})

export default RoomUserItem
