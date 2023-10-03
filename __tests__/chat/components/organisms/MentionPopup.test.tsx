import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { MentionPopup } from '../../../../src/components/organisms/chat/MentionPopup';
import { GreenColor } from '../../../../src/utils/Styles';

describe('MentionPopup test', () => {

    beforeEach(() => {
      jest.resetAllMocks()
    })
  
    it('renders UI correctly', () => {
        render(
            <MentionPopup
              visible={true}
              data={[
                {
                  worker: {
                    name: 'ABC',
                    xsImageUrl: 'https://profile-image-xs',
                    sImageUrl: 'https://profile-image-s',
                    imageUrl: 'https://profile-image',
                    imageColorHue: 40
                  }
                },
              ]}
              onSelectUser={(workerId: string) => {}}
            />
        );

        expect(screen.getByText('@ABC')).toBeVisible();
        const image = screen.getByTestId("ImageIcon-Image")
        expect(image.props.source.uri).toBe("https://profile-image-xs");
        expect(image.props.style.width).toBe(25);
        expect(image.props.style.height).toBe(25);
        const imageBorder = screen.getByTestId("ImageIcon-Border")
        expect(imageBorder.props.style.borderColor).toBe(GreenColor.subColor);       
        expect(screen).toMatchSnapshot();    
    }) 
         
})  