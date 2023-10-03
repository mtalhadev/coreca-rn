import React from 'react'
import { ViewStyle } from 'react-native'

import { Tag } from '../Tag'
import { useTextTranslation } from '../../../fooks/useTextTranslation'

export type ResponsibleTagProps = {
    fontSize: number
    style?: ViewStyle
}

export const ResponsibleTag = React.memo((props: Partial<ResponsibleTagProps>) => {
    let { fontSize, style } = props
    fontSize = fontSize ?? 8
    const { t } = useTextTranslation()

    return (
        <Tag
            tag={t('common:PersonInChargeTag')}
            color={'#000'}
            fontColor={'#fff'}
            fontSize={fontSize}
            style={{
                paddingVertical: 1,
                paddingHorizontal: 5,
                marginTop: -8,
                ...style,
            }}
        />
    )
})
