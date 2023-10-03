import React from 'react'
import { Text, View, StyleSheet, Pressable, ViewStyle } from 'react-native'
import Modal from 'react-native-modal'
import { THEME_COLORS } from '../../utils/Constants'
import { AppButton } from '../atoms/AppButton'
import { FontStyle } from '../../utils/Styles'
import { IconName } from '../atoms/Icon'
import { useTextTranslation } from '../../fooks/useTextTranslation'

/**
 * onPress はモーダルのボタンを押した時の処理
 * onClose はモーダルを閉じる時の処理
 * isVisible はモーダルの表示・非表示
 * disabled はボタンの無効化
 * buttonTitle はボタンのタイトル
 * buttonIcon はボタンのアイコン
 * children はモーダルの中身
 * style はモーダルのスタイル
 */
export type BaseModalProps = {
    onPress?: () => void
    onClose?: () => void
    isVisible?: boolean
    disabled?: boolean
    buttonTitle?: string
    buttonIcon?: IconName
    children?: React.ReactNode
    style?: ViewStyle
}

export const BaseModal = (param: BaseModalProps) => {
    const { t } = useTextTranslation()
    const { onPress, isVisible, onClose, disabled, buttonTitle, buttonIcon, children, style } = param
    return (
        <Modal isVisible={isVisible} onBackdropPress={onClose}>
            <View style={{ padding: 25, backgroundColor: '#fff', ...style}}>
                {children}
                {onPress && (
                    <AppButton
                        style={{ marginTop: 30 }}
                        onPress={() => {
                            onPress()
                        }}
                        disabled={disabled}
                        title={buttonTitle}
                        iconName={buttonIcon}
                    />
                )}
            </View>
            <Pressable
                onTouchStart={() => {
                    if (onClose) {
                        onClose()
                    }
                }}>
                <View
                    style={{
                        alignItems: 'center',
                        marginTop: 15,
                        justifyContent: 'center',
                    }}>
                    <Text
                        style={{
                            fontFamily: FontStyle.regular,
                            fontSize: 15,
                            color: THEME_COLORS.OTHERS.LIGHT_GRAY,
                            margin: 'auto',
                        }}>
                        {t('common:Close')}
                    </Text>
                </View>
            </Pressable>
        </Modal>
    )
}

const styles = StyleSheet.create({})
