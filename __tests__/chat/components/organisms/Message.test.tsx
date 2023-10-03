import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { Message } from '../../../../src/components/organisms/chat/Message';
import { CustomDate } from '../../../../src/models/_others/CustomDate';
import { MenuProvider } from 'react-native-popup-menu';
import { GreenColor } from '../../../../src/utils/Styles';

describe('Message test', () => {

    beforeEach(() => {
      jest.resetAllMocks()
    })
  
    it('renders Message type - text', () => {
      const date: CustomDate = new Date(2000,0,1,11,30,0).toCustomDate()

        render(
            <Message 
              message={{
                messageId: 'message-id',
                roomId: 'room-id',
                threadId: 'thread-id',
                message: "@TestUser It's a test",
                messageType: 'text',
                createdAt: date,
                worker: {
                  name: 'ABC',
                  xsImageUrl: 'https://profile-image-xs',
                  sImageUrl: 'https://profile-image-s',
                  imageUrl: 'https://profile-image',
                  imageColorHue: 40
                }
              }}
              myWorkerId={'my-worker-id'}
            />,
            {
              wrapper: MenuProvider
            }
        );

        expect(screen.getByText('ABC')).toBeVisible();
        expect(screen.getByText("@TestUser It's a test")).toBeVisible();
        expect(screen.getByText("11:30")).toBeVisible(); 
        const image = screen.getByTestId("ImageIcon-Image")
        expect(image.props.source.uri).toBe("https://profile-image-xs");
        expect(image.props.style.width).toBe(25);
        expect(image.props.style.height).toBe(25);
        const imageBorder = screen.getByTestId("ImageIcon-Border")
        expect(imageBorder.props.style.borderColor).toBe(GreenColor.subColor);       
        expect(screen).toMatchSnapshot();    
    }) 

    it('renders Message type - picture', () => {
      const date: CustomDate = new Date(2000,0,1,11,30,0).toCustomDate()

        render(
            <Message 
              message={{
                messageId: 'message-id',
                roomId: 'room-id',
                threadId: 'thread-id',
                message: "@TestUser It's a test",
                messageType: 'picture',
                attachmentUrl: 'https://attachment-picture',
                createdAt: date,
                worker: {
                  name: 'ABC',
                  xsImageUrl: 'https://profile-image-xs',
                  sImageUrl: 'https://profile-image-s',
                  imageUrl: 'https://profile-image',
                  imageColorHue: 40
                }
              }}
              myWorkerId={'my-worker-id'}
            />,
            {
              wrapper: MenuProvider
            }
        );

        expect(screen.getByText('ABC')).toBeVisible();
        expect(screen.getByText("11:30")).toBeVisible(); 
        const image = screen.getByTestId("ImageIcon-Image")
        expect(image.props.source.uri).toBe("https://profile-image-xs");
        expect(image.props.style.width).toBe(25);
        expect(image.props.style.height).toBe(25);
        const imagePicture = screen.getByTestId("message-picture")
        expect(imagePicture.props.source.uri).toBe("https://attachment-picture");
        const imageBorder = screen.getByTestId("ImageIcon-Border")
        expect(imageBorder.props.style.borderColor).toBe(GreenColor.subColor);       
        expect(screen).toMatchSnapshot();    
    }) 
         
    it('renders Message type - note', () => {
      const date: CustomDate = new Date(2000,0,1,11,30,0).toCustomDate()

        render(
            <Message 
              message={{
                messageId: 'message-id',
                roomId: 'room-id',
                threadId: 'thread-id',
                message: "@TestUser It's a test",
                messageType: 'note',
                createdAt: date,
                worker: {
                  name: 'ABC',
                  xsImageUrl: 'https://profile-image-xs',
                  sImageUrl: 'https://profile-image-s',
                  imageUrl: 'https://profile-image',
                  imageColorHue: 40
                }
              }}
              myWorkerId={'my-worker-id'}
            />,
            {
              wrapper: MenuProvider
            }
        );

        expect(screen.getByText('ABC')).toBeVisible();
        expect(screen.getByText("@TestUser It's a test")).toBeVisible();
        expect(screen.getByText("Notes")).toBeVisible();
        const image = screen.getByTestId("ImageIcon-Image")
        expect(image.props.source.uri).toBe("https://profile-image-xs");
        expect(image.props.style.width).toBe(25);
        expect(image.props.style.height).toBe(25);
        const imageBorder = screen.getByTestId("ImageIcon-Border")
        expect(imageBorder.props.style.borderColor).toBe(GreenColor.subColor);       
        expect(screen).toMatchSnapshot();    
    }) 
         
})  