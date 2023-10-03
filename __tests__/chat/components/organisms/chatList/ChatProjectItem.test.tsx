import React from 'react';
import {render, screen, fireEvent } from '@testing-library/react-native';
import { ChatProjectItem } from '../../../../../src/components/organisms/chat/chatList/ChatProjectItem';
import { newCustomDate } from '../../../../../src/models/_others/CustomDate';

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

describe('ChatProjectItem test', () => {

  it('renders ChatProjectItem - collapsed state', () => {
    jest.spyOn(React, 'useEffect').mockImplementation(f => {})
    render(<ChatProjectItem 
      projectId = '12345678'
      name = 'DEF'
      project={{
        xsImageUrl: 'https://no-image',
        sImageUrl: 'https://no-image',
        imageUrl: 'https://no-image',
        imageColorHue: 4
      }}
      companyName = 'ABCD Ltd.'
      lastMessage = "It's a test"
      onEnter = {() => {}}
      roomUsers={[
        {
          roomId: '12345678',
          rootThreadId: '9876543221',
          roomType: 'project',
          name: 'HJK',
          companyName: 'ABCD Ltd.',
          lastMessage: "It's a test",
          updatedAt: newCustomDate(),
          unreadCount: 2,
          onEnter: () => {},
        },
        {
          roomId: "234235435",
          rootThreadId: "234234242",
          roomType: "construction",
          name: "OPQR",
          companyName: "ABCD Ltd.",
          lastMessage: "It's a test 2",
          updatedAt: newCustomDate(),
          unreadCount: 8,      
          onEnter: () => {},
        },
      ]}
    />
    );
    expect(screen.getByText('DEF')).toBeVisible();
    expect(screen.getByText('common:Client:  ABCD Ltd.')).toBeVisible();
    expect(screen.getAllByText("It's a test").length).toBe(1);
    // expect(screen.getByText("It's a test 2")).toBeUndefined();
    expect(screen.getAllByTestId("batchCount").length).toEqual(1);
  });

  it('renders ChatProjectItem - expanded state', () => {
    jest.spyOn(React, 'useEffect').mockImplementation(f => {})
    const setIsOpen = jest.fn()
    const useStateMock: any = (useState: any) => [useState, setIsOpen]
    jest.spyOn(React, 'useState').mockImplementation(useStateMock)

    render(<ChatProjectItem 
      projectId = '12345678'
      name = 'DEF'
      project={{
        xsImageUrl: 'https://no-image',
        sImageUrl: 'https://no-image',
        imageUrl: 'https://no-image',
        imageColorHue: 4
      }}
      companyName = 'ABCD Ltd.'
      lastMessage = "It's a test"
      onEnter = {() => {}}
      roomUsers={[
        {
          roomId: '12345678',
          rootThreadId: '9876543221',
          roomType: 'project',
          name: 'HJK',
          companyName: 'ABCD Ltd.',
          lastMessage: "It's a test",
          updatedAt: newCustomDate(),
          unreadCount: 2,
          onEnter: () => {},
        },
        {
          roomId: "234235435",
          rootThreadId: "234234242",
          roomType: "construction",
          name: "OPQR",
          companyName: "ABCD Ltd.",
          lastMessage: "It's a test 2",
          updatedAt: newCustomDate(),
          unreadCount: 8,      
          onEnter: () => {},
        },
      ]}
    />
    );

    const shadowBox = screen.getByTestId('shadowBox')
    fireEvent.press(shadowBox); // Toggle ShadowBox open

    expect(screen.getByText('DEF')).toBeVisible();
    expect(screen.getByText('HJK').children[0]).toBe('HJK');
    expect(screen.getByText('OPQR').children[0]).toBe('OPQR');
    expect(screen.getByText('common:Client:  ABCD Ltd.')).toBeVisible();
    expect(screen.getAllByText("It's a test").length).toBe(2);
    expect(screen.getAllByText("It's a test 2").length).toBe(1);
    expect(screen.getAllByTestId("batchCount").length).toEqual(3);
  });

});

