<h1 id="firebaseemulator"><b>Firebase Emulator</b></h1>

```diff
- 注意：現状RNFirebase、expo、dev-client環境下では使用できず
試したあとにENV.emulator.useAllをfalseに戻してもiOSエミュレータでエラー発生を確認。その際は、Device > Erase All Contents And Settingで解消確認済み。
```
前提：以下はMac OS Monterey（12.4）環境のshell上での作業ですが、基本的にWindowsでも同様なはずです。

## **JDKインストール**
AndroidStudioでも必要なので、入っていなければJDK 11以上をインストール
OpenJDKは様々なものがあるが、分からない場合はOracle謹製で（ただしOracleのDeveloperアカウント作成が必要）

## **Firbase CLIインストール**
```sh
$ npm install -g firebase-tools

$ firebase —version
# これでバージョンが返ればインストールOK（以下、v11.0.1前提で記載）

$ firebase login
# まずログイン
```

## **Firebase Emulatorインストール**
```sh
$ mkdir ~/hoge
$ cd  ~/hoge
# まず、Emulator環境用のディレクトリ（~/hogeは自由）を作成してそこへ移動

$ firebase init
# このあと色々聞かれるので以下を選択する
```

```sh
? Please select an option:
>Use an existing projectを選択

? Select a default Firebase project for this directory: 
> coreca-98aa2 (Coreca test)を選択

? Which Firebase features do you want to set up for this directory? Press Space to select features, then Enter to confirm your choices.
> Emulators: Set up local emulators for Firebase productsを選択

? Which Firebase emulators do you want to set up? Press Space to select emulators, then Enter to confirm your choices. 
> 全選択。Functions Emulator, Authentication Emulator, Firestore Emulator, Database Emulator,  Pub/Sub Emulator, Storage Emulatorを選択

? Which port do you want to use for the auth emulator? 
> デフォルトの9099でOK（自身の環境に合わせて変えてもOK）

? Which port do you want to use for the functions emulator? 
> デフォルトの5001でOK（自身の環境に合わせて変えてもOK）

? Which port do you want to use for the firestore emulator? 
> デフォルトの8080でOK（自身の環境に合わせて変えてもOK）

? Which port do you want to use for the database emulator? 
> デフォルトの9000でOK（自身の環境に合わせて変えてもOK）

? Which port do you want to use for the hosting emulator? 
> デフォルトの5000でOK（自身の環境に合わせて変えてもOK）

? Which port do you want to use for the pubsub emulator? 
> デフォルトの8085でOK（自身の環境に合わせて変えてもOK）

? Which port do you want to use for the storage emulator? 
> デフォルトの9199でOK（自身の環境に合わせて変えてもOK）

? Would you like to enable the Emulator UI? 
> →Yesを選択

? Which port do you want to use for the Emulator UI (leave empty to use any available port)? 
> Yesを選択

? Would you like to download the emulators now? 
> Yesを選択

? Which Firebase features do you want to set up for this directory? Press Space to select features, then Enter to confirm your choices. Storage: 
> Configure a security rules file for Cloud Storageを選択

? What file should be used for Storage Rules? 
> デフォルトのstorage.rulesでOK
```
最後に、Firebase initialization complete! と表示されればインストール完了

## **Firebase Emulator起動**
```sh
$ yarn emulate
# 全てのサービスを起動。閉じるときに/.emulatorにデータを保存し、立ち上げ時に利用する。
```
or
```sh
$ firebase emulators:start
# 全てのデータが閉じるときに消去される。
```
これで以下のような表示が出ればOK、ブラウザで http://localhost:4000 を確認して起動完了、終了はCtrl+C

│   All emulators ready! It is now safe to connect your app. │
│   View Emulator UI at http://localhost:4000                │

## **Emulatorの切り替え**
 - env/env.tsのEMULATORの定数を変更することでtest環境と切り替えることができる.
 - ビルドがproductionの場合は、Emulatorには繋がらない。
## **注意点**
 - Emulator環境用のディレクトリは、ローカルのcoreca-appディレクトリ（gitからcloneしたディレクトリ）である必要はないようです。coreca-appディレクトリで実行した場合、firebaseinitで生成されたEmulator用ファイル群がgitのバージョニング対象になる可能性があります（これらはあくまで自身のローカル環境用）。

 - firebase initは何度でも実行でき、インストール対象の追加削除や設定変更、storage.rulesの生成では再実行が必要になったりします。ハマったら一からやり直しも効きます。

 - これは不要かもしれませんが、上記でEmulatorの起動に失敗するような場合、HOME（~/）の.bash_profileに以下の1行を追加すると改善する場合があります。
 
 - Firestoreのみhostは`localhost`ではなく`127.0.0.1`にする。`localhost`にすると動作がかなり重くなる。原因不明。名前解決？

 - FirestoreのデータがエミュレータUI上に反映されないとき。`$ firebase projects:list`を見てprojectがテスト環境にセットされているか確認する。されていない場合は`firebase use coreca-98aa2`でテスト環境に変更する。この問題は`App.tsx`の`const firebase = initializeApp(__DEV__ ? ENV.TEST_FIREBASE_CONFIG : ENV.PROD_FIREBASE_CONFIG)`で指定した環境と違うことによって生じる。

```sh
export FIRESTORE_EMULATOR_HOST=localhost:8080
# firebase initでEmulatorのポートを変更した場合、8080はそのポートに合わせてください。
```

基本、オフィシャルのインストール手順で問題ないはずです（上記はv11.0.1でのCUI画面遷移なので、後続バージョンでは変わる可能性あり）。