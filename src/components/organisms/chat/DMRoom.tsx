import React, { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Badge } from '../../atoms/Badge'
import { Chip } from '../../atoms/Chip'
import { ImageIcon } from '../ImageIcon'
import { SCREEN_WIDTH, THEME_COLORS } from '../../../utils/Constants'
import { FontStyle, GlobalStyles } from '../../../utils/Styles'
import { RoomUserUIType } from './chatList/ChatProjectList'
import { CustomDate, dayBaseTextWithoutDate, newCustomDate, timeText } from '../../../models/_others/CustomDate'
import { Tag } from '../Tag'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { _getFirestore } from '../../../services/firebase/FirestoreService'
import { RoomType } from '../../../models/room/Room'

export const DMRoom = React.memo((props: RoomUserUIType) => {
    const { roomId, rootThreadId, roomType, name, unreadCount, lastMessage: _lastMessage, companyName, company, worker, room, updatedAt, onEnter } = props
    let labelColor: string
    let chipTextColor: string = THEME_COLORS.OTHERS.BLACK
    let typeName: 'company' | 'project' | 'worker' = 'company'
    let chipName: string = ''
    let _imageUri: string | undefined
    let _imageColorHue: number | undefined
    let iconSize = 40

	const {t} = useTextTranslation()
    labelColor = THEME_COLORS.OTHERS.CUSTOMER_PURPLE
    _imageColorHue = 50
    if (roomType === 'company') {
        labelColor = THEME_COLORS.OTHERS.CUSTOMER_PURPLE
        chipTextColor = '#fff'
        typeName = 'company'
        chipName = '取引先'
        _imageUri = (iconSize <= 30 ? company?.xsImageUrl : iconSize <= 50 ? company?.sImageUrl : company?.imageUrl) ?? company?.imageUrl
        _imageColorHue = company?.imageColorHue
    } else if (roomType === 'onetoone') {
        labelColor = THEME_COLORS.OTHERS.LIGHT_GREEN
        typeName = 'worker'
        chipName = '個人'
        _imageUri = (iconSize <= 30 ? worker?.xsImageUrl : iconSize <= 50 ? worker?.sImageUrl : worker?.imageUrl) ?? worker?.imageUrl
        _imageColorHue = worker?.imageColorHue
    } else if (roomType === 'custom') {
        labelColor = THEME_COLORS.OTHERS.LIGHT_PINK
        typeName = 'worker'
        chipName = 'カスタム'
        _imageUri = (iconSize <= 30 ? room?.xsImageUrl : iconSize <= 50 ? room?.sImageUrl : room?.imageUrl) ?? room?.imageUrl
        _imageColorHue = room?.imageColorHue
    }

    const editLastUpdate = (date: CustomDate | undefined): string => {
        date = date ?? newCustomDate()
        const day = dayBaseTextWithoutDate(date).substring(5)
        const time = timeText(date).substring(0, 5)
        return day + ' ' + time
    }

    let badge: any
    if (unreadCount && unreadCount > 0) {
        badge = <Badge batchCount={unreadCount} size={20} />
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
            })
        return () => {
            listener && listener()
        }
    }, [])

    return (
        <Pressable
            onPress={() => {
                if (onEnter) {
                    onEnter(roomId, rootThreadId, name ?? 'no-name')
                }
            }}
            style={{
				alignItems: 'center',
				marginBottom: 10,
				backgroundColor: '#FFF',
				flexDirection: 'row',
				borderBottomColor: THEME_COLORS.OTHERS.BORDER_COLOR,
				borderBottomWidth: 1,
				paddingBottom: 8,
				flex: 1,
				marginHorizontal: 15
			}}>
            <View style={{ alignItems: 'center' }}>
                <ImageIcon
                    imageUri={_imageUri}
                    imageColorHue={_imageColorHue}
                    type={typeName}
                    size={iconSize}
                    style={{ width: iconSize, height: iconSize, marginRight: 10 }}
                    borderRadius={iconSize}
                    borderWidth={1}
                />
                <Tag tag={chipName} fontColor={chipTextColor} fontSize={7} color={labelColor} style={{ marginRight: 8, marginTop: -12, height: 16, borderColor: '#fff', borderWidth: 1 }} />
            </View>
            <View
                style={{
                    flexDirection: 'column',
					flex: 1,
                }}>
                <View
                    style={{
                        flexDirection: 'row',
						justifyContent: 'space-between'
                    }}>
                    <Text style={styles.title}>
                        {name}
                    </Text>
                    <View style={{
						marginTop: -3,
						marginRight: 0
					}}>
                        {badge}
                    </View>
                    {/* <Text>{roomId.substring(0, 20)}</Text> */}
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 }}>
				    <Text
                        style={{
                            ...GlobalStyles.smallGrayText,
                            marginLeft: 2,
                        }}
                        numberOfLines={1}
                        ellipsizeMode="tail">
                        {(lastMessage != undefined && lastMessage.length > 0) ? lastMessage : t('admin:NoChatMessage')}
                    </Text>

                    {lastMessage && (
                        <Text
                            style={{
                                ...GlobalStyles.smallGrayText,
                                fontSize: 10,
                                lineHeight: 12,
                            }}>
                            {editLastUpdate(updatedAt)}
                        </Text>
                    )}
                </View>
            </View>
        </Pressable>
    )
})

const SUB_ITEM_WIDTH = SCREEN_WIDTH - 20
const styles = StyleSheet.create({
    username: {
        fontFamily: FontStyle.medium,
        fontSize: 14,
        color: '#FFF',
    },
    title: {
        ...GlobalStyles.mediumText,
    },
    subtitle: {
        ...GlobalStyles.smallGrayText,
    },
    badge: {},
    time: {
        ...GlobalStyles.smallGrayText,
        fontSize: 9,
        lineHeight: 11,
    },
})
