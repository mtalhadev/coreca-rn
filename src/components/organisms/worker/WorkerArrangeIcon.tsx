import React, { useMemo } from 'react'
import { Pressable, View, ViewStyle } from 'react-native'

import { THEME_COLORS } from '../../../utils/Constants'
import { Tag } from '../Tag'

import { WorkerIcon, WorkerIconUIType } from './WorkerIcon'
import { useTextTranslation } from '../../../fooks/useTextTranslation'

export type WorkerArrangeIconUIType = {
    dailyArrangeCount?: number
    isFakeCompany?: boolean
    arrangeCount?: number
    respondCount?: number
} & WorkerIconUIType
/**
 * isChargeCompany - 責任者のいる依頼先の会社かどうか
 */
export type WorkerArrangeIconProps = {
    worker?: WorkerArrangeIconUIType
    imageSize?: number
    update?: number
    arrangeType: 'pre' | 'post'
    style?: ViewStyle
    onPress?: () => void
    onLongPress?: () => void
    isChargeCompany?: boolean
}

export const WorkerArrangeIcon = React.memo((props: Partial<WorkerArrangeIconProps>) => {
    let { worker, imageSize, onPress, onLongPress, update, style, arrangeType, isChargeCompany } = props
    imageSize = imageSize ?? 43
    const isManager = useMemo(() => worker?.workerTags?.includes('manager'), [worker])
    const isOfficeWorker = useMemo(() => (worker?.isOfficeWorker ?? true) && worker?.type !== 'company', [worker])
    const isHoliday = useMemo(() => worker?.workerTags?.includes('is-holiday'), [worker])
    const { t } = useTextTranslation()
    if (imageSize < 10) {
        //アイコンサイズの最小値
        imageSize = 10
    }
    return (
        <>
            {/* exclude office workers */}
            {!isOfficeWorker && (
                <View
                    style={{
                        ...style,
                    }}>
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
                        style={{
                            flexDirection: 'column',
                            position: 'absolute',
                            zIndex: 1,
                            flex: 1,
                            alignItems: 'flex-end',
                            right: 0,
                        }}>
                        {worker?.type == 'worker' && worker?.dailyArrangeCount != undefined && worker?.dailyArrangeCount >= (arrangeType == 'pre' ? 1 : 2) && (
                            <Tag
                                style={{
                                    marginTop: 1,
                                    borderWidth: 1,
                                    borderColor: '#fff',
                                }}
                                fontSize={8}
                                tag={`${t('common:Today')}${worker.dailyArrangeCount}`}
                                color={THEME_COLORS.OTHERS.LINK_BLUE}
                            />
                        )}
                        {isHoliday == true && (
                            <Tag
                                style={{
                                    marginTop: 1,
                                    borderWidth: 1,

                                    borderColor: '#fff',
                                }}
                                tag={t('common:Holiday')}
                                fontSize={8}
                                color={THEME_COLORS.OTHERS.BLACK}
                            />
                        )}
                        {isManager == true && (
                            <Tag
                                style={{
                                    marginTop: 1,
                                    borderWidth: 1,

                                    borderColor: '#fff',
                                }}
                                tag={t('common:Manager')}
                                fontSize={8}
                                color={THEME_COLORS.OTHERS.BLACK}
                            />
                        )}
                        {worker?.isFakeCompany != true &&
                            worker?.type == 'company' &&
                            arrangeType == 'post' &&
                            worker?.respondCount != undefined &&
                            worker?.respondCount >= 0 &&
                            worker.isApproval == true &&
                            worker?.isApplication == true && (
                                <Tag
                                    fontSize={8}
                                    tag={`${t('common:Response')}${worker.respondCount}`}
                                    color={(worker?.arrangeCount ?? 0) - worker.respondCount <= 0 ? THEME_COLORS.OTHERS.BLACK : THEME_COLORS.OTHERS.ALERT_RED}
                                    style={{
                                        marginTop: 22,
                                    }}
                                />
                            )}
                    </Pressable>
                    <WorkerIcon
                        worker={{ ...worker, batchCount: arrangeType == 'post' ? worker?.arrangeCount : undefined }}
                        imageSize={imageSize}
                        onPress={onPress}
                        onLongPress={onLongPress}
                        isChargeCompany={isChargeCompany}
                    />
                </View>
            )}
        </>
    )
})
