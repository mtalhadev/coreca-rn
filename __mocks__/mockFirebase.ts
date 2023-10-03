/* eslint-disable no-undef */
jest.mock('@react-native-firebase/firestore', () => ({
    collection: jest.fn(() => ({
        where: jest.fn(() => ({
            onSnapshot: jest.fn(),
        })),
    })),
}))
jest.mock('@react-native-firebase/storage', () => ({
    ref: jest.fn((path?: string) => ({
        putFile: jest.fn((localFilePath: string) => {}),
        getDownloadURL: Promise.resolve('https://image-url'),
    })),
}))
jest.mock('@react-native-firebase/firestore', () => ({
    firestore: jest.fn(() => ({
        FieldValue: jest.fn(() => ({
            delete: jest.fn(() => undefined),
        })),
    })),
}))

jest.mock('../src/services/firebase/FirestoreService', () => ({
    deleteFieldParam: jest.fn(() => undefined),
}))
