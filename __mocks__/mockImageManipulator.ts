import { ActionResize, ImageResult, SaveOptions } from "expo-image-manipulator";

/* eslint-disable no-undef */
jest.mock('expo-image-manipulator', () => ({
    manipulateAsync: jest.fn((
        uri: string,
        actions: ActionResize[],
        saveOptions: SaveOptions = {}
    ): Promise<ImageResult> => new Promise((resolve, reject) => {
        resolve({ uri, width: actions[0].resize.width || 500, height: actions[0].resize.height || 500 })
    })
    ),
    SaveFormat: {
        JPEG: 'jpeg',
        PNG: 'png',
        /**
         * @platform web
         */
        WEBP: 'webp',
      }

}));  