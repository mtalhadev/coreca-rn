import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTextTranslation } from '../../../../fooks/useTextTranslation'
import { TodoType } from '../../../../models/todos/Todo'
import { SCREEN_WIDTH, THEME_COLORS } from '../../../../utils/Constants'
import VectorIcon from '../../../atoms/VectorIcon'
import { Badge } from '../../../atoms/Badge'
import { GlobalStyles } from '../../../../utils/Styles'

export type TodoItemUIType = TodoType & {
    onPress?: (todoId?: string) => void
    onMsgCountPress?: () => void
}

export const TodoItem = React.memo((props: TodoItemUIType) => {
    const { todoId, threadId, messageId, description, isCompleted, threadMessageCount, onPress, onMsgCountPress } = props

	const { t } = useTextTranslation()

    let badge: any
    if (threadMessageCount && threadMessageCount > 0) {
        badge = <Pressable onPress={onMsgCountPress}>
                <Badge batchCount={threadMessageCount} size={25} fontSize={12}/>
                </Pressable>
    }

    return (
        <Pressable
            onPress={() => {
                if (onPress) {
                    onPress(todoId)
                }
            }}
            style={{
				alignItems: 'center',
				marginBottom: 12,
				backgroundColor: '#FFF',
				flexDirection: 'row',
                width: SCREEN_WIDTH - 20,
                height: 'auto',
                paddingVertical: 10,
				marginHorizontal: 15,
                borderRadius: 22,
                shadowOpacity:  0.2,
                shadowColor: '#000',
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 1 },
                elevation: 8,
        }}>
            <View style={{ alignItems: 'center', width: 50, }}>
                {
                isCompleted ?
                <VectorIcon.Ionicon name='md-checkmark-circle' size={25} color={THEME_COLORS.OTHERS.BLACK} /> 
                :
                <VectorIcon.Ionicon name='md-checkmark-circle-outline' size={25} color={THEME_COLORS.OTHERS.BLACK} />
                }
            </View>
            <View
                style={{
                    flexDirection: 'column',
					flex: 1,
                }}>
                <View
                    style={{
                        flexDirection: 'row',
						justifyContent: 'space-between'
                    }}>
                    <Text style={styles.title}>
                        {description}
                    </Text>
                    <View style={{
						marginRight: 10
					}}>
                        {badge}
                    </View>
                    {/* <Text>{roomId.substring(0, 20)}</Text> */}
                </View>
            </View>
        </Pressable>
    )
})

const styles = StyleSheet.create({
    title: {
        ...GlobalStyles.boldText,
        lineHeight: 23
    },
});