/* eslint-disable prefer-const */
import React, {  } from 'react'
import { Text, Pressable, View, ViewStyle, StyleSheet } from 'react-native'

import { FontStyle } from '../../../utils/Styles'
import { THEME_COLORS } from '../../../utils/Constants'
import { Icon } from '../../atoms/Icon'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
// import DatePicker from 'react-native-date-picker'

export type UnReportType = 'start' | 'end' | 'both'

export type UnReportAttendanceProps = {
    unReportedType: UnReportType
    onPress?: () => void
    style?: ViewStyle
}

export const UnReportAttendance = React.memo((props: Partial<UnReportAttendanceProps>) => {
    let { unReportedType, style, onPress } = props
    unReportedType = unReportedType ?? 'start'
    const { t } = useTextTranslation()

    return (
        <View
            style={[
                {
                    flexDirection: 'row',
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                },
                style,
            ]}
        >
            <Pressable
                onPress={() => {
                    if (onPress) {
                        onPress()
                    }
                }}
                style={({ pressed }) => ({
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 10,
                    paddingHorizontal: 7,
                    flex: 1,
                    opacity: pressed ? 0.7 : 1,
                    backgroundColor: unReportedType == 'end' ? undefined : THEME_COLORS.OTHERS.PURPLE_GRAY,
                    borderColor: unReportedType == 'end' ? THEME_COLORS.OTHERS.BORDER_COLOR : THEME_COLORS.OTHERS.BORDER_COLOR,
                    borderWidth: unReportedType == 'end' ? 0 : 1,
                    padding: 5,
                    borderRadius: 100,
                })}
            >
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        // marginLeft: 2,
                    }}
                >
                    <View
                        style={{
                            paddingHorizontal: unReportedType == 'end' ? 0 : 5,
                            paddingVertical: 2,
                            backgroundColor: unReportedType == 'end' ? undefined : THEME_COLORS.OTHERS.ALERT_RED,
                            borderRadius: 100,
                        }}
                    >
                        <Text
                            style={{
                                lineHeight: 12,
                                fontSize: 10,
                                fontFamily: FontStyle.regular,
                                color: unReportedType == 'end' ? '#888' : '#fff',
                            }}
                        >
                            {unReportedType == 'end' ? t('common:Reported') : t('common:Unreported')}
                        </Text>
                    </View>
                    <Text
                        style={{
                            lineHeight: 15,
                            fontSize: 12,
                            marginLeft: 5,
                            color: unReportedType == 'end' ? '#888' : '#000',
                            fontFamily: FontStyle.regular,
                        }}
                    >
                        {t('common:AssignmentStart')}{' '}
                    </Text>
                </View>

                <Icon name={'edit'} width={14} height={14} fill={unReportedType == 'end' ? '#888' : '#000'} />
            </Pressable>
            <View
                style={{
                    borderLeftWidth: 1,
                    height: 30,
                    marginTop: 10,
                    marginHorizontal: 10,
                    borderColor: THEME_COLORS.OTHERS.BORDER_COLOR,
                }}
            ></View>
            <Pressable
                onPress={() => {
                    if (onPress) {
                        onPress()
                    }
                }}
                style={({ pressed }) => ({
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 10,
                    paddingHorizontal: 7,
                    flex: 1,
                    opacity: pressed ? 0.7 : 1,
                    backgroundColor: unReportedType == 'start' ? undefined : THEME_COLORS.OTHERS.PURPLE_GRAY,
                    borderColor: unReportedType == 'start' ? THEME_COLORS.OTHERS.BORDER_COLOR : THEME_COLORS.OTHERS.BORDER_COLOR,
                    borderWidth: unReportedType == 'start' ? 0 : 1,
                    padding: 5,
                    borderRadius: 100,
                })}
            >
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        // marginLeft: 2,
                    }}
                >
                    <View
                        style={{
                            paddingHorizontal: unReportedType == 'start' ? 0 : 5,
                            paddingVertical: 2,
                            backgroundColor: unReportedType == 'start' ? undefined : THEME_COLORS.OTHERS.ALERT_RED,
                            borderRadius: 100,
                        }}
                    >
                        <Text
                            style={{
                                lineHeight: 12,
                                fontSize: 10,
                                fontFamily: FontStyle.regular,
                                color: unReportedType == 'start' ? '#888' : '#fff',
                            }}
                        >
                            {unReportedType == 'start' ? t('common:Reported') : t('common:Unreported')}
                        </Text>
                    </View>
                    <Text
                        style={{
                            lineHeight: 15,
                            fontSize: 12,
                            marginLeft: 5,
                            color: unReportedType == 'start' ? '#888' : '#000',
                            fontFamily: FontStyle.regular,
                        }}
                    >
                        {t('common:EndOfWork')}{' '}
                    </Text>
                </View>

                <Icon name={'edit'} width={14} height={14} fill={unReportedType == 'start' ? '#888' : '#000'} />
            </Pressable>
        </View>
    )
})

const styles = StyleSheet.create({})
