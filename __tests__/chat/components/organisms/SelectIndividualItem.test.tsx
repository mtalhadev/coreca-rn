import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { ChatUserItem } from '../../../../src/components/organisms/chat/SelectIndividualItem';
import { GreenColor } from '../../../../src/utils/Styles';

jest.mock('react-i18next', () => ({
  // this mock makes sure any components using the translate hook can use it without a warning being shown
  useTranslation: () => {
    return {
      t: (str:string) => str,
      i18n: {
        changeLanguage: () => new Promise(() => {}),
      },
    };
  },
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  }
}));


describe('SelectIndividualItem test', () => {

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('renders UI correctly', () => {

    render(<ChatUserItem 
	    workerId = '12345678'
      name = 'ABC'
      xsImageUrl = 'https://profile-logo-xs'
      sImageUrl = 'https://profile-logo-s'
      imageUrl = 'https://profile-logo'
      imageColorHue = {50}
      company={{
        name: 'ABCDEFG',
      }}
    />
    );
    expect(screen.getByText('ABC')).toBeVisible();
    expect(screen.getByText('ABCDEFG')).toBeVisible();
    const image = screen.getByTestId("ImageIcon-Image")
    expect(image.props.source.uri).toBe("https://profile-logo-s");
    expect(image.props.style.width).toBe(40);
    expect(image.props.style.height).toBe(40);
    const imageBorder = screen.getByTestId("ImageIcon-Border")
    expect(imageBorder.props.style.borderColor).toBe(GreenColor.subColor);
    expect(screen).toMatchSnapshot();    

  });

})