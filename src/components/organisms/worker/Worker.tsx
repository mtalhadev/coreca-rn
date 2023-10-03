import React from 'react'
import { Pressable, Text, View, ViewStyle } from 'react-native'
import { useNavigation } from '@react-navigation/native'

import { FontStyle, GlobalStyles } from '../../../utils/Styles'
import { THEME_COLORS, WINDOW_WIDTH } from '../../../utils/Constants'
import { ImageIcon } from '../ImageIcon'
import { ResponsibleTag } from './ResponsibleTag'
import { WorkerTagList } from './WorkerTagList'
import { WorkerType } from '../../../models/worker/Worker'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { Icon } from '../../atoms/Icon'
import { departmentsToText } from '../../../usecases/worker/CommonWorkerCase'
import { timeBaseTextWithoutYear, toCustomDateFromTotalSeconds } from '../../../models/_others/CustomDate'

export type WorkerProps = {
    worker?: WorkerType
    siteId?: string
    iconSize?: number
    workerNameTextSize?: number
    style?: ViewStyle
    isEditable?: boolean
    isAttendance?: boolean
    lastLoggedInAt?: number
    isDisplayLastLoggedIn?: boolean
}

export const Worker = React.memo((props: Partial<WorkerProps>) => {
    let { worker, siteId, style, iconSize, workerNameTextSize, isEditable, isAttendance, isDisplayLastLoggedIn, lastLoggedInAt } = props
    iconSize = iconSize ?? 40
    const _imageUri = (iconSize <= 30 ? worker?.xsImageUrl : iconSize <= 50 ? worker?.sImageUrl : worker?.imageUrl) ?? worker?.imageUrl
    const navigation = useNavigation<any>()
    const { t } = useTextTranslation()

    const _workerTags = worker?.workerTags?.filter((tag) => tag != 'unregister')

    /**
     * (画面幅 - Workerのpaddingとmarginの合計（40） - アイコンサイズ - 編集ボタンの横幅（14） - タグの合計横幅（タグ数*45+margin） - 名前左マージン（5）)　/　当分して幅を指定するコンテンツの数
     */
    const contentsMaxWidth = WINDOW_WIDTH - 40 - iconSize - (isEditable ? 14 : 0) - ((_workerTags?.length ?? 0) > 0 ? (_workerTags?.length ?? 0) * 45 - 5 : 0) - 5 // / (worker?.company?.name ? 2 : 1)

    const isMyCompany = isAttendance ? worker?.company?.companyPartnership === 'my-company' : true

    return (
        <Pressable
            onPress={
                isEditable
                    ? () => {
                          if (worker?.nickname) {
                              navigation.push('EditNickname', {
                                  workerId: worker?.workerId,
                                  siteId: siteId,
                                  nickname: worker?.nickname,
                              })
                          } else {
                              navigation.push('EditName', {
                                  workerId: worker?.workerId,
                                  siteId: siteId,
                                  name: worker?.name,
                              })
                          }
                      }
                    : undefined
            }
            /*
            isEditableがfalseのときに上位のボタンが反応しなくなるので。
            2023.2.27
            Hiruma
            */
            disabled={!isEditable}
            style={[
                {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                },
                style,
            ]}>
            <View
                style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                }}>
                <View
                    style={{
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                    <ImageIcon imageColorHue={worker?.imageColorHue} imageUri={_imageUri} type={'worker'} size={iconSize} />
                    {_workerTags?.includes('is-site-manager') && <ResponsibleTag />}
                </View>

                <View
                    style={{
                        marginLeft: 5,
                        flexDirection: isMyCompany ? 'row' : 'column',
                        alignItems: isMyCompany ? 'center' : 'flex-start',
                        maxWidth: contentsMaxWidth,
                    }}>
                    <Text
                        numberOfLines={1}
                        ellipsizeMode={'middle'}
                        style={{
                            fontFamily: FontStyle.regular,
                            fontSize: workerNameTextSize ? workerNameTextSize : 12,
                            lineHeight: 14,
                        }}>
                        {worker?.nickname ?? worker?.name}
                    </Text>
                    {_workerTags !== undefined && (
                        <WorkerTagList
                            style={{
                                marginLeft: 10,
                            }}
                            types={_workerTags}
                        />
                    )}
                    {departmentsToText(worker?.departments?.items) !== '' && (
                        <View style={{}}>
                            <Text
                                numberOfLines={1}
                                ellipsizeMode={'middle'}
                                style={{
                                    fontFamily: FontStyle.regular,
                                    fontSize: 10,
                                    lineHeight: 14,
                                    marginLeft: isMyCompany ? 5 : 0,
                                    color: THEME_COLORS.OTHERS.GRAY,
                                }}>
                                {departmentsToText(worker?.departments?.items)}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
            {isDisplayLastLoggedIn && lastLoggedInAt && (
                <Text
                    numberOfLines={1}
                    ellipsizeMode={'middle'}
                    style={{
                        marginLeft: 10,
                        ...GlobalStyles.smallGrayText,
                        fontSize: 9,
                    }}>
                    {t('common:LastLoggedIn') + ' ' + timeBaseTextWithoutYear(toCustomDateFromTotalSeconds(lastLoggedInAt))}
                </Text>
            )}
            {isEditable && (
                <View
                    style={{
                        marginRight: 15,
                    }}>
                    <Icon width={14} height={14} name={'edit'} fill={'#000'} />
                </View>
            )}
        </Pressable>
    )
})
