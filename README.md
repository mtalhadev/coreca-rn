<!-- ABOUT THE PROJECT -->

```
開発前に一通り目を通してください。
# Please read through the entire document before developing it.
```
[[_TOC_]]

<br>

<h1 id="welcome"><b>Welcome</b></h1>

### **環境構築**
```sh
# node v16, yarn, XCode(latest), Android Studio(latest)導入
$ yarn install
$ yarn global add eas-cli
$ yarn global add expo-cli
```


<h1 id=start><b>How to Launch App?</b></h1>

### **1. シミュレータ立ち上げ**

Android Studio、Xcodeでシミュレータを起動できる前提。
#### **iOS**
```
Xcode -> Simulator
```

#### **Android**
```
Android Studio -> Virtual Device Manager
```

<br>

### **2. アプリインストール**

ビルドファイル（`.app`、`.apk`）をシミュレータにドラッグ&ドロップする。


ビルドファイルは自分でビルドしても良いが、最初は`sharing-builds`フォルダのものを使用する。(`coreca-app/sharing-builds/{{platform}}/development/~`)

iOSは`.tar.gz`の解凍必要。

自分でビルドする場合は、READ.ME記載の「[ビルド](#build)」を参照

<br>

### **3. Expoローカルサーバー立ち上げ**

#### **Case. クラウドのFunctionsを使用する場合**

```sh
# クラウド環境のfirebase functionsを使用する場合
$ yarn start

```



#### **Case. Firebase公式エミュレータを使用する場合**

```sh
# ローカル環境のfirebase auth、functions、firestoreを使用する場合。デプロイが必要ないのでデバッグに便利。
# 注意：ローカルPCスペックが低い場合、動作が遅い可能性が高い
app.config.jp
useFirebaseOfficialEmulatorHost: '192.168.x.x', // 公式エミュレータを動かす開発PCのIPを入れてください。

$ yarn start:emulate

# ======================
# coreca-serverにてFirebase公式エミュレータを立ち上げ
coreca-server/firebase.json
emulators配下のhostを公式エミュレータを動かす開発PCのIP（'192.168.x.x'）に変えてください。

$ cd ../coreca-server
$ yarn start:emulate

# 注意：firebase.jsonのportはサーバーとクライアントで合わせる必要がある。

# 注意：エミュレータからクラウドへの接続に切り替える際は一旦端末のデータをすべてリセットする必要がある。

```

#### **Case. Functionsのみの自作エミュレータを使用する場合**

```sh
# ローカル環境のfirebase functionsを使用する場合。functionsのデプロイが必要ないのでデバッグに便利。
# 注意：triggers下の関数は反映されない。
$ yarn start:emulate-only-functions

# ======================
# coreca-serverにてfunctionsのローカルサーバー立ち上げ
$ cd ../coreca-server
$ yarn start:emulate-only-functions

```


<br>

### **4. アプリ立ち上げ**

シミュレータ上でアプリを立ち上げる。

Development Serverから先ほど立ち上げたExpoローカルサーバーを選択する。

***立ち上げ成功！***


### **5. デバッガー**

iOSならCmd+DでExpoメニューを立ち上げる。Local dev toolsを使うとエミュレータのパフォーマンスが向上する。


<br>

<h1 id="build"><b>ビルド</b></h1>

## **一覧**
```sh
# 開発ビルド（クラウド）
$ yarn build
# 開発ビルド（ローカル）
$ yarn build:local

# プレビュービルド（クラウド）
$ yarn build:preview
# プレビュービルド（ローカル）
$ yarn build:preview:local

# プロダクションビルド（クラウド）
$ yarn build:prod
# プロダクションビルド（ローカル）
$ yarn build:prod:local

# 開発： simulator環境（app, apkファイル）、coreca-test環境
# プレビュー： 配布可能（ipa, abbファイル）、coreca-test環境
# プロダクション： 配布可能（ipa, abbファイル）、coreca-prod環境

# Expo Go（開発ビルドは使用できない）
$ yarn start:go
```
---
## **EASクラウド開発ビルド**
- Expo.devクラウドで開発ビルドしてもらう方法です
- 個人の環境に依存しないので、環境構築前の最初のビルドに適しています。
- プランの関係で30分程度の時間がかかります。
- プランの関係で一度に２つしかビルドできません。
```sh
$ yarn build
# 完了後、Expo.devにてインストール可能。Build detailsのURLから確認できる。
```

### **ビルドタイミング**
```
ネイティブ関連パッケージの追加などネイティブに関係する変更時のみ
```

<br>

### **Case: Androidインストール**
- Expo.devのinstallからURLを取得して、そのURLをデバイスのブラウザで開く。
- あとは流れでインストールできる。
### **Case: iOSインストール**
- ダウンロードして解凍したファイルをデバイスにドラッグ&ドロップ


<br>

### **エミュレータ実行**
```sh
$ yarn start
# デバイスに上げたアプリを開いて完了
```

---

## **EASローカル開発ビルド**
- 自前のPCでビルドする方法です。
```sh
# 先にローカルビルド環境構築が必要
$ yarn build:local
```

### **ビルドタイミング**
```
ネイティブ関連パッケージの追加などネイティブに関係する変更時のみ
```

<br>

### **iOS環境構築**
- cocoapodsとfastlaneが必要。
- Xcodeは最新版にする。
- rubyはrbenv, bundlerで管理する。（導入済みの方は「3. 関連gemインストール」まで飛ばす）
#### **1. rbenvインストール**

```sh
$ brew install rbenv ruby-build

# バージョンは./.ruby-versionに合わせる
$ rbenv install 3.1.2

# project rootにて
$ rbenv local 3.1.2
```

#### **2. bundler導入**
rbenvある前提
```sh
$ rbenv exec gem install bundler

# 紐付け
$ rbenv rehash
```
#### **3. 関連gemインストール**
```sh
$ yarn build-env:ios
```
#### **4. 環境チェック**
```sh
# == と同じなら問題ない。
which gem
# == /Users/{{your user}}/.rbenv/shims/gem
which pod
# == /Users/{{your user}}/.rbenv/shims/pod
which fastlane
# == /Users/{{your user}}/.rbenv/shims/fastlane
```
#### **5. ローカルビルド実行**
```sh
$ yarn build:local
```
---

### **Android環境構築**
- Android Studioは最新版にする。
- 注意：M1 Macの場合、NDKが必要だが現状対応していないので、ローカルビルドは諦めてEASクラウド開発ビルドを使用する。
- Android SDKは22から最新のAPIレベルまで全てインストールする。
  - Preference / System Settings / Android SDK
- 以下の対処をする前に、`yarn build:local`を実行してみる。問題が発生したら以下の対処を試す。
#### **Case. Android StudioのPATHを通す**
- Android_SDK_ROOTについてのエラーがなければ必要ない

```sh
# .bash_profile編集
vim ~/.bash_profile
```

```sh
# 以下追加。
export ANDROID_HOME=~/Library/Android/sdk
export ANDROID_SDK_ROOT=~/Library/Android/sdk
export ANDROID_AVD_HOME=~/.Android/avd
```

```sh
# 反映
source ~/.bash_profile
```

```sh
# 設定できているか確認
$ echo $ANDROID_SDK_ROOT
# == /Users/{{your name}}/Library/Android/sdk
$ echo $ANDROID_HOME
# == /Users/{{your name}}/Library/Android/sdk
$ echo $ANDROID_AVD_HOME
# == /Users/{{your name}}/.Android/avd
```

##### ローカルビルド実行
```sh
$ yarn build:local
```

#### **Case. local.propertiesを追加**
- 「1. Android StudioのPATHを通す」でエラーが出なければやらなくて良い
- `./android`に`local.properties`を作成。
- Android Studioで`./android`をプロジェクトとして開く
- `local.properties`内に自動でコードが書き込まれたら完了
##### ローカルビルド実行
```sh
$ yarn build:local
```

---

## **EASプロダクションビルド**
```sh
# クラウド
$ yarn build:prod
# ローカル
$ yarn build:prod:local
```

```sh
# iOSのデバイスの登録が必要。
$ yarn add-device:ios
```

READ.ME記載の「[Release](#release)」を参照


<br>

### **ビルドタイミング**
```
ネイティブ関連パッケージの追加などネイティブに関係する変更時のみ
その他（js, assets, ネイティブ無関係のライブラリ追加）の変更EAS Updateを使用する。
```
READ.ME記載の「[EAS Update](#easupdate)」を参照

---
## **EASプレビュービルド**
- 開発環境を実機テストしたい場合に使用
```sh
# クラウド
$ yarn build:preview
# ローカル
$ yarn build:preview:local
```

```sh
# iOSのデバイスの登録が必要。
$ yarn add-device:ios
```

<br>

### **ビルドタイミング**
```
ネイティブ関連パッケージの追加などネイティブに関係する変更時のみ
その他（js, assets, ネイティブ無関係のライブラリ追加）の変更EAS Updateを使用する。
```
READ.ME記載の「[EAS Update](#easupdate)」を参照



---

## **共有ビルド**
- GitLab上共有されたビルドファイル（.tar.gz, .apk, .aab, .app, .ipa）
- 各々のPCでビルドする時間を短縮する。
- 重たいので最新版をiOSとAndroidでのprofileごとそれぞれ一つずつまで。
```
./build-sharing
```

## **クラウド実機テスト**

https://webapp.appkitbox.com/login

```
AndroidとiOS実機端末をクラウド上でレンタルできるサービス。
端末立ち上げは簡単でアプリファイルをドラッグ&ドロップで簡単にインストールできる。
＊レンタル端末は同時に１台まで。
```

```sh
# アカウント
user: hiruma
pass: Hida0315
```


<br>


<h1 id="service"><b>使用サービス・ライブラリ</b></h1>

```
招待されていない場合は教えてください。
```
### **仕様・共有**
- GitLab （コード）
- [GitLab Wiki (スクリーン仕様)](https://gitlab.com/coreca-inc/coreca-app/-/wikis/home)
- Adobe XD （UI）
- diagrams.net （ER図）
- Google Drive
- サーバーサイド
   - Firebase (test, prod): React Native SDK
       - Firestore
       - Auth
       - Storage
       - Messaging
       - Functions （node）
   - GCP
### **クライアント**
 - React Native
     - Hermes Engine
     - fooks使用
     - reduxjs/toolkit
     - ContextAPI
 - Expo （ネイティブ機能吸収）
     - dev-client
     - EAS
### **マーケットプレイス**
 - App Store Connect
 - Google Play Console
### **開発環境**
 - MacOS （推奨）
 - Xcode
 - Android Studio
 - VSCode （推奨）
 - Chrome （推奨）
 - Expo Go （簡略版実機テスト）


<br>


<h1 id="er"><b>ER図</b></h1>

[diagrams](https://app.diagrams.net/#G1SKoqXo2mftBfj1fAgcqh9rXWUiT6yIgK)\
![ScreenShot](/uploads/f35b44dcee9a2ac4805550d4aa46d69d/Corecaモデル.drawio.png)
## **別途解説**
### **・手配/勤怠**
[ModelDetails](assets/pdf/model-details.pdf)


<br>


<h1 id="codingrule"><b>コーディング・ルール</b></h1>

## **TypeScript**

### **・ES6 に準拠した書き方**
   - import, export
   - アロー関数 () => {}
   - テンプレート `${}`
   - スプレッド構文 [...Array, new], {...Obj, key: new}（浅いコピーなので注意。深いコピーはlodashで_.deepClone）
   - 真偽判定 (bool ? yes : no。3重以上はifにする。)
   - undefined処理 (a ?? b)

### **・オブジェクト指向ではなく、関数型で実装する。**
js,tsは関数型のプリミティブを持たないのであくまで擬似\
=> **状態を持たない**純粋関数の合成でデータフローを記述する。（ただし画面系は状態あり）
- `switch/case`ではなく`ts-pattern`の`match/with`を使用する。（letの使用を避けるため）
- Arrayの処理は「新規配列 + push」ではなく`map`、`filter`、`reduce`、`sort`、`slice`などメソッドチェーンを使用する。（arrayをイミュータブルにするため）

### **・命名**
```
長くなっても良いので可能な限り省略しない。
```
#### **関数名・フォルダ名**
```
キャメルケース（例: appName）
```
#### **ファイル名・JSX.Element・Class・Type**
```
パスカルケース（例: CompName）
```
#### **定数**
```
大文字スネークケース（例: CONST_NAME）
```
#### **命名規則**
- ファイル名 => 述語+目的語（例：EditProfile）、目的語+修飾語（例：ProfileDetail）
- type =>  〜Type、〜Model（DBでの型）、〜Prop（JSX.Element引数）、〜Param（引数）、〜Response（返り値）、〜UIType（UI関連）、〜CLType（ClientTypeの略。DBのデータを表示用に加工した物を指す）
- usecases => 〜Case
- 現場サイドScreen => W〜
- 関数の命名 => get、update、write、delete、add、count、filter、sort、check（bool判定）、to{Type}（型変換）、to{Type}From{Type}（型変換）
- Servicesの関数 => _〜（例: _getWorker）（理由: usecaseの関数と差別化 + UIから直接呼び出さないようにprivateぽく）

### **・型定義**
`interface`や`Enum`ではなく`Type`を使用する
```js
export type SampleEnumType = 'worker' | 'admin'
export type SampleInterfaceType = {
  name: string,
  age?: number
} & OtherMergeType
```

### **・注釈**
`ts-doc`で記述する。
```js
/**
 * @param param1 説明
 * @param param2 説明
 * @returns 返り値の説明
 */
export const sampleFunction = () => {}
```

---
## **React Component**

### **・Components**
以下のようにフォルダ分けをする。
```
* atoms: 最小単位
* organisms: atomsの組み合わせ
* templates: screenクラスのコンポーネント=それ以上拡張できない
```

共通する要素は可能な限りComponent化する。その際、screen依存のロジックやstyleは記述しないようにする。=> **アトミック性大事**

### **・記述スタイル**
```
関数コンポーネント＋hooks（useState, useMemoなど）を使用する。
```

### **・ボタン**
`Pressable`を使用する。\
gestureとの共存のためには、トリガーは`onPress`ではなく、`onTouchStart`を使用する。

### **・FontStyle**
iOS と Android で共通化するため、`<Text>`の`fontFamily`は必ず`FontStyle`から使用する。\
   OS によって行間がずれるので「lineHight」も設定必須。

```js
import { FontStyle } from './utils/Styles'
<Text style={[{
  fontFamily: FontStyle.regular,
  lineHeight: 30
}]}>
```

### **・スクロール**
レンダリングコストから`ScrollView`ではなく`FlatList`を使用する。

### **・ViewStyle**
Componentは`style?: ViewStyle`をpropに定義して、以下のように親からのstyleを受け入れられるようにする。
```jsx
<View style={[{}, style]}>
```
または
```jsx
<View style={{ param: value, ...style }}>
```


---
## **Redux Toolkit**

### **・Slice**
Sliceには他の`screen`からのアクセスが必要になるデータのみ入れる。\
DB と Store の二重管理を防ぐため。\
関数内完結の場合は`useState`を使用。

---
## **ナビゲーション**

### **・Router.tsx**
screen作成時には`Router.tsx`へ記述する
```jsx
import SelectAccount from './adminSide/SelectAccount'
```

```jsx
export type RootStackParamList = Partial<{
    Default: DefaultStackType
    SelectMenu: {
        selectMenu: SelectMenuParams
    } & DefaultStackType
```

```jsx
<>
<MyStack.Screen
    name="AdminMyPageRouter"
    component={AdminMyPageRouter}
    options={({ route: { params } }) => {
        if (!params?.isHeaderLeftBack) {
            return {
                headerLeft: () => {
                    return <NavIcon colorStyle={BlueColor} navFunctionType={'admin_home'} />
                },
                title: '自社ページ',
            }
        }
        return {
            title: '自社ページ',
        }
    }}
/>
```

### **・型**
チェックを有効にするために。`'Default'`の部分を`Router.tsx`の`RootStackParamList`内のプロパティ=screenName から選択する。基本`'Default'`

```jsx
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../Router'
import { StackNavigationProp } from '@react-navigation/stack'
type NavProps = StackNavigationProp<RootStackParamList, 'Default'>
type RouteProps = RouteProp<RootStackParamList, 'Default'>

const SampleComponent = () => {
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    ...
```

### **・TabNavigator**
TabNavigator=>TabScreenの情報のやりとりはstoreではなく、contextを使用する。updateを子スクリーンに伝えるため。

### **・戻るボタン**
戻るボタンの文字は navigation の params に`backTitle`を設定して変更可能。

```js
navigation.push('RouteName', { backTitle: 'PreviousName' })
```

### **・現在のルート**現在のルート
名は`NavigationSlice`の`routeName`から取得可能。



### **・遷移**
`navigation.navigate`ではなく`navigation.push`を使用する。\
`navigation.navigate`は遷移先がスタック内に同じ画面がある場合に戻ってしまう。

---
## **画像**

### **・保存**
```sh
可能な限り「svg」で保存。
#「svg」厳しい場合は「jpg」じゃなくて「png」で保存。倍率は２倍まで。@2 をつける
```
```
保存先
assets/image
```
### **・SVG**
svg は内部の`path`に`fill`必須。変更可能にしたい`fill`のカラーは#000 にする。

```jsx
import SvgName from 'assets/image/sample.svg'
<SvgName width={20} height={20} fill={'#878'} />
```

---

## **UI**
```
直書OK
```
### **・Color**
色は可能な限り、`utils/Constants.ts:THEME_COLORS`か`utils/Styles.ts`、から使用する。

```jsx
export const THEME_COLORS = {
    BLUE: {
        MIDDLE: '#0082C7',
        LIGHT: '#0D93DB',
        SUPER_LIGHT: '#F8FBFD',
        MIDDLE_DEEP: '#0D6CB2',
        DEEP: '#194577',
        SUPER_DEEP: '#041C38',
        HIGH_LIGHT: '#00B3F3',
    },
    GREEN: {
        MIDDLE: '#C7D601',
        LIGHT: '#D6E600',
        SUPER_LIGHT: '#F7F8F2',
        DEEP: '#6C8D00',
        SUPER_DEEP: '#405205',
        HIGH_LIGHT: '#fff',
    },
    OTHERS: {
        GRAY: '#737680',
        BACKGROUND: '#F7F7F8',
        BORDER_COLOR: '#C9C9C9',
        PURPLE_GRAY: '#F5F4F7',
        LIGHT_GRAY: '#aaa',
        SUPER_LIGHT_GRAY: '#eee',
        ALERT_RED: '#EA2727',
        WARN_ORANGE: '#EA7227',
        PARTNER_GREEN: '#30AA96',
        CUSTOMER_PURPLE: '#5161B9',
        TIMER_SKY_BLUE: '#D3E3EB',
        TABLE_AREA_PURPLE: '#F3F2F4',
        LINK_BLUE: '#0074B2',
        LIGHT_PINK: '#EBD3D3',
        LIGHT_PURPLE: '#D7D6EA',
        LIGHT_ORANGE: '#EAE1D6',
        LIGHT_GREEN: '#D6EAD8',
        SUCCESS_GREEN: '#14AF26',
        BLACK: '#343538',
    },
}
```

### **・Margin**
コンポーネント間をあけるのは基本`marginTop`に統一。スタイル変更を煩雑にしないため。

### **・iPhoneX**
iPhoneXとその他の端末のスタイル分岐は`IfIphoneX`を使用。\
   ノッチ分の高さは`utils/Constants`から`IPHONEX_NOTCH_HEIGHT`と`IPHONEX_BOTTOM_HEIGHT`を使用するようにする。

```jsx
style={{
  flex: 1,
  ...IfIphoneX({
    marginTop: 30 + IPHONEX_NOTCH_HEIGHT
  }, { marginTop: 30 })
}}
```

### **・キーボード**
キーボードでコンテンツ隠れる問題は、Expo のではなく、以下のライブラリを使用。
```js
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
```

### **・Android固有**

#### 1. styleで`background: undefined`はAndroidではエラーになる。
#### 2. Android環境でのzIndex
```
AndroidではzIndexによるレイヤーの制御はほぼ出来ない。iPhoneで動かすため、zIndexを使っているところは、Platform.OSで切り分け、Androidの場合はundefinedにする。 レイヤーの上下関係は、コンポーネントの定義順序どおりとなる。
```

```
AndroidでだけzIndexが効かない場合は`elevation: Platform.OS === 'android' ? 10 : 0,`を試してみる。elevationは標高。TextのzIndexは効かないことがある。
```

#### 3. Android環境でのborderRadius
Android環境でborderRadiusが謎に反映されないときは以下のスタイルに変更する。
```jsx
borderTopLeftRadius: borderRadius,
borderTopRightRadius: borderRadius,
borderBottomLeftRadius: borderRadius,
borderBottomRightRadius: borderRadius,
```
### **・FontFamily**
```
OS間のデザインを揃えるため、fontFamilyを必ず設定する。FontStyleかGlobalStyleから使用する。独自に設定する場合は、lineHeightの設定も忘れずに（これないとAndroidでずれる）
```

### **・影**
```
影が必要になったらコンポーネントのShadowBoxで可能な限り実装する。（Shadow周りは不具合発生しやすいので共通化するために）
```

### **・サイズ**
サイズは`%`ではなく`数字`統一で。

### **・UIテキスト**  
アクションを表すテキストは動詞。\
例）保存 => 保存する

---
## **Firebase**

1. `param: undefined`は無視される。undefinedにしてもフィールドは削除されない。`param: deleteField()`するとフィールドを削除できる。
2. `where('param', 'in', array)`の`array`が空だとエラーが出るので、必ずチェックして弾く。
3. `where('param', 'in', array)`の`array`は`length`の上限が10なのでforループ必要。

---
## **Service**

### **_get関数**
`_get〜`の`options`でグラフ的で直感的な取得が可能。ただし複数取得においては冗長な方法になりえるので、最適化する際は別途処理の記述をおすすめする。
```jsx
_getWorker(workerId, options: {
   arrangements: {
      params: {
         arrangementDate: new CustomDate()
      },
      site: true
   },
   company: {
      partnerCompanies: true
   },

})
```

---
## **責務**

```
model <- service <- usecase <- screen
```
### **Model**
```sh
DBの型や依存ライブラリ、サービスの型を記述
# UI関連の型と関数は入れない。
```
注意：model変更時はサーバーサイドのmodelも同様に変更する。
### **Service**
```sh
依存先関連の処理関数を記述
# サーバーからのデータ取得や依存ライブラリやネイティブ機能の使用など
# 外部のロジックを処理。
```
注意：service変更時はサーバーサイドのservice（特にparam）も同様に変更する。
### **Usecase**
```sh
UIへのデータ受け渡し関数を記述
# データをUIで表示できるように取得、整形処理する。
# クライアント特有のビジネスロジックやUIロジックを処理。
```

### **Screen**
```sh
UI表示と遷移を記述
# ScreensとComponentsから構成される。
# 注意：Componentも遷移を負う。なぜなら遷移関数の受け渡しが多重になる上、usecaseにも遷移関数を渡す必要があり煩雑になるため
```

### **依存関係**
```sh
model <- service <- usecase <- screen
# 依存関係を飛ばしたり、依存元に依存して循環関係にしないようにしてください。
```
```
例)
+ OK: screenがusecaseの関数を使う 
- NG: screenがserviceの関数やmodelの型を使う。（依存関係を飛ばしている）

+ OK: serviceがserviceの関数やmodelの型を使う。
- NG: serviceがusecaseの関数を使う。（依存が循環してしまう）
```

### **ファイル分け**
- model: ドメインまたはそれに関連するTypeごと。
- service: ドメインごと。機能群ごと。
- usecase: 処理フローごと。EditとCreateは共通化可能なら共通化。
- screen: 画面ごと

### **Type**
typeのパラメータは基本Partialにする。つまりundefinedを許容。理由：要不要判断の責務はあくまで関数側にあるため。typeが背負うことではない。

---
## **その他**

### **・Error処理**
error処理models内の`CustomResponse`を使用する。tryのネストとエラーの所在不明を防ぐため、`Promise.resolve`で全て処理する。`Promise.reject`は使わない。toastに渡す際はerrorの型に注意。以下のように対応する。

```jsx
...} catch (error) {
  const _error = error as CustomResponse
  return Promise.resolve({
      error: _error.error,
      errorCode: _error.errorCode
  })
}
```

### **・try〜catch**
副作用が伴う関数（await）を実行する場合は必ずtry〜catchの中で実行する。


### **・タイムゾーン**
```
クライアント側ではローカルTZ（例：Asia/Tokyo）を使用。
DBにあげるデータは必ず、totalseconds: numberにする。
なぜなら、totalsecondsはTZに対して普遍的な数値だから。
```
#### **日付を表現したい場合**
```tsx
// 型
type YYYYMMDDTotalSeconds
```

```tsx
// 取得方法
const totalSeconds: YYYYMMDDTotalSeconds = getYYYYMMDDTotalSeconds(date)
```

```
例：2022/08/05
ローカルTZで`2022-08-05-XX:XX`のCustomDateを生成して、
getYYYYMMDDTotalSeconds(date)でYYYYMMDDTotalSecondsを取得する。
```

#### **月を表現したい場合**
```tsx
// 型
type YYYYMMTotalSeconds
```

```tsx
// 取得方法
const totalSeconds: YYYYMMTotalSeconds = getYYYYMMTotalSeconds(date)
```

```
例：2022/08
ローカルTZで`2022-08-XX-XX:XX`のCustomDateを生成して、
getYYYYMMTotalSeconds(date)でYYYYMMTotalSecondsを取得する。
```


### **・ローカライズ**

#### **テキスト追加**
```
`src/localization/translations/**`の英語`en`と日本語`ja`にそれぞれ翻訳したテキストを追加する。
```

翻訳は[DeepL](https://www.deepl.com/ja/translator)を使用。



### **・環境変数**

コンソールで設定したnodeの環境変数をアプリ内で使用したい場合の方法。

#### **1) package.jsonにて**
```sh
# 例
$ VARIABLE_NAME=value yarn start
```

#### **2) app.config.jsにて**
```js
{
    expo: {
        extra: {
            // 呼び出し名はvariableNameで設定。
            variableName: process.env.VARIABLE_NAME
        }
    }
}
```

### **3) 使用箇所にて**
```tsx
import Constants from 'expo-constants'
console.log('display', Constants.expoConfig.extra.variableName)
```


<br>

### **画面の自動更新updateScreensに関して**
キャッシュが実装されたことにより、画面に表示している情報とサーバーの情報に乖離が発生してしまう問題があります。<br>
それを防ぐため、サーバーの情報が更新された際には、updateScreensを使って、リロードが必要なページを更新するようにします。<br>
updateScreensはサーバー側のUpdateScreensと、ローカルのstoreで保存しているlocalUpdateScreensがあります。<br>
サーバー側のupdateScreensは、情報の変更をトリガーし、更新が必要なスクリーン名、対象アカウントなどを保存します。<br>
対象のアカウントがスクリーンを開いた際、updateScreensを確認し、更新が必要ならリロードして、updateScreensからリロードしたスクリーンを削除します。<br>
localUpdateScreensは、サーバー側の反映を待たずして編集者が更新が必要なページを開いた場合に対応します。<br>
また、全ての情報取得をスナップショットで行っているスクリーンに関しては、updateScreensによる更新は不要です。<br>
updateScreensは、更新対象を特定するために、以下の3つのキーのいずれかを持ちます。<br>
ids,idAndDates,dates,<br>
また、全てのキャッシュをリセットする場合は、isAllがtrueになります。<br>

<br>
<h1 id="gitflow"><b>GitFlow+</b></h1>

### 以下Git使用時のルール
 - ブランチ
     - master
         - マーケットプレイスや内部テスト状態に合わせる
     - develop
         - 開発におけるメインのブランチ
     - 個人ブランチ（例：　daichi.hiruma）
         - 普段の業務のコミット先。実装後はこの個人ブランチをdevelopにマージする。
         - 細かい調整などの実装の場合はfeatureブランチを切らずに個人ブランチにそのまま実装してdevelopにマージする。
         - （細かい修正でわざわざfeatureブランチ切るのは面倒だがかといってdevelopブランチで直接作業はしてほしくないので。）
     - featureブランチ
         - 大きめの機能実装時はdevelopから「feature/機能概要」ブランチを切って、それで実装する。
         - 実装後は個人ブランチにマージして、個人ブランチをdevelopブランチにマージする。
         - 複数人参画する場合、
1. 機能追加や修正や改修等、実装ごとにイシューを作成（GitLABのイシュー参照）。
2. ローカルリポジトリの自身のブランチで、機能追加や修正や改修等ごとにfeature/issue#*ブランチを切ってそこで実装を行う。イシューを切っていないものはfeature/ファイル名や機能名、とする。
     - 例）feature/issue#1
     - 例）feature/dashboardcontextprovider
3. feature/******ブランチでの実装を終えてDebugも終えたら、Commit。
Commitメッセージの例）
     - 機能実装の場合 “Add: 何を機能追加したかのメッセージ”
     - 修正の場合 “Update: 何を修正したかのメッセージ”
     - 改善の場合 “Improve: 何を改善したかのメッセージ”
     - Bug改修の場合 “Fix: 何を改修したかのメッセージ”
4. 自身のブランチへ移動し、feature/******ブランチをmerge。
feature/******ブランチリモートへpushする必要はない。
5. 自身のブランチをリモートリポジトリとsync。
6. イシューをClose。
7. feature/******ブランチを削除。
### 開発ブランチ名
- feature/機能名やファイル名
- feature/issue#--（issueチケットがある場合）
### ブランチモデル
ブランチモデルはgitflow + 1で、以下のように構成（Cloudのデプロイ先が3つあるイメージ）\
master（商用SV環境）\
 |-release（習熟SV環境、これは案件に応じて省く場合あり）　　\
 ____|-develop（TestbedSV環境）　　\
 _________|-yukihiro.okuda（Local環境）
- Localブランチは各人の開発用であり、開発者各々が自端末内で好きなように開発できる（他メンバと完全に独立した環境）。
- 各人の開発をマージする先がdevelopであり、ここで各人の開発の結合テストやE2Eテストを行う。
- 基本、端末にLocal環境を構築して開発し、developではTestbedSV上での結合テスト、結合テスト済みのコードを習熟へ、さらに商用へとマージしていくgitflow + 1ブランチモデル。
- master/release/developブランチはProtectedブランチとし、maintener以外はpushやmergeができない。
- 各人は、常にdevelopブランチから最新コードをrebaseしながら開発を継続する。
- 各人は、mergeリクエストする前に必ずdevelopブランチから最新コードをrebaseしてコンフリクトを解消しておく。
- developへのmergeでコンフリクトが発生した場合、その責任はmaintenerではなく開発者。
- ＊git-config-templateファイルを共有する。
- ＊.gitattributesファイルを共有する。
- ＊.gitignoreでLocal環境向けのファイルを除外する。
- ＊各種hideファイル（.ではじまるファイル）群は、各人がLocal環境ごとに編集する場合は.gitignoreへ追加する（ただし、これはバージョン管理が始まる以前に追加せねば効かない）。

#### イシューは自分でクローズしてください。

<br>

<h1 id="release"><b>Release</b></h1>


## **1. 準備**
### app.config.js/expo.version
```sh
version a.b.c
a => 開発フェーズ
b => 機能単位
c => 微調整・バグ改修など
```

### Expoログイン（これは端末で１度だけすればOK）
```sh
$ expo login
```
## **2. ビルド（１時間ほど）**
```sh
# クラウド
$ yarn build:prod

# ローカル
$ yarn build:prod:local
```

## **3. 提出**
### 自動提出
```sh
$ yarn submit
# 自動提出
```


### 手動提出
- ipa/aabファイルをダウンロード
    - https://expo.dev/accounts/coreca-app
- Macでトランスポーターを使って、ipaファイルをアップロード＆デリバリー
- Google Play Consoleにaabファイルアップロード

## **4. テスト開始準備**
### iOS
- Apple Store Connectで最新バージョンの輸出コンプライアンスに同意する。
    - Appには暗号化が使用されていますか？ => はい
    - Appは、米国輸出管理規則の第２部、カテゴリ５に記載の免除資格をすべて満たしていますか？ => はい
### Android
- 内部テストとしてリリース（Coreca test release ver.？？）
- https://play.google.com/console/u/0/developers/6041412441946042768/app/4972604696039197559/tracks/4698993153590064901?tab=releases

## **5. 告知**
### iOS
    - iPhoneはTestFlightで自動アップデート
### Android
    - 自動化されないので以下よりダウンロード＆アップデートしていただくようにする。
    - https://play.google.com/apps/internaltest/4698993153590064901


<br>


<h1 id="package"><b>About Package</b></h1>

## react-native-firebase
```
@14
```
- v15だと`use_frameworks!`が使えない限り、functionsとstorageが使用できない。`react-native-google-maps`があるので`use_frameworks!`だとコンパイルが通らない。
- https://github.com/invertase/react-native-firebase/issues/6382
```
Firebase storage and Firebase functions require use_frameworks! in your Podfile, it's what generates those files. If you can't use use_frameworks, and you ned functions and/or storage, you can't use v15. There's no simpler way to put it unfortunately. Use v14 in that case and help in the underlying issues (with flipper or whatever the 3rd party module is that has a problem) in order to get use_frameworks! to work then this whole thing will move forward and get easier for everyone
```
```
FirebaseストレージとFirebaseファンクションは、Podfileにuse_frameworks!が必要で、これがこれらのファイルを生成します。もし、use_frameworksが使えず、関数やストレージが必要な場合は、v15を使うことはできません。残念ながら、これ以上簡単な言い方がありません。この場合、v14を使い、use_frameworksを動作させるための根本的な問題（flipperやサードパーティモジュールの問題）を解決してください。
```

## expo
```
@46
```
- dev-client-buildが不安定なので可能な限り最新にする

## react-native
```
@68
```
- v69だとViewPropTypesが非推奨でエラーを出す。react-native-lottieがなぜか使えない（使用箇所は見当たらない）。

## @expo/config-plugins
```
@5.0.0
```
- expo46は5.0.0を求めている。しかし、firebaseでは4.1.5が使用されているので、不具合の元になっているかも？


<br>

<h1 id="settingfile"><b>設定ファイル （app.config.js, eas.json）</b></h1>

## **buildについて説明。**
```sh
CONFIG_ENV=development eas build --profile development
```
### --profile
```
eas.jsonのbuildに影響します。特にクラウドビルド時のbuild/env/APP_ENVの設定をします。
```

### APP_ENV（環境変数）
```
 --local（ローカルビルド）の場合のapp.config.jsの以下の部分に影響します。
- process.env.CONFIG_ENV == 'production'
主に、firebaseの設定ファイルと、google mapの設定ファイルを設定します。
```

## **ビルドナンバーを反映させるには**
eas.jsonやapp.config.jsの内容をiosやandriodフォルダに反映させるには以下のコマンドを実行する必要があります。
```sh
$ yarn prebuild
# 中身 expo prebuild
```

<br>

<h1 id="easupdate"><b>EAS Update</b></h1>

## **概要**
```
EAS Updateは、expo-updatesライブラリを使用したプロジェクトのアップデートを提供するホスティング・サービスです。
EAS Updateは、小さなバグを修正したり、アプリストアに提出するまでの間に素早く修正を加えることを可能にします。
これは、エンドユーザーのアプリが、
アプリの非ネイティブ部分（例えば、JS、スタイリング、画像の変更）を、バグ修正とその他のアップデートを含む新しいアップデート
と交換できるようにすることで実現されるものです。
expo-updates ライブラリを実行しているすべてのアプリは、アップデートを受信する機能を備えています。
```

```
expo.devのDeploymentsでupdate状況が確認可能。
```

## **対象**
```sh
expo-updatesライブラリを実行しているクラウドビルド（ローカルビルドは対象外）
# = releaseChannelとruntimeVersionが設定されているビルド
# GUIでbuildとupdateの紐付けを確認できる。
```
## **変更可能箇所**
- js
- スタイリング
- assets（画像など）

## **Update先**
```sh
releaseChannel.runtimeVersion
```
### releaseChannel
```sh
# 以下から選択
* preview
* production
```
### runtimeVersion
```sh
app.config.js/expo.runtimeVersion
# ネイティブ部分の変更ごと（=変更可能箇所を超えるごと）にバージョンアップする
```
## **Updateコマンド**
```sh
# preview channel
$ yarn update:preview

# production channel
$ yarn update:prod

# 中身　eas update --branch [branch] --message [message]
```


<br>

<h1 id="glossary"><b>用語集</b></h1>


| 用語                   | 英語                                | 説明                                                                                                                                                                             |
| ---------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 認証                   | Auth                                | 認証                                                                                                                                                                             |
| アカウント             | Account                             | 作業員と１対１でつながるユーザーサイドの概念。                                                                                                                                   |
| ローカルアカウント     | LocalAccount                        | デバイス保存のアカウント。デバイスごとにリストで保存し、ログインの切り替えができる。部署ごとに会社作成して切り替るなど。                                                         |
| 作業員                 | Worker                              | 職人や管理者、作業員など人に結びつく概念。                                                                                                                                       |
| 未登録作業員           | UnregisterWorker                    | 実際の作業員(RealWorker)においてアカウントと連携していない作業員。管理者が招待することで連携できる。                                                                             |
| 未手配作業員         | PreArrangementWorker                   | ある日において、その日手配されておらず、休みではなく、isOfficeWorkerでもない自社作業員と手配されていない常用予約人数の総数。     
| 手配可能作業員         | ArrangeableWorker                   | ある日において、休みではなく、isOfficeWorkerでもない自社作業員と常用予約人数の総。                                                  |
| 現場                   | Site                                | 作業員が手配される仕事場。メインとなる概念。現場と会社の関係は工事と会社の関係と同じになる。                                                                                     |
| 工事                   | Construction                        | 現場をまとめた単位。請負で受発注する際の粒度。工事と会社の関係は、オーナー、自社施工、仲介、仮会社施工、常用の５種類がある。                                                     |
| 案件                   | Project                             | 工事をまとめた単位。案件に色んな会社が参画するイメージ。発注受注際は請負案件という概念になる。                                                                                   |
| 取引                   | Transaction                         | 顧客/取引先との明細が発生する取引。請負契約と常用依頼がある。                                                                                                                    |
| 請負                   |                                     | 外部へ工事を受発注すること。 明細や取引において常用と対をなす。                                                                                                                  |
| 請負案件               | ContractingProject                  | 契約目線で見た案件。実態は契約。請負案件はある会社における案件に関わる契約の出発点を指す（契約ツリー上におけるその会社の最上位契約）。請負契約は請負案件の以下の契約全てを指す。 |
| 契約、請負契約         | Contract                            | 工事を請負で受発注する際の契約。請負契約は請負案件の以下の契約全てを指す。                                                                                                       |
| 常用                   |                                     | 外部からの作業員の派遣や常用のこと。受け手か送り手かどうかは文脈による。明細において請負と対をなす。                                                                             |
| 常用予約               | Reservation                         | 常用する前の会社指定の準備のこと。人数を指定することもある。常用依頼という取引をスムーズに進めるために必要な存在。常用予約の人数を消費して、常用依頼するイメージ。               |
| 常用依頼               | Request                             | 常用（=派遣、常用）を依頼すること。「会社Aに5人常用を依頼する。」「常用で現場Bに行く。」                                                                                         |
| 手配                   | Arrangement                         | 作業員を現場へ配置すること。                                                                                                                                                     |
| 現場手配               | PlacingArrangement                  | 現場に自社作業員を配置する際の手配。                                                                                                                                             |
| 応答                   | Respond                             | 常用依頼に対して応答すること。自社作業員での手配と他社作業員での応答手配がある。                                                                                                 |
| 自社作業員での応答手配 | RespondArrangement / SubArrangement | 常用依頼に対しての応答での手配。                                                                                                                                                 |
| 他社作業員での応答手配 | RespondRequest / SubRequest         | 常用依頼に対して外部の常用依頼で応答すること。                                                                                                                                   |
| 応答待ち               | Waiting                             | ある常用依頼に対して、依頼数と応答数の差分や依頼先会社の手配を待っている状態のこと。                                                                                             |
| 稼働数                 | ActualWork                          | ある常用依頼や現場に対して、その常用依頼の応答待ちを除いた数のこと。勤怠で使用する。                                                                                             |
| 応答完了               | ConfirmedRespond                    | 作業員の手配まで完了した常用依頼。「応答完了」とも呼ぶ。勤怠データの存在と手配（Arrangement）との結びつきによって完了を保証する。                                                |
| 会社                   | Company                             | 作業員が所属するところ。作業員ごとに代表者、管理者、一般作業員など権限が存在する。                                                                                               |
| 顧客/取引先            | PartnerCompany                      | 常用や請負など自社とさまざまな取引が可能な会社。招待することで顧客/取引先になる。                                                                                                |
| 連携済み顧客/取引先    |                                     | 顧客/取引先のうちアカウント連携している会社。仮会社と結合して、集計することができる。                                                                                            |
| 仮会社                 | DammyCompany                        | 顧客/取引先のうち、実際のアカウントに連携していない会社。相手会社がアプリを使っていない際に作成する。連携済み顧客/取引先と結合して、集計することができる。                       |
| 勤怠                   | Attendance                          | 作業員の現場の入退場時間などを管理する。手配と作業員と１対１で結びつく。                                                                                                         |
| 集合日時               | MeetingDate                         | 集合時間。業務時間にはカウントしない。                                                                                                                                           |
| 作業日時               | StartDate〜EndDate                  | 作業開始時間から作業終了時間。給与が発生する業務時間。                                                                                                                           |
| 明細                   | Invoice                             | 会社ごと月毎に請求・支払いをする際の情報。計算方法は請負と常用で分かれる。請負は工事受発注時に設定した金額。常用は人工(にんく)計算(人日と同じ。建設業界用語)。                   |
