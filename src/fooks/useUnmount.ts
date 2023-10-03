import { Dispatch, useEffect } from 'react';
import { setIsNavUpdating } from '../stores/NavigationSlice';
import { setLoading } from '../stores/UtilSlice';

/**
 * @remarks Unmount時に初期化する。
 */
export const useSafeUnmount = <T=Record<string, any>>(setState: (value: React.SetStateAction<T>) => void, initialState: T, onUnmount?: () => void) => useEffect(() => {
    return () => {
        setState(initialState)
        if (onUnmount) {
            onUnmount()
        }
    }
}, [])

/**
 * @remarks Unmount時にisNavUpdatingとisLoadingをfalseにする
 */
 export const useSafeLoadingUnmount = (dispatch: Dispatch<any>, isFocused: boolean) => useEffect(() => {
    return () => {
        if (!isFocused) {
            dispatch(setIsNavUpdating(false))
            dispatch(setLoading(false))
        }
    }
}, [isFocused])