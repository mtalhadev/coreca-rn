import React, { useMemo } from 'react'
import { Text, Pressable, View, ViewStyle } from 'react-native'

import { GlobalStyles, FontStyle } from '../../../utils/Styles'

import { THEME_COLORS } from '../../../utils/Constants'
import { ImageIcon } from '../ImageIcon'

import { ResponsibleTag } from './ResponsibleTag'
import { Badge } from '../../atoms/Badge'
import { WorkerTagType } from '../../../models/worker/WorkerTagType'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { Tag } from '../Tag'

export type WorkerIconDisplayUIType = 'worker' | 'company'
/**
 * isApproval - typeがcompanyの場合の常用依頼の承認状況
 */
export type WorkerIconUIType = {
    workerId?: string
    companyId?: string
    type?: WorkerIconDisplayUIType
    imageUrl?: string | undefined
    sImageUrl?: string | undefined
    xsImageUrl?: string | undefined
    name?: string
    nickname?: string
    isFakeCompany?: boolean
    isOfficeWorker?: boolean
    imageColorHue?: number
    workerTags?: WorkerTagType[]
    batchCount?: number
    isApplication?: boolean
    isApproval?: boolean | 'waiting'
}

export type WorkerIconProps = {
    worker?: WorkerIconUIType
    imageSize?: number
    style?: ViewStyle
    onPress?: () => void
    onLongPress?: () => void
    isChargeCompany?: boolean
}

export const WorkerIcon = React.memo((props: Partial<WorkerIconProps>) => {
    let { worker, imageSize, onPress, onLongPress, isChargeCompany, style } = props
    imageSize = imageSize ?? 30
    const minFontSize = 10
    const fontSize = imageSize / 4 >= minFontSize ? minFontSize : imageSize / 4
    const _imageUri = useMemo(() => (imageSize ? (imageSize <= 30 ? worker?.xsImageUrl : imageSize <= 50 ? worker?.sImageUrl : worker?.imageUrl) ?? worker?.imageUrl : undefined), [imageSize, worker])
    const { t } = useTextTranslation()
    const pressableWidth = imageSize * (imageSize == 30 && worker?.isApplication && (worker?.isApproval === 'waiting' || worker?.isApproval === false) ? 1.4 : 1.2)

    return (
        <Pressable
            onPress={() => {
                if (onPress) {
                    onPress()
                }
            }}
            onLongPress={() => {
                if (onLongPress) {
                    onLongPress()
                }
            }}
            style={[
                {
                    flexDirection: 'column',
                    width: pressableWidth,
                    paddingTop: 2,
                    alignItems: 'center',
                },
                style,
            ]}>
            {worker?.type == 'company' && worker?.batchCount != undefined && (
                <Badge
                    batchCount={worker?.batchCount ?? 0}
                    size={imageSize / 2 >= 20 ? 20 : imageSize / 2}
                    color={THEME_COLORS.BLUE.MIDDLE}
                    fontSize={imageSize / 3.5 >= 10 ? 10 : imageSize / 3.5}
                    style={{
                        top: 0,
                        right: 0,
                        zIndex: 1,
                        position: 'absolute',
                    }}
                />
            )}
            <ImageIcon imageUri={_imageUri} imageColorHue={worker?.imageColorHue} type={worker?.type} size={imageSize} />
            {(worker?.workerTags?.includes('is-site-manager') || isChargeCompany) && (
                <ResponsibleTag
                    fontSize={fontSize - 2}
                    style={{
                        marginTop: -13,
                    }}
                />
            )}
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    width: pressableWidth,
                }}>
                {worker?.isFakeCompany && (
                    <View
                        style={{
                            backgroundColor: THEME_COLORS.OTHERS.BORDER_COLOR,
                            paddingVertical: 1,
                            paddingHorizontal: 3,
                            marginRight: 2,
                            borderRadius: 3,
                            marginTop: 3,
                            justifyContent: 'center',
                            alignItems: 'center',
                            width: 14,
                        }}>
                        <Text
                            style={{
                                ...GlobalStyles.normalText,
                                fontSize: 8,
                                lineHeight: 10,
                                color: THEME_COLORS.OTHERS.BLACK,
                            }}>
                            {t('common:Temporary')}
                        </Text>
                    </View>
                )}
                <Text
                    ellipsizeMode={'tail'}
                    numberOfLines={2}
                    style={{
                        fontSize,
                        color: worker?.name ? '#000' : THEME_COLORS.OTHERS.GRAY,
                        fontFamily: FontStyle.regular,
                        lineHeight: fontSize + 2,
                        marginTop: imageSize / 15,
                        textAlign: 'center',
                        width: pressableWidth + (worker?.isFakeCompany ? -14 : 0),
                    }}>
                    {worker?.nickname?.replace(/　/g, ' ') ?? worker?.name?.replace(/　/g, ' ') ?? '-'}
                </Text>
            </View>
            {worker?.type == 'company' && worker.isApplication && (worker?.isApproval === 'waiting' || worker?.isApproval === false) && (
                <Tag
                    fontSize={fontSize - 1}
                    tag={worker?.isApproval === 'waiting' ? `${t('common:waiting')}` : `${t('common:unauthorized')}`}
                    color={worker?.isApproval === 'waiting' ? THEME_COLORS.OTHERS.WARN_ORANGE : THEME_COLORS.OTHERS.LIGHT_GRAY}
                />
            )}
            {worker?.type == 'company' && worker?.isApplication == false && <Tag fontSize={fontSize - 1} tag={`${t('common:unapplied')}`} color={THEME_COLORS.OTHERS.ALERT_RED} />}
        </Pressable>
    )
})
