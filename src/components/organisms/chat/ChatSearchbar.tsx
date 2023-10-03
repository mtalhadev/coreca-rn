import React, { useState } from 'react';
import { View,StyleSheet, TextInput } from 'react-native';
import { SCREEN_WIDTH, THEME_COLORS } from '../../../utils/Constants';
import { BlueColor, FontStyle } from '../../../utils/Styles';
import { Icon } from '../../atoms/Icon';

export type Props = {
  onChangeText: (text: string) => void
}

export const ChatSearchbar = React.memo((props: Props) => {
  const { onChangeText } = props;
  const [text, setText] = useState<string>('');

  const updateText = (text: string) => {
    setText(text);
    onChangeText && onChangeText(text);
  };

  return (
      <View style={styles.searchBar}>
        <Icon name='filter' width={50} height={15} fill={BlueColor.mainColor}/>
        <TextInput
          style={{
              fontFamily: FontStyle.regular,
              fontSize: 14,
              lineHeight: 20,
              textAlignVertical: 'center',
              color: '#000',
              backgroundColor: 'transparent',
            }}
          placeholder={'検索'}
          placeholderTextColor={THEME_COLORS.OTHERS.LIGHT_GRAY}
          value={text}
          onChangeText={updateText}
      />
      </View>
  );
});

const styles = StyleSheet.create({
  searchBar: {
    height: 30,
    width: SCREEN_WIDTH * 0.9,
    justifyContent: 'flex-start',
    alignItems:'center',
    flexDirection: 'row',
		backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: '#555',
    marginTop: 10,
    marginBottom: 12,
    marginLeft: SCREEN_WIDTH * 0.1 * 0.5,
  },
});