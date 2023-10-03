import React, { useState, useEffect } from 'react'
import { Text, View, ViewStyle } from 'react-native'
import { GlobalStyles } from '../../utils/Styles'
import { WINDOW_HEIGHT, WINDOW_WIDTH } from '../../utils/Constants'
import AnimatedLottieView from 'lottie-react-native'

export type LoadingScreenProps = {
    isUnTouchable?: boolean
    loadingString?: string | undefined
    style?: ViewStyle
}

export const LoadingScreen = React.memo((props: LoadingScreenProps) => {
    const { style, isUnTouchable, loadingString } = props
    const [animation, setAnimation] = useState<AnimatedLottieView | undefined>(undefined)
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
            pointerEvents={isUnTouchable ? 'auto' : 'box-none'}
            style={[
                {
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: WINDOW_WIDTH,
                    height: WINDOW_HEIGHT,
                },
                style,
            ]}
        >
            <AnimatedLottieView
                ref={(anim) => {
                    setAnimation(anim ?? undefined)
                }}
                style={{
                    width: WINDOW_WIDTH / 10,
                    height: WINDOW_WIDTH / 10,
                    zIndex: 1,
                }}
                source={require('./../../../assets/animations/loading.json')}
            />
            {loadingString != undefined && loadingString != '' && (
                <View
                    style={{
                        marginTop: 30,
                        backgroundColor: '#000',
                        paddingHorizontal: 15,
                        paddingVertical: 5,
                        borderRadius: 30,
                    }}
                >
                    <Text
                        style={{
                            color: '#fff',
                            ...GlobalStyles.smallText,
                        }}
                    >
                        {loadingString}
                    </Text>
                </View>
            )}
        </View>
    )
})
