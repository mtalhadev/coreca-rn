const ENV = {
    TEST_FIREBASE_CONFIG: {
        apiKey: 'AIzaSyDsbs1ZGiOfN4olgpL3pk2UE7SAr9OienI',
        authDomain: 'coreca-98aa2.firebaseapp.com',
        projectId: 'coreca-98aa2',
        storageBucket: 'coreca-98aa2.appspot.com',
        messagingSenderId: '4658969885',
        appId: '1:4658969885:web:1729c0b7b8d3094a39b5f4',
        measurementId: 'G-598YWY9P3E',
        dynamicLinksDomain: 'coreca.jp',
    },
    PROD_FIREBASE_CONFIG: {
        apiKey: 'AIzaSyCTdHiDjUz84GggM04_9yCLn2b-bjlfZgM',
        authDomain: 'coreca-test.firebaseapp.com',
        projectId: 'coreca-test',
        storageBucket: 'coreca-test.appspot.com',
        messagingSenderId: '970655509448',
        appId: '1:970655509448:web:75c6743d3717cb3da5eefd',
        measurementId: 'G-WTP44K23MF',
        dynamicLinksDomain: 'coreca-test.web.app',
    },
    GOOGLE_CONFIG: {
        mapApiKey: 'AIzaSyAEZ2icSe3LM7C99ZrloePoJj-Damwnylc',
    },
    IS_SERVER_SIDE: false,
    SENDGRID: {
        active: true,
        senderName: 'CORECA',
        replyTo: 'no-reply@coreca.jp',
        dev: {
            apiKey: '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',
            sender: 'hiruma@coreca.jp'
        },
        prod: {
            apiKey: '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',
            sender: 'hiruma@coreca.jp'
        }
    },
    IS_PLAN_TICKET_AVAILABLE: false,
}

export default ENV
