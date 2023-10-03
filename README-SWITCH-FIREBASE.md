
# Firebaseをreact-native-firebaseからfirebase（js）に置き換える方法

```
所要時間　10m
```

## app.config.js
#### pluginsから以下削除
- ./withReactNativeFirebaseV14.js
- @react-native-firebase/app
```sh
plugins: 
[
    './withReactNativeFirebaseV14.js' <= 削除,
    '@react-native-firebase/app' <= 削除,
],
```

---

## package.json

#### @react-native-firebase全て削除
- "@react-native-firebase/app": "^14.11.0"
- "@react-native-firebase/auth": "^14.11.0",
- "@react-native-firebase/dynamic-links": "^14.11.0",
- "@react-native-firebase/firestore": "^14.11.0",
- "@react-native-firebase/functions": "^14.11.0",
- "@react-native-firebase/storage": "^14.11.0",

#### firebase(js SDK) install
```sh
$ npx expo install firebase
```

#### 不具合がある場合は、node_modulesとyarn.lockを削除して以下実行
```sh
$ yarn install
```

---

## services/firebase
フォルダ内の全てのファイルについて、[rn sdk]のコードを[js sdk]のコードに変更する。
```sh
# 例
export const _getAuthUser = (): FirebaseAuthTypes.Module => {
    /**
     * [js sdk]
     * const _auth = getAuth()
     * return _auth
     * 
     * [rn sdk]
     * const _auth = auth()
     * return _auth
     */
    const _auth = getAuth()
    return _auth
}
```