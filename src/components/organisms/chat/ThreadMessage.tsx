import React, { useMemo } from 'react'
import { Pressable, Text, View, ViewStyle } from 'react-native'

import { FontStyle } from '../../../utils/Styles'
import _ from 'lodash'

import { THEME_COLORS, WINDOW_WIDTH } from '../../../utils/Constants'
import { ImageIcon } from '../ImageIcon'
import { MessageCLType, MessageType } from '../../../models/message/Message'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { Reaction } from './Reaction'
import { Line } from '../../atoms/Line'
import { CustomDate, newCustomDate, timeText, toCustomDateFromTotalSeconds } from '../../../models/_others/CustomDate'
import { AppButton } from '../../atoms/AppButton'
import { ThreadLogType } from '../../../models/threadLog/ThreadLog'

export type ThreadMessageProps = {
    threadLog?: ThreadLogType
    iconSize?: number
    style?: ViewStyle
    onReplyPress?: ()=> void
    onReadThread?: ()=> void
}

export const ThreadMessage = React.memo((props: Partial<ThreadMessageProps>) => {
    let { threadLog, style, iconSize, onReplyPress, onReadThread } = props
    iconSize = iconSize ?? 40
    const message = threadLog?.message
    const _imageUri = (iconSize <= 30 ? message?.worker?.xsImageUrl : iconSize <= 50 ? message?.worker?.sImageUrl : message?.worker?.imageUrl) ?? message?.worker?.imageUrl
    const _threadHeadImageUri = (iconSize <= 30 ? message?.threadHead?.lastMessage?.worker?.xsImageUrl : iconSize <= 50 ? message?.threadHead?.lastMessage?.worker?.sImageUrl : message?.threadHead?.lastMessage?.worker?.imageUrl) ?? message?.threadHead?.lastMessage?.worker?.imageUrl

    const reactionChars: string[] = []
    const reactionCount: number[] = []

    const checkSameReaction = (reactionChar: string): [boolean, number] => {
        let hitFlag: boolean = false
        let hitIndex: number = -1

        reactionChars.forEach((char, index) => {
            if (char == reactionChar) {
                hitFlag = true
                hitIndex = index
            }
        })
        return [hitFlag, hitIndex]
    }

    const sumReaction = () => {
        message?.reactions?.items?.forEach(reaction => {
            const ret = checkSameReaction(reaction.reactionChar as string)
            if (ret[0] == false) {
                reactionChars.push(reaction.reactionChar as string)
                reactionCount.push(1)
            }
            else {
                reactionCount[ret[1]] += 1
            }
        });
    }
    sumReaction()


    const _getRoomSubTitle = () => {
        let rtnStr = threadLog?.room?.roomType?.toString()
        if (threadLog?.room?.roomType == 'company') {
            rtnStr = '個別 : 取引先'
        }
        if (threadLog?.room?.roomType == 'custom') {
            rtnStr = '個別 : カスタムグループ'
        }
        if (threadLog?.room?.roomType == 'onetoone') {
            rtnStr = '個別 : 個人'
        }
        if (threadLog?.room?.roomType == 'contract') {
            rtnStr = '案件/工事 : 案件'
        }
        if (threadLog?.room?.roomType == 'construction') {
            rtnStr = '案件/工事 : 工事'
        }

        return rtnStr
    }

    const createdAt = useMemo(() => message?.createdAt ? toCustomDateFromTotalSeconds(message?.createdAt) : undefined, [message?.createdAt])


    return (
        <View
            style={[
                {
                    flexDirection: 'column',
                    borderBottomColor: THEME_COLORS.OTHERS.LIGHT_GRAY,
                    borderBottomWidth: 0.3,
                },
                style,
            ]}>
            <View
                style={{}}    
            >
                <Text
                    style={{
                        fontFamily: FontStyle.bold
                    }}
                >
                    {threadLog?.room?.name}
                </Text>
                <Text
                    style={{
                        marginTop: 3,
                        fontSize: 9,


                    }}
                >
                    {_getRoomSubTitle()}
                </Text>
            </View>

            <Pressable
                style={{
                    flexDirection: 'row',
                    marginVertical: 8,
                }}
                onPress={()=> {}}
            >

                <View
                    style={{
                        alignItems: 'center',
                    }}>
                    <ImageIcon imageColorHue={message?.worker?.imageColorHue} imageUri={_imageUri} type={'worker'} size={iconSize} style={{marginTop: -4}}/>
                </View>

                <View
                    style={{
                        marginLeft: 10,
                        justifyContent: 'center',
                    }}>
                    <View
                        style={{
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            paddingRight: 6,
                        }}>
                        <Text
                            numberOfLines={1}
                            ellipsizeMode={'middle'}
                            style={{
                                fontFamily: FontStyle.bold,
                                fontSize: 12,
                                lineHeight: 14,
                                width: WINDOW_WIDTH - 110,
                            }}>
                            {message?.worker?.name}
                        </Text>
                        <Text
                            ellipsizeMode={'middle'}
                            style={{
                                fontFamily: FontStyle.regular,
                                marginTop: 6,
                                fontSize: 12,
                                lineHeight: 16,
                                width: WINDOW_WIDTH - 110,
                            }}>
                            {message?.message}
                        </Text>
                    </View>
                    <View
                        style={{
                            flexDirection: 'row',
                            marginTop: 8,
                        }}
                    >
                        {reactionChars.length > 0 && 
                            reactionChars.map((char, index) => { 
                                return <Reaction 
                                            char={char} 
                                            count={reactionCount[index]} 
                                            style={{marginRight: 10}}
                                        />
                            })
                        }
                    </View>
                </View>
                <View
                    style={{
                        alignItems: 'flex-end',
                        marginTop: 10,
                        marginRight:4,
                    }}
                >
                    <View>
                        <Text
                            style={{
                                color: THEME_COLORS.OTHERS.GRAY,
                                fontSize: 10,
                            }}
                        >
                            {timeText(createdAt ?? newCustomDate()).substring(0, 5)}
                        </Text>
                    </View>
                    <View>
                        <Text
                            style={{
                                color: THEME_COLORS.OTHERS.GRAY,
                                fontSize: 10,
                            }}
                        >
                            既読{message?.readCount}
                        </Text>
                    </View>
                </View>
            </Pressable>
            <View
                style={{
                    marginTop: 0,
                    flexDirection: 'column',
                }}
            >
                <Pressable
                    style={{
                        marginBottom: 7,
                    }}
                    onPress={()=> {
                        if (onReadThread) {
                            onReadThread()
                        }
                    }}
                >
                    <Text
                        numberOfLines={1}
                        ellipsizeMode={'middle'}
                        style={{
                            fontFamily: FontStyle.bold,
                            color: THEME_COLORS.BLUE.MIDDLE,
                            fontSize: 12,
                            lineHeight: 14,
                            marginLeft: 0,
                            paddingTop: 4,
                        }}>
                        その他のメッセージを読む
                    </Text>
                </Pressable>

                <AppButton
                    isGray={true}
                    height={30}
                    fontSize={13}
                    title={'返信する'}
                    style={{
                        flex: 1,
                        marginLeft: 0,
                        marginBottom: 20,
                        marginTop: 8,
                        width: 90,
                    }}
                    onPress={() => {
                        if (onReplyPress) {
                            onReplyPress()
                        }
                    }}
                />

            </View>
            
        </View>

    )
})
