import React from 'react'
import { Pressable, Text } from 'react-native'
import { useDispatch } from 'react-redux'
import * as Clipboard from 'expo-clipboard'

import { setToastMessage, ToastMessage } from '../../stores/UtilSlice'
import { THEME_COLORS } from '../../utils/Constants'
import { GlobalStyles } from '../../utils/Styles'
import { useTextTranslation } from '../../fooks/useTextTranslation'

type DisplayIdInDevProps = {
    label: string
    id: string
}

const DisplayIdInDev = ({ id, label }: Partial<DisplayIdInDevProps>) => {
    const dispatch = useDispatch()
    const { t } = useTextTranslation()

    return (
        <Pressable
            style={{
                marginTop: 30,
                margin: 10,
                padding: 10,
                backgroundColor: THEME_COLORS.OTHERS.BACKGROUND,
            }}
            onPress={async () => {
                await Clipboard.setStringAsync(id as string)
                dispatch(
                    setToastMessage({
                        text: `${t('common:IDCoppied')}${id}`,
                        type: 'success',
                    } as ToastMessage)
                )
            }}
        >
            <Text style={{ ...GlobalStyles.smallGrayText }}>
                {label}: {id}
            </Text>
        </Pressable>
    )
}

export default DisplayIdInDev

