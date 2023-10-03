import AsyncStorage from "@react-native-async-storage/async-storage";

const LocalStorage = {
    storeData: async (KEY: string, data: any) => {
        try {
          await AsyncStorage.setItem(KEY, JSON.stringify(data))
          return true
        } catch (e) {
          // saving error
          console.log('Storage error: ', e);
          return false
        }
      },
    getData: async (KEY: string): Promise<any> => {
        try {
          const value = await AsyncStorage.getItem(KEY)
          console.log(value);
          if(value !== null) {
              return JSON.parse(value);
            }
            else {
                return null
            }
        } catch(e) {
            console.log('Storage retrieve error: ', e);
        }
        return null;
      },
    updateArrayData: async (KEY:string, newData=[]) => {
      let newArray = [];
      try {
        const value = await AsyncStorage.getItem(KEY)
        if(value !== null) {
            newArray = JSON.parse(value);
        }
      } catch (e) {
        // saving error
        console.log('Storage error: ', e);
        return e;
      }
      newArray = newArray.concat(newData);
      try {
        AsyncStorage.setItem(KEY, JSON.stringify(newArray))
      } catch (e) {
      // saving error
        console.log('Storage error: ', e);
        return e;
      }
      return null;
    },
    updateObject: async (KEY: string, field: string, value: any) => {
      let object;
      try {
        const value = await AsyncStorage.getItem(KEY)
        if(value !== null) {
            object = JSON.parse(value);
        }
      } catch (e) {
        // saving error
        console.log('Storage error: ', e);
      }
      if(object && typeof object === 'object') 
        object[field] = value;
      AsyncStorage.setItem(KEY, JSON.stringify(object))
    },
    delete: async (KEY: string) => {
      AsyncStorage.removeItem(KEY);
    }
}

export default LocalStorage
