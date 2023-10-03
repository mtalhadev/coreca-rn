import React, { useCallback, useState } from "react"
import { FlatList, ListRenderItem, ListRenderItemInfo, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { RoomUserType } from "../../../models/roomUser/RoomUser";
import { SCREEN_WIDTH, THEME_COLORS } from "../../../utils/Constants";
import { FontStyle } from "../../../utils/Styles";
import { ImageIcon } from "../ImageIcon";
    
export type MentionPopupProps = {
    data: RoomUserType[],
    visible: boolean
    selected?: RoomUserType
    onSelectUser: (workerId: string) => void
    containerStyle?: ViewStyle
}

const POPOVER_WIDTH = SCREEN_WIDTH * 0.9;

export const MentionPopup = React.memo((props: MentionPopupProps) => {
    let { visible, onSelectUser, data, selected, containerStyle } = props

    const _content: ListRenderItem<RoomUserType> = (info: ListRenderItemInfo<RoomUserType>) => {
        const { item, index } = info;
        const { workerId, name, imageUrl, xsImageUrl, sImageUrl, imageColorHue } = item.worker || {};

        const iconSize = 25
        const _imageUri = (iconSize <= 30 ? xsImageUrl : iconSize <= 50 ? sImageUrl : imageUrl) ?? imageUrl
        const _imageColorHue = imageColorHue

        const isSelected = selected?.worker?.workerId === workerId;
        
        console.log('isSelected:', isSelected);
        console.log('selected:',selected);
        
        
        return (
            <Pressable onPress={() => workerId && onSelectUser(workerId)}>
            <View style={[styles.container]}>
                <ImageIcon
                    imageUri={_imageUri}
                    imageColorHue={_imageColorHue}
                    type={'worker'}
                    size={25}
                    style={{ width: 25, height: 25, }} 
                    borderRadius={30}
                    borderWidth={1}
                    />
                <View style={styles.content}>
                    <Text style={[styles.title, { fontFamily: FontStyle.regular }]}>
                        @{name}
                    </Text>                    
                </View>
            </View>
            </Pressable>
        )
      }
  
    if(visible && data.length > 0)
    return (
        <View
            style={{
                width: POPOVER_WIDTH,
                height: 'auto',
                maxHeight: 400,
                padding: 10,
                paddingVertical: 5,
                shadowColor: "#000",
                shadowOffset: {
                    width: 0,
                    height: 4,
                },
                shadowOpacity: 0.30,
                shadowRadius: 4.65,
                elevation: 8,
                borderRadius: 5,
                backgroundColor: 'white',
                position: "absolute",
                bottom: 40,
                left: 10,
                zIndex:100,
                ...containerStyle
            }}
        >
        <FlatList
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#FFF',
            }}
            data={data}
            renderItem={_content}
            keyExtractor={(item, i) => item.workerId || 'user-'+i}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            />  
        </View>
    )
    else return null
});

const styles = StyleSheet.create({
	container: {
		width: POPOVER_WIDTH-20,
		height: 28,
		flexDirection: "row",
		alignItems: 'center',
		borderRadius: 3,
		marginBottom: 2,
		backgroundColor: '#FFF',
	},
	content: {
		width: POPOVER_WIDTH-60,
		height: 25,
        marginLeft: 10,
        justifyContent: 'center',
        paddingBottom: 3
	},
	title: {
		fontSize: 14,
		color: THEME_COLORS.BLUE.MIDDLE
	},
	subtitle: {
		fontFamily: FontStyle.regular,
		fontSize: 13,
		color: '#666',
	},
});