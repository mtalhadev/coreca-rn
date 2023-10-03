import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { Message } from '../../../../src/components/organisms/chat/Message';
import { CustomDate } from '../../../../src/models/_others/CustomDate';
import { MenuProvider } from 'react-native-popup-menu';
import { GreenColor } from '../../../../src/utils/Styles';
import { ThreadMessage } from '../../../../src/components/organisms/chat/ThreadMessage';

describe('ThreadMessage test', () => {

    beforeEach(() => {
      jest.resetAllMocks()
    })
  
    it('renders Message type - text', () => {
      const date: CustomDate = new Date(2000,0,1,11,30,0).toCustomDate()

        render(
            <ThreadMessage 
              threadLog={{
                message: {
                  messageId: 'message-id',
                  roomId: 'room-id',
                  threadId: 'thread-id',
                  message: "@TestUser It's a test",
                  messageType: 'text',
                  createdAt: date.totalSeconds,
                  room: {
                    name: 'Room-XYZ',
                    roomType: "project"
                  },
                  worker: {
                    name: 'ABC',
                    xsImageUrl: 'https://profile-image-xs',
                    sImageUrl: 'https://profile-image-s',
                    imageUrl: 'https://profile-image',
                    imageColorHue: 40
                  }
                }
              }}
            />
        );

        expect(screen.getByText('ABC')).toBeVisible();
        expect(screen.getByText('その他のメッセージを読む')).toBeVisible();
        expect(screen.getByText("@TestUser It's a test")).toBeVisible();
        expect(screen.getByText("11:30")).toBeVisible(); 
        expect(screen.getByText("返信する")).toBeVisible(); 
        expect(screen.getByText("既読")).toBeVisible(); 
        const image = screen.getByTestId("ImageIcon-Image")
        expect(image.props.source.uri).toBe("https://profile-image-s");
        expect(image.props.style.width).toBe(40);
        expect(image.props.style.height).toBe(40);
        const imageBorder = screen.getByTestId("ImageIcon-Border")
        expect(imageBorder.props.style.borderColor).toBe(GreenColor.subColor);       
        expect(screen).toMatchSnapshot();    
    }) 

})  