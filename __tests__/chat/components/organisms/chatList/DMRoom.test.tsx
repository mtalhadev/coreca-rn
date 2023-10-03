import React from 'react';
import {render, screen} from '@testing-library/react-native';
import { CustomDate, newCustomDate } from '../../../../../src/models/_others/CustomDate';
import { DMRoom } from '../../../../../src/components/organisms/chat/DMRoom';
import { BlueColor, GreenColor } from '../../../../../src/utils/Styles';
import { THEME_COLORS } from '../../../../../src/utils/Constants';

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

describe('DMRoom test', () => {

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('renders roomType - company', () => {
    jest.spyOn(React, 'useEffect').mockImplementation(f => {})
    const date: CustomDate = new Date(2000,0,1,12,0,0).toCustomDate()

    render(<DMRoom 
      roomId = '12345678'
      rootThreadId = '9876543221'
      roomType = 'company'
      name = 'ABC'
      companyName = 'ABCEFG'
      lastMessage = "It's a test"
      updatedAt={date}
      unreadCount = {2}
      company={{
        xsImageUrl: 'https://company-logo-xs',
        sImageUrl: 'https://company-logo-s',
        imageUrl: 'https://company-logo',
        imageColorHue: 50
      }}
      worker={{
        xsImageUrl: 'https://profile-image-xs',
        sImageUrl: 'https://profile-image-s',
        imageUrl: 'https://profile-image',
        imageColorHue: 40
      }}
      room={{
        xsImageUrl: 'https://group-image-xs',
        sImageUrl: 'https://group-image-s',
        imageUrl: 'https://group-image',
        imageColorHue: 60
      }}
      onEnter = {() => {}}
    />
    );
    expect(screen.getByText('取引先')).toBeVisible();
    expect(screen.getByText('ABC')).toBeVisible();
    expect(screen.getByText("It's a test")).toBeVisible();
    expect(screen.getByText("01/01 12:00")).toBeVisible();
    expect(screen.getByTestId("batchCount")).toBeVisible();
    expect(screen.getByTestId("batchCount").children[0]).toBe('2');
    const image = screen.getByTestId("ImageIcon-Image")
    expect(image.props.source.uri).toBe("https://company-logo-s");
    expect(image.props.style.width).toBe(40);
    expect(image.props.style.height).toBe(40);
    const imageBorder = screen.getByTestId("ImageIcon-Border")
    expect(imageBorder.props.style.borderColor).toBe(BlueColor.subColor);
    const tag = screen.getByTestId("Tag-View")
    expect(tag.props.style.backgroundColor).toBe(THEME_COLORS.OTHERS.CUSTOMER_PURPLE);    
  });


  it('renders roomType - onetoone', () => {
    jest.spyOn(React, 'useEffect').mockImplementation(f => {})
    const date: CustomDate = new Date(2000,0,1,12,0,0).toCustomDate()

    render(<DMRoom 
      roomId = '12345678'
      rootThreadId = '9876543221'
      roomType = 'onetoone'
      name = 'ABC'
      companyName = 'ABCEFG'
      lastMessage = "It's a test"
      updatedAt={date}
      unreadCount = {2}
      company={{
        xsImageUrl: 'https://company-logo-xs',
        sImageUrl: 'https://company-logo-s',
        imageUrl: 'https://company-logo',
        imageColorHue: 50
      }}
      worker={{
        xsImageUrl: 'https://profile-image-xs',
        sImageUrl: 'https://profile-image-s',
        imageUrl: 'https://profile-image',
        imageColorHue: 40
      }}
      room={{
        xsImageUrl: 'https://group-image-xs',
        sImageUrl: 'https://group-image-s',
        imageUrl: 'https://group-image',
        imageColorHue: 60
      }}
      onEnter = {() => {}}
    />
    );
    expect(screen.getByText('個人')).toBeVisible();
    expect(screen.getByText('ABC')).toBeVisible();
    expect(screen.getByText("It's a test")).toBeVisible();
    expect(screen.getByText("01/01 12:00")).toBeVisible();
    expect(screen.getByTestId("batchCount")).toBeVisible();
    expect(screen.getByTestId("batchCount").children[0]).toBe('2');
    const image = screen.getByTestId("ImageIcon-Image")
    expect(image.props.source.uri).toBe("https://profile-image-s");
    expect(image.props.style.width).toBe(40);
    expect(image.props.style.height).toBe(40);
    const imageBorder = screen.getByTestId("ImageIcon-Border")
    expect(imageBorder.props.style.borderColor).toBe(GreenColor.subColor);
    const tag = screen.getByTestId("Tag-View")
    expect(tag.props.style.backgroundColor).toBe(THEME_COLORS.OTHERS.LIGHT_GREEN);
  });


  it('renders roomType - custom', () => {
    jest.spyOn(React, 'useEffect').mockImplementation(f => {})
    const date: CustomDate = new Date(2000,0,1,12,0,0).toCustomDate()

    render(<DMRoom 
      roomId = '12345678'
      rootThreadId = '9876543221'
      roomType = 'custom'
      name = 'ABC'
      companyName = 'ABCEFG'
      lastMessage = "It's a test"
      updatedAt={date}
      unreadCount = {2}
      company={{
        xsImageUrl: 'https://company-logo-xs',
        sImageUrl: 'https://company-logo-s',
        imageUrl: 'https://company-logo',
        imageColorHue: 50
      }}
      worker={{
        xsImageUrl: 'https://profile-image-xs',
        sImageUrl: 'https://profile-image-s',
        imageUrl: 'https://profile-image',
        imageColorHue: 40
      }}
      room={{
        xsImageUrl: 'https://group-image-xs',
        sImageUrl: 'https://group-image-s',
        imageUrl: 'https://group-image',
        imageColorHue: 60
      }}
      onEnter = {() => {}}
    />
    );
    expect(screen.getByText('カスタム')).toBeVisible();
    expect(screen.getByText('ABC')).toBeVisible();
    expect(screen.getByText("It's a test")).toBeVisible();
    expect(screen.getByText("01/01 12:00")).toBeVisible();
    expect(screen.getByTestId("batchCount")).toBeVisible();
    expect(screen.getByTestId("batchCount").children[0]).toBe('2');
    const image = screen.getByTestId("ImageIcon-Image")
    expect(image.props.source.uri).toBe("https://group-image-s");
    expect(image.props.style.width).toBe(40);
    expect(image.props.style.height).toBe(40);
    const imageBorder = screen.getByTestId("ImageIcon-Border")
    expect(imageBorder.props.style.borderColor).toBe(GreenColor.subColor);
    const tag = screen.getByTestId("Tag-View")
    expect(tag.props.style.backgroundColor).toBe(THEME_COLORS.OTHERS.LIGHT_PINK);
  });

});

