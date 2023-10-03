import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../atoms/AppButton';
import { ImageIcon } from '../ImageIcon';
import { useTextTranslation } from '../../../fooks/useTextTranslation';
import { SCREEN_WIDTH, THEME_COLORS } from '../../../utils/Constants';
import { FontStyle } from '../../../utils/Styles';
import { WorkerUIType } from './chatGroupMembers/SelectIndividual';

export const ChatUserItem = React.memo((props: WorkerUIType) => {
	const { t } = useTextTranslation();
	const { workerId, name, imageUrl, company, onChat } = props;

	const iconSize = 50
	const _imageUri = (iconSize <= 30 ? props?.xsImageUrl : (iconSize <= 50 ? props?.sImageUrl : props?.imageUrl)) ?? props?.imageUrl
	const _imageColorHue = props?.imageColorHue


	return (
		<View style={[styles.container]}>
			<ImageIcon
				imageUri={_imageUri}
				imageColorHue={_imageColorHue}
				type={'worker'}
				size={40}
				style={{ width: 40, height: 40, marginRight: 10 }} 
				borderRadius={40}
				borderWidth={1}
				/>
			<View style={styles.row}>
				<View style={styles.content}>
					<Text style={styles.title}>{name}</Text>
					<Text style={styles.subtitle} numberOfLines={1} ellipsizeMode='tail'>
						{company?.name}
					</Text>
				</View>
				<AppButton
					style={{
						backgroundColor: "transparent",
						paddingHorizontal: 20,
					}}
					height={32}
					hasShadow={false}
					borderColor={THEME_COLORS.OTHERS.BORDER_COLOR2}
					borderWidth={1}
					textColor={THEME_COLORS.OTHERS.BLACK}
					title={t('admin:ToChat')}
					onPress={() => {
						if(onChat)
							onChat({
								workerId
							})
					}}
					/>

			</View>
		</View>
	);
});

const SUB_ITEM_WIDTH = SCREEN_WIDTH-20;
const styles = StyleSheet.create({
	container: {
		width: SUB_ITEM_WIDTH,
		height: 50,
		alignItems: 'center',
		borderRadius: 3,
		marginBottom: 5,
		flexDirection: "row",
		paddingBottom: 0
	},
	content: {
		height: 45,
		justifyContent: 'space-between',
	},
	row: {
		width: SUB_ITEM_WIDTH - 50,
		flexDirection:"row",
		justifyContent: 'space-between',
		alignItems: 'center',
	},

	title: {
		fontFamily: FontStyle.medium,
		fontSize: 15,
		color: '#000'
	},
	subtitle: {
		fontFamily: FontStyle.regular,
		fontSize: 13,
		color: '#666'
	},
});