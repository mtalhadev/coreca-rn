import React from 'react';
import {render, screen} from '@testing-library/react-native';
import RoomUserItem from '../../../../../src/components/organisms/chat/chatList/RoomUserItem';
import { CustomDate, newCustomDate } from '../../../../../src/models/_others/CustomDate';

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

describe('RoomUserItem test', () => {
  it('renders roomType - project', () => {
    jest.spyOn(React, 'useEffect').mockImplementation(f => {})
    const date: CustomDate = new Date(2000,0,1,12,0,0).toCustomDate()

    render(<RoomUserItem 
      roomId = '12345678'
      rootThreadId = '9876543221'
      roomType = 'project'
      name = 'ABC'
      companyName = 'ABCEFG'
      lastMessage = "It's a test"
      updatedAt={date}
      unreadCount = {2}
      style = {{}}
      onEnter = {() => {}}
      onUpdate = {(lastMessage: string) => {}}
    />
    );
    expect(screen.getByText('ABC')).toBeVisible();
    expect(screen.getByText("It's a test")).toBeVisible();
    expect(screen.getByText("01/01 12:00")).toBeVisible();
    expect(screen.getByTestId("batchCount")).toBeVisible();
    expect(screen.getByTestId("batchCount").children[0]).toEqual("2");
  });

  it('renders roomType - construction', () => {
    jest.spyOn(React, 'useEffect').mockImplementation(f => {})
    const date: CustomDate = new Date(2000,0,1,12,0,0).toCustomDate()
    render(<RoomUserItem 
      roomId = '12345678'
      rootThreadId = '9876543221'
      roomType = 'construction'
      name = 'ABC'
      companyName = 'ABCEFG'
      lastMessage = "It's a test"
      updatedAt={date}
      unreadCount = {2}
      style = {{}}
      onEnter = {() => {}}
      onUpdate = {(lastMessage: string) => {}}
    />
    );
    expect(screen.getByText('ABC')).toBeVisible();
    expect(screen.getByText("It's a test")).toBeVisible();
    expect(screen.getByText("01/01 12:00")).toBeVisible();
    expect(screen.getByTestId("batchCount")).toBeVisible();
    expect(screen.getByTestId("batchCount").children[0]).toEqual("2");
  });

  it('renders roomType - contract', () => {
    jest.spyOn(React, 'useEffect').mockImplementation(f => {})
    const date: CustomDate = new Date(2000,0,1,12,0,0).toCustomDate()
    render(<RoomUserItem 
      roomId = '12345678'
      rootThreadId = '9876543221'
      roomType = 'contract'
      name = 'ABC'
      companyName = 'ABCEFG'
      lastMessage = "It's a test"
      updatedAt={date}
      unreadCount = {2}
      style = {{}}
      onEnter = {() => {}}
      onUpdate = {(lastMessage: string) => {}}
    />
    );
    expect(screen.getByText('ABC ABCEFG')).toBeVisible();
    expect(screen.getByText("It's a test")).toBeVisible();
    expect(screen.getByText("01/01 12:00")).toBeVisible();
    expect(screen.getByTestId("batchCount")).toBeVisible();
    expect(screen.getByTestId("batchCount").children[0]).toEqual("2");
  });
});

