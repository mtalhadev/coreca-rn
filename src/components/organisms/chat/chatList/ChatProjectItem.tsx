import { sortBy, sum } from 'lodash'
import React, { useEffect, useMemo, useState } from 'react'
import { FlatList, StyleSheet, Text, View } from 'react-native'
import { Avatar } from 'react-native-paper'
import { Badge } from '../../../atoms/Badge'
import { ImageIcon } from '../../ImageIcon'
import { ShadowBoxWithHeaderAndToggle } from '../../shadowBox/ShadowBoxWithHeaderAndToggle'
import { newCustomDate } from '../../../../models/_others/CustomDate'
import { SCREEN_WIDTH, THEME_COLORS } from '../../../../utils/Constants'
import { FontStyle, GlobalStyles } from '../../../../utils/Styles'
import { ProjectConstructionUIType } from './ChatProjectList'
import RoomUserItem, { getRoomName } from './RoomUserItem'
import { useTextTranslation } from '../../../../fooks/useTextTranslation'

export const ChatProjectItem = React.memo((props: ProjectConstructionUIType) => {
    const { projectId, name, companyName, project, roomUsers, lastMessage: lastMsg, onEnter  } = props
    const unreadCount = useMemo(() => sum(roomUsers.map((roomUser) => roomUser.unreadCount || 0)), [roomUsers])
	const sortedRoomUsers = useMemo(() => sortBy(roomUsers, (item) => item.updatedAt?.totalSeconds), [roomUsers])
    const iconSize = 30
    const _imageUri = (iconSize <= 30 ? project?.xsImageUrl : iconSize <= 50 ? project?.sImageUrl : project?.imageUrl) ?? project?.imageUrl

	const { t } = useTextTranslation()

    const [lastMessage, setLastMessage] = useState<string>('');

    useEffect(() => {
        setLastMessage(lastMsg ?? '')
    }, [lastMsg]);

    return (
        <ShadowBoxWithHeaderAndToggle
            style={{
                width: SCREEN_WIDTH - 20,
                backgroundColor: '#FFF',
                paddingHorizontal: 10,
				paddingBottom: 5,
                marginVertical: 2,
            }}
            children={
                <View style={{ }}>
                    <View
                        style={{
                            borderRadius: 10,
                            // width: SCREEN_WIDTH - 40,
                            // height: 70,
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            // marginVertical: 5,
                            backgroundColor: '#FFF',
                            flexDirection: 'row',
                        }}>
                        <ImageIcon imageColorHue={project?.imageColorHue} imageUri={_imageUri} type={'project'} size={iconSize} style={{ marginTop: -4, marginRight: 10 }} />
                        <View
                            style={{
                                // width: SCREEN_WIDTH - 55 - 65,
                                // height: 50,
                                justifyContent: 'flex-start',
                            }}>
                            <Text
                                style={{
                                    ...GlobalStyles.mediumText,
                                    width: SCREEN_WIDTH - 55 - 65,
                                    color: '#000',
                                }}
                                ellipsizeMode="middle"
                                numberOfLines={1}>
                                {name}
                            </Text>
                            <Text
                                style={{
                                    ...GlobalStyles.smallGrayText,
                                    marginTop: 3,
                                    fontSize: 11,
                                    lineHeight: 13
                                }}
                                numberOfLines={1}
                                ellipsizeMode="tail">
                                {`${t('common:Client')}:  ${companyName}`}
                            </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end', justifyContent: 'space-between', height: 60, marginRight: 10 }}>
                            {unreadCount > 0 && <Badge batchCount={unreadCount} size={24}/>}
                            {/* {
                            collapsed ?
                            <VectorIcon.Material name={'keyboard-arrow-down'} size={20} color={THEME_COLORS.OTHERS.GRAY} onPress={toggleCollapsed} />
                            :
                            <VectorIcon.Material name={'keyboard-arrow-up'} size={20} color={THEME_COLORS.OTHERS.GRAY} onPress={toggleCollapsed}/>
                        } */}
                        </View>
                    </View>
                    { 
                    lastMessage.length>0 && 
                    <Text
                        style={{
                            ...GlobalStyles.mediumText,
                            width: SCREEN_WIDTH - 55,
                            color: '#666',
                            marginBottom: 10,
                            marginTop: -4
                        }}
                        ellipsizeMode="middle"
                        numberOfLines={1}>
                        {lastMessage}
                    </Text>
                    }
                </View>

            }
            hideChildren={
                <View
                    style={{
                        // padding: 10,
                        // backgroundColor: 'transparent',
                        // paddingBottom: 8,
                    }}>
                    <FlatList
                        data={sortedRoomUsers}
                        renderItem={(data) => {
                            const item = data.item
                            return (
                                <RoomUserItem
									style={{
										marginBottom: 4,
									}}
                                    roomId={item.roomId}
                                    rootThreadId={item.rootThreadId}
                                    key={item.roomId}
                                    roomType={item.roomType}
                                    name={item.name ?? 'no-name'}
                                    companyName={item.companyName ?? 'no-name'}
                                    lastMessage={item.lastMessage ?? ''}
                                    updatedAt={item.updatedAt ?? newCustomDate()}
                                    unreadCount={item.unreadCount ?? 0}
                                    onEnter={() => {
                                        if (onEnter) {
                                            onEnter(item.roomId, item.rootThreadId, getRoomName(item))
                                        }
                                    }}
                                    onUpdate={(lastMsg) => {
                                        setLastMessage(lastMsg)
                                    }}
                                />
                            )
                        }}
                    />
                </View>
            }
        />
    )
})
