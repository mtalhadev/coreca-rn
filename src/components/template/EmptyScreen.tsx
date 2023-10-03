import React, { useState, useEffect } from 'react'
import { Text, View, ViewStyle } from 'react-native'

import { FontStyle } from '../../utils/Styles'

import { WINDOW_WIDTH } from '../../utils/Constants'
import AnimatedLottieView from 'lottie-react-native'
import { AppButton } from '../atoms/AppButton'
import { useTextTranslation } from '../../fooks/useTextTranslation'
import { IconName } from '../atoms/Icon'

export type EmptyScreenProps = {
    text?: string
    subText?: string
    addButtonText?: string
    onPress?: () => void
    iconName?: IconName | 'none'
    style?: ViewStyle
}

export const EmptyScreen = React.memo((props: EmptyScreenProps) => {
    const { t } = useTextTranslation()
    let { text, subText, addButtonText, onPress, iconName, style } = props
    const [animation, setAnimation] = useState<AnimatedLottieView | undefined>(undefined)
    text = text ?? t('common:DoesNotExist')
    addButtonText = addButtonText ?? t('common:Add')
    useEffect(() => {
        if (animation) {
            animation.play()
        }

        return () => {
            if (animation) {
                animation.pause()
            }
        }
    }, [animation])
    return (
        <View
            style={[
                {
                    // alignItems: 'center',
                    margin: 20,
                    marginTop: 40,
                    flex: 1,
                },
                style,
            ]}
        >
            <View
                style={{
                    alignItems: 'center',
                }}
            >
                <Text
                    style={{
                        fontFamily: FontStyle.medium,
                        fontSize: 14,
                        lineHeight: 18,
                    }}
                >
                    {text}
                </Text>
                {subText && (
                    <Text
                        style={{
                            fontFamily: FontStyle.medium,
                            fontSize: 14,
                            lineHeight: 18,
                        }}
                    >
                        {subText}
                    </Text>
                )}
                <AnimatedLottieView
                    ref={(anim) => {
                        setAnimation(anim ?? undefined)
                    }}
                    speed={0.5}
                    style={{
                        marginTop: 5,
                        width: WINDOW_WIDTH / 3,
                        height: WINDOW_WIDTH / 3,
                        // alignSelf: 'center'
                    }}
                    source={require('./../../../assets/animations/not-found.json')}
                />
            </View>

            {onPress != undefined && (
                <>
                    <AppButton
                        onPress={onPress}
                        title={addButtonText}
                        style={{
                            flex: 1,
                            marginTop: 40,
                            marginHorizontal: 20,
                        }}
                        iconName={iconName == 'none' ? undefined : iconName ?? 'plus'}
                    />
                </>
            )}
        </View>
    )
})
