# 端末環境構再構成の手引き

以下、開発端末の環境が崩してしまった場合のリカバリー手引きです。

＊本READMEの内容は頻繁に変わるため、以下の更新日付を確認するようにしてください。

### 更新日：2022.09.15
---
## ■ 設定ファイルの復元
以下の設定ファイル群を変更した場合は、それらを一旦退避させた上でリポジトリから再取得して差分を確認する(ないし元に戻す)

### firebase.json（ Firebaseとの接続に影響）
```json
{
  "hosting": {
    "public": "hosting",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ]
  },
  "functions": {
    "predeploy": "npm --prefix functions run build",
    "source": "../coreca-server"
  },
  "emulators": {
    "firestore": {
      "port": 8980,
      "host": "127.0.0.1"
    },
    "storage": {
      "port": 9920
    },
    "ui": {
      "enabled": true
    },
    "auth": {
      "port": 9810
    },
    "functions": {
      "port": 5201
    },
    "database": {
      "host": "127.0.0.1",
      "port": 9910
    },
    "hosting": {
      "port": 5210
    },
    "pubsub": {
      "host": "127.0.0.1",
      "port": 8595
    }
  },
  "storage": {
    "rules": "storage.rules"
  },
  "react-native": {
    "android_task_executor_maximum_pool_size": 10,
    "android_task_executor_keep_alive_seconds": 3
  }
}
```
### .firebaesc（ Firebaseとの接続に影響）
```json
{
  "projects": {
    "default": "coreca-98aa2",
    "prod": "coreca-98aa2"
  },
  "targets": {}
}
```
### eas.json（ビルドに影響）

```json
{
  "cli": {
    "version": ">= 2.1.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "buildConfiguration": "Debug",
        "simulator": true,
        "image": "latest"
      },
      "env": {
        "CONFIG_ENV": "development"
      }
    },
    "production": {
      "ios": {
        "image": "latest"
      },
      "env": {
        "CONFIG_ENV": "production"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "assets/eas-android-api-key.json",
        "track": "internal"
      },
      "ios": {
        "appleId": "EXPO_APPLE_ID",
        "ascAppId": "1590311325",
        "appleTeamId": "G27X2L7784"
      }
    }
  }
}
```

### app.config.js（旧app.json、ビルドに影響）
```js
export default {
    expo: {
        name: 'CORECA',
        slug: 'coreca-app',
        version: '1.0.4',
        scheme: 'coreca',
        owner: 'coreca-app',
        orientation: 'portrait',
        icon: './assets/icon.png',
        splash: {
            image: './assets/splash.png',
            resizeMode: 'contain',
            backgroundColor: '#ffffff'
        },
        userInterfaceStyle: 'automatic',
        updates: {
            fallbackToCacheTimeout: 0
        },
        assetBundlePatterns: [
            '**/*'
        ],
        jsEngine: 'hermes',
        plugins: [
            'expo-location',
            /**
             * RNFB v14かv15かでV14とV15を切り替える。
             */
            './withReactNativeFirebaseV14.js',
            /**
             * firebaseをinitializeするために必要。
             */
            '@react-native-firebase/app',
            /**
             * firebase RN 15.11.1では必要ない。
             */
            // 'expo-build-properties',
            // {
            //     'ios': {
            //         // これを入れるとreact-native-google-mapsがiOSでコンパイルできなくなる。
            //         'useFrameworks': 'static'
            //     }
            // }
        ],
        ios: {
            /**
             * eas build時にAPP_ENV=developmentのように環境変数を渡すことでprocess.env.APP_ENVに反映される。
             */
            googleServicesFile: process.env.APP_ENV == 'production' ? './GoogleService-Info-prod.plist' : './GoogleService-Info.plist',
            /**
             * プロダクションデプロイするたびにここの数字をあげる。
             */
            buildNumber: '94',
            supportsTablet: false,
            config: {
                googleMapsApiKey: process.env.CONFIG_ENV == 'production' ? 'AIzaSyDw_6r8Iz_hJA_s8Eb3e2fB7sIUzBxQu3A' : 'AIzaSyChP4D62c934K82nJmwNF1R7759QriMrEQ'
            },
            associatedDomains: [
                'applinks:coreca-test.web.app'
            ],
            infoPlist: {
                'CFBundleDevelopmentRegion': 'ja_JP',
                'NSPhotoLibraryUsageDescription': 'アイコン画像をアップロードするためにフォトライブラリを使用します。',
                'NSLocationAlwaysUsageDescription': '現場管理者に勤務場所を共有するために位置情報を取得します。',
                'NSLocationUsageDescription': '現場管理者に勤務場所を共有するために位置情報を取得します。',
                'NSLocationWhenInUseUsageDescription': '現場管理者に勤務場所を共有するために位置情報を取得します。'
            },
            bundleIdentifier: 'com.coreca.app'
        },
        android: {
            /**
             * プロダクションデプロイするたびにここの数字をあげる。
             */
            versionCode: 94,
            adaptiveIcon: {
                foregroundImage: './assets/icon.png',
                backgroundColor: '#FFFFFF'
            },
            googleServicesFile: process.env.CONFIG_ENV == 'production' ? './google-services-prod.json' : './google-services.json',
            config: {
                googleMaps: {
                    apiKey: (process.env.CONFIG_ENV == 'production' ? 'AIzaSyA4aJmvyl2byxclV7Za_jWTCIhjMOLcixE' : 'AIzaSyBo1Xp_CBN6_jfsGiV6n_17K8iqDFXRlgQ')
                }
            },
            intentFilters: [{
                action: 'VIEW',
                data: [{
                    scheme: 'coreca'
                }],
                category: [
                    'BROWSABLE',
                    'DEFAULT'
                ]
            },
            {
                action: 'VIEW',
                autoVerify: true,
                data: [{
                    scheme: 'https',
                    host: 'coreca-test.web.app',
                    pathPrefix: '/inviteCompany'
                },
                {
                    scheme: 'https',
                    host: 'coreca-test.web.app',
                    pathPrefix: '/inviteWorker'
                }
                ],
                category: [
                    'BROWSABLE',
                    'DEFAULT'
                ]
            }
            ],
            permissions: [
                'NOTIFICATIONS',
                'ACCESS_COARSE_LOCATION',
                'ACCESS_FINE_LOCATION',
                'android.permission.ACCESS_COARSE_LOCATION',
                'android.permission.ACCESS_FINE_LOCATION',
                'android.permission.FOREGROUND_SERVICE'
            ],
            package: 'com.coreca.app'
        },
        extra: {
            eas: {
                projectId: '59069ef3-dca6-4254-bfcf-737600e0d9af'
            }
        }
    },
    web: {
        favicon: './assets/favicon.png'
    }
}
```

### Gemfile（ビルドに影響）
```json
# frozen_string_literal: true

source "https://rubygems.org"

# gem "rails"
gem "cocoapods"
gem "fastlane"```
```

### .bundle/config（ビルドに影響）
```json
---
BUNDLE_PATH: "vender/bundler"
```

### env/env.ts（ビルドに影響）
```ts
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
    }
}

export default ENV
```

### ios/Podfile（ビルドに影響）
```sh
require File.join(File.dirname(`node --print "require.resolve('expo/package.json')"`), "scripts/autolinking")
require File.join(File.dirname(`node --print "require.resolve('react-native/package.json')"`), "scripts/react_native_pods")
require File.join(File.dirname(`node --print "require.resolve('@react-native-community/cli-platform-ios/package.json')"`), "native_modules")

require 'json'
podfile_properties = JSON.parse(File.read(File.join(__dir__, 'Podfile.properties.json'))) rescue {}

platform :ios, podfile_properties['ios.deploymentTarget'] || '12.4'
install! 'cocoapods',
  :deterministic_uuids => false

target 'CORECA' do
  use_expo_modules!
# @generated begin react-native-maps - expo prebuild (DO NOT MODIFY) sync-e9cc66c360abe50bc66d89fffb3c55b034d7d369
  pod 'react-native-google-maps', path: File.dirname(`node --print "require.resolve('react-native-maps/package.json')"`)
# @generated end react-native-maps
  config = use_native_modules!

  use_frameworks! :linkage => podfile_properties['ios.useFrameworks'].to_sym if podfile_properties['ios.useFrameworks']

  # Flags change depending on the env values.
  flags = get_default_flags()

  use_react_native!(
    :path => config[:reactNativePath],
    :hermes_enabled => flags[:hermes_enabled] || podfile_properties['expo.jsEngine'] == 'hermes',
    :fabric_enabled => flags[:fabric_enabled],
    # An absolute path to your application root.
    :app_path => "#{Dir.pwd}/.."
  )
  $RNFirebaseAsStaticFramework = true

  # Uncomment to opt-in to using Flipper
  # Note that if you have use_frameworks! enabled, Flipper will not work
  #
  # if !ENV['CI']
  #   use_flipper!()
  # end

  post_install do |installer|
    react_native_post_install(installer)
    __apply_Xcode_12_5_M1_post_install_workaround(installer)
  end

  post_integrate do |installer|
    begin
      expo_patch_react_imports!(installer)
    rescue => e
      Pod::UI.warn e
    end
  end

end
```

### GoogleService-Info.plist（iOSからFirebaseへの接続、認証に影響）
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CLIENT_ID</key>
	<string>4658969885-h5138pkrl692s5m1c9aet7gfo0iu6p94.apps.googleusercontent.com</string>
	<key>REVERSED_CLIENT_ID</key>
	<string>com.googleusercontent.apps.4658969885-h5138pkrl692s5m1c9aet7gfo0iu6p94</string>
	<key>API_KEY</key>
	<string>AIzaSyCh2mBtNYMhqzQhkm9kwyD5bvOwnxRfVro</string>
	<key>GCM_SENDER_ID</key>
	<string>4658969885</string>
	<key>PLIST_VERSION</key>
	<string>1</string>
	<key>BUNDLE_ID</key>
	<string>com.coreca.app</string>
	<key>PROJECT_ID</key>
	<string>coreca-98aa2</string>
	<key>STORAGE_BUCKET</key>
	<string>coreca-98aa2.appspot.com</string>
	<key>IS_ADS_ENABLED</key>
	<false></false>
	<key>IS_ANALYTICS_ENABLED</key>
	<false></false>
	<key>IS_APPINVITE_ENABLED</key>
	<true></true>
	<key>IS_GCM_ENABLED</key>
	<true></true>
	<key>IS_SIGNIN_ENABLED</key>
	<true></true>
	<key>GOOGLE_APP_ID</key>
	<string>1:4658969885:ios:039714ec474bc3a139b5f4</string>
	<key>DATABASE_URL</key>
	<string>https://coreca-98aa2-default-rtdb.firebaseio.com</string>
</dict>
</plist>
```

### google-services.json（AndroidからFirebaseへの接続、認証に影響）
```json
{
  "project_info": {
    "project_number": "4658969885",
    "firebase_url": "https://coreca-98aa2-default-rtdb.firebaseio.com",
    "project_id": "coreca-98aa2",
    "storage_bucket": "coreca-98aa2.appspot.com"
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "1:4658969885:android:467fc3746cad5b8739b5f4",
        "android_client_info": {
          "package_name": "com.coreca.app"
        }
      },
      "oauth_client": [
        {
          "client_id": "4658969885-aktl4oja62kligfin7pbm9amq56g9br7.apps.googleusercontent.com",
          "client_type": 3
        }
      ],
      "api_key": [
        {
          "current_key": "AIzaSyBqjbFgo-oncYQVISwXaJHeqbBQGVqNJPY"
        }
      ],
      "services": {
        "appinvite_service": {
          "other_platform_oauth_client": [
            {
              "client_id": "4658969885-aktl4oja62kligfin7pbm9amq56g9br7.apps.googleusercontent.com",
              "client_type": 3
            },
            {
              "client_id": "4658969885-h5138pkrl692s5m1c9aet7gfo0iu6p94.apps.googleusercontent.com",
              "client_type": 2,
              "ios_info": {
                "bundle_id": "com.coreca.app"
              }
            }
          ]
        }
      }
    }
  ],
  "configuration_version": "1"
}
```

### ios/local.properties（ビルドに影響）
```json
これはなくても問題ない
```

### .rubyversion（ビルド時のRubyのバージョンに影響）
```json
3.1.2
```

## ■ app.config.jsビルドに関わる留意点
- pluginsの設定は無用に変更するとビルドエラーに直結するので注意
```js
        plugins: [
            // SDK46では"expo-build-properties"の記述をしないこと（ビルドエラーとなる）
            'expo-location',
            /**
             * RNFB v14かv15かでV14とV15を切り替える。
             */
            './withReactNativeFirebaseV14.js',
            /**
             * firebaseをinitializeするために必要。
             */
            '@react-native-firebase/app',
            /**
             * firebase RN 15.11.1では必要ない。
             */
            // 'expo-build-properties',
            // {
            //     'ios': {
            //         // これを入れるとreact-native-google-mapsがiOSでコンパイルできなくなる。
            //         'useFrameworks': 'static'
            //     }
            // }
        ],
```

- このHermesの設定を削除するとパフォーマンスに影響を及ぼす
```js
        // "plugins"と同列の階層に記述
        "jsEngine": "hermes”,
```

## ■ Podfileのオリジナルからの変更点
```sh
   # use_react_native!(……)の次の行に以下を追加
  $RNFirebaseAsStaticFramework = true
```

## ■ .bash_profileのPATH設定を記録
以下は参考例だが、Macではほぼそのまま使えるはず（M1 Mac向けの/opt/homebrew/binの部分だけIntel Macでは修正必要）

```sh
# rbenv にパスを通す
[[ -d ~/.rbenv  ]] && \
  export PATH=${HOME}/.rbenv/bin:${PATH} && \
  eval "$(rbenv init -)"

# M1 Macでは/optにhomebrewを入れてこちらを使う必要あり
export PATH=$PATH:/opt/homebrew/bin

# nodebrew
export PATH=$PATH:$HOME/.nodebrew/current/bin

# Android Studio関連1
export ANDROID_HOME=$HOME/Library/Android/sdk
export ANDROID_SDK_ROOT=$HOME/Library/Android/sdk
export ANDROID_AVD_HOME=$HOME/.Android/avd

# Android Studio関連2
export PATH=$PATH:$HOME/Library/Android/sdk/platform-tools
export PATH=$PATH:$HOME/Library/Android/sdk
export PATH=$PATH:$HOME/Library/Android/sdk/cmdline-tools/latest/bin

# Android Studio関連3（コマンドラインツールを入れた場合のみ必要）
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Firebase関連
export FIRESTORE_EMULATOR_HOST=localhost:8080
export GCLOUD_PROJECT=demo-emulator-project
```
## ■ bundler（Ruby周り）
以下、全てプロジェクトのルートディレクトリで実行

### 1. まずリストしてbundlerからgemの個別削除
```sh
bundle exec gem list

bundle exec gem uninstall cocoapods
bundle exec gem uninstall fastlane

rvenv rehash
```

### 2. bundlerへgemの個別（再）インストール（これは後述のbundler installで行うため不要）
```sh
bundle exec gem install cocoapods
bundle exec gem install fastlane

rvenv rehash
```

### 3. gemのバージョン確認
```sh
bundle exec pod --version
> 1.11.3

bundle exec fastlane --version
> fastlane 2.209.0
```

### 4. bundlerの削除
```sh
rbenv exec gem uninstall bundler
rvenv rehash
```

### 5. bundlerの（再）インストール
```sh
rbenv exec gem install bundler
rvenv rehash
```

### 6. bundlerのバージョン確認
```sh
bundler --version
> Bundler version 2.3.22
```

### 7. gemを一括でbundlerへ（（再）インストール
```sh
bundle install --path vender/bundler
 rbenv rehash
 ```

## ■ rbenvとruby / gem（Ruby周り）
### 1. rubyの一覧、バージョン選択、削除、（再）インストール
```sh
rbenv versions

rbenv global system（systemのrubyに切り替え）
rbenv local（rubyをlocalに切り替え）

rbenv uninstall xx.xx.xx
rbenv install xx.xx.xx
```

### 2. rbenvとruby / gemのバージョン確認
```sh
rbenv --version
> 3.1.2 

rbenv exec ruby -v
> ruby 3.1.2p20

rbenv exec gem -v
> 3.3.7
```

### 3. Ruby周りのコマンド確認
```sh
# $HOMEはユーザのホームディレクトリ
which gem
> $HOME/.rbenv/shims/gem
which pod
> $HOME/.rbenv/shims/pod
which fastlane
> $HOME/.rbenv/shims/fastlane
```

## ■ node.jsとnodebrew

### 1. まずリストしてnodebrewからnode.jsの特定バージョンを個別削除
```sh
nodebrew list
nodebrew uninstall v**.**.*
```

### 2. まずリストしてnode.jsの特定バージョンを（再）インストール
```sh
nodebrew ls-remote
nodebrew install v**.**.*
```

### 3. まずリストしてnode.jsのバージョンを切り替え
```sh
nodebrew list
nodebrew use v**.**.*
```

### 4. node.jsのバージョン確認
```sh
node -v
> v16.15.0

npm -v
> 8.5.5
```

### 5. nodebrew自体の削除

```sh
brew uninstall nodebrew
```

### 6. nodebrewの（再）インストール

```sh
brew install nodebrew
```

### 7. nodebrewにパスを通す
```sh
# 上記の.bash_profileのPATH設定を参考に設定保存して下記実行
source ~/.bash_profile
```

### 8. nodebrewのバージョン確認
```sh
nodebrew --version
> nodebrew 1.0.1
```

### ■ yarnの削除と（再）インストール
```sh
npm unstall -g yarn
npm install -g yarn
```

### ■ node_modules（package.json）
パッケージ構成やバージョンが起因していると思われる問題が発生した場合
1. まず後述するexpo doctorを試す
2. それでも解消されない場合はnode_modulesディレクトリを丸ごと削除、さらにはyarn.lockファイルを削除してyarn installを試す
3. プロジェクトのルートディレクトリにpackage-lock.jsonファイルがある場合には、これを削除する（yarn.lockファイルとの共存は問題を引き起こす可能性あり）

## ■ expo周り

### 1. JDKインストール
- AndroidStudioでも必要なので、入っていなければJDK 11以上をインストール
- OpenJDKは様々なものがあるが、分からない場合はOracle謹製で（事前にOracle Developerアカウント作成が必要、無料）

### 2. 実機にExpo Clientをインストール
- AppleのApp StoreからiPhoneへインストール
- Androidの場合はGoogle PlayからAndroid端末へインストール

### 3. expo-cliの削除と（再）インスロール
```sh
npm uninstall -g expo-cli
npm install -g expo-cli
```

### 4. expo-cliのバージョン確認
```sh
expo-cli --version
> 6.0.5
```
### 5. eas-cliの削除と（再）インスロール
```sh
npm uninstall -g eas-cli
npm install -g eas-cli
```

### 6. eeas-cliのバージョン確認
```sh
eas --version
> eas-cli/2.1.0
```

### 7. expo doctor
- パッケージ互換でビルドエラーが発生した場合は、まずその解消を助けてくれる以下のコマンドを試す
```sh
expo doctor --fix-deppendincies
```

### 8. expo install / uninstall
- expo installコマンドは、Expoとの互換性チェックをした上でパッケージをインストールしてくれるため、yarn addよりもexpo installの使用を推奨
```sh
expo install パッケージ名＠バージョン
```

## ■ XCode
1. XCodeが最新であることを確認
2. XCodeのPreferenceを開き、Accountsタブで自分のApple IDが設定され、かつTeamにも自分が追加されていることを確認する
3. XCodeのPreferenceを開き、LocationsタブでCommand Line Toolsをインストール
4. expo runやprebuildする人は以下も確認（＊開発ビルドでは基本不要、トラブった時や端末向けビルドの時くらい）
- XCodeでプロジェクトのiosディレクトリにある*****.xcodeprojを開き、Signing & Capabilities > Signing(Debug)にあるTeamを選択する（iosディレクトリがなければしなくて良い）
- expo runやprebuildコマンドはiosとandroidディレクトリを生成してネイティブコードが出力されるが、通常これらコマンドが必要になることはない
5. ビルド時に以下のエラーに遭遇した場合にのみ、4項を試す価値あり
- error Failed to build iOS project. We ran "xcodebuild" command but it exited with error code 65.

## ■ Android Studio
- Android Studioは最新版に保つ
- Android SDKは、22から最新のAPIレベルまで全てインストールする
- Preference / System Settings / Android SDK
- 以下の対処をする前に、`yarn build:local`を実行してみる。問題が発生したら以下の対処を試す

#### 1. Android StudioのPATHを通す
```sh
# 上記の.bash_profileのPATH設定を参考に設定保存して下記実行
source ~/.bash_profile
```

#### 2. local.propertiesを追加
- 「1. Android StudioのPATHを通す」でエラーが出なければ以下は不要
- `./android`に`local.properties`を作成
- Android Studioで`./android`をプロジェクトとして開く
- `local.properties`内に自動でコードが書き込まれたら完了

## ■ homebrewで入れたものを削除
まずlistして確認し、個別に削除

```homebrewで入れたものを削除
brew list
brew uninstall ********
```
## ■ homebrew自体を削除（これはやらないと思うが）

```homebrewアンインストール
ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/uninstall)"
```

## ■ homebrewをインストール

```homebrewインストール
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

## ■ homebrewにパスを通す（M1 Macでは/optにhomebrewを導入）

インストール後、画面指示に従って以下を実行することでPATHが通る
```homebrewのパスを通す
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> /Users/ユーザー名/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

sourceコマンドで反映したらバージョン確認
```sh
source ~/.bash_profile
brew —v
> Homebrew 3.5.10-30-gcce5de3
```

M1 Macでは/optのhomebrewであることを確認
```sh
which homebrew
> /opt/homebrew/bin/brew
```

## ■ M1 Macユーザ向け

### 開発ビルドでPod系のエラーが発生する場合
- 以下のコマンド実行を試す（大抵はこれで解消）
```sh
pod repo update
```
このコマンド実行により、以下の通りPodfile.lockにx86に加えてarmのエントリが入る
```json
PLATFORMS
  arm64-darwin-21
  x86_64-darwin-21
```

- それでも解消しない場合は以下のコマンド実行を試す
```sh
pod install --repo-update
```

### Intel MacからM1 Macへの移行
- これは思いのほかイージーで、移行アシスタントがほとんどのことをしてくれる
- 移行アシスタントでの移行後、IntelアプリはRosetta起動にする
- TerminalはRosetta起動にしなくても良いが、コマンドによっては以下のプリフィックスを付けて実行必要なものもある可能性あり
```sh
arch -x86_64 コマンド名
```
