import React from 'react'
import { View, ViewStyle } from 'react-native'

import { BlueColor, ColorStyle } from '../../../utils/Styles'
import { ShadowBox } from '../shadowBox/ShadowBox'
import { Line } from '../../atoms/Line'
import { Attendance } from '../attendance/Attendance'
import { SiteHeaderCL } from './SiteHeaderCL'
import { SiteCLType } from '../../../models/site/Site'
import { ArrangementCLType } from '../../../models/arrangement/Arrangement'
import { AppSide } from './SiteAttendance'

export type SiteProps = {
    site?: SiteCLType
    requestId?: string
    arrangement?: ArrangementCLType
    side?: AppSide
    canEditAttendance?: boolean
    canModifyAttendance?: boolean
    onPress: (site?: SiteCLType, requestId?: string) => void
    color?: ColorStyle
    style?: ViewStyle
}

export const Site = React.memo((props: Partial<SiteProps>) => {
    let { site, arrangement, color, side, requestId, canEditAttendance, canModifyAttendance, style, onPress } = props
    color = color ?? BlueColor
    return (
        <View style={[{}, style]}>
            <ShadowBox
                onPress={() => {
                    if (onPress) {
                        onPress(site, requestId)
                    }
                }}
                style={{
                    padding: 10,
                }}>
                <SiteHeaderCL
                    style={{
                        marginHorizontal: 5,
                    }}
                    site={site}
                />
                <Line
                    style={{
                        marginTop: 10,
                    }}
                />
                <Attendance
                    color={color}
                    canEdit={canEditAttendance}
                    canModifyAttendance={canModifyAttendance}
                    side={side ?? 'worker'}
                    siteId={site?.siteId}
                    arrangement={arrangement}
                    attendance={arrangement?.attendance}
                    style={{
                        marginTop: 10,
                    }}
                />
            </ShadowBox>
        </View>
    )
})
