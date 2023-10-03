import React from 'react';
import { Component, PropsWithChildren, useEffect } from 'react';
  import {
    GestureResponderEvent,
    PanResponder,
    PanResponderGestureState,
    View,
    ViewProps
  } from 'react-native';

  export interface GestureRecognizerProps extends ViewProps {
    onSwipe?(gestureName: string, gestureState: PanResponderGestureState): void;
    onSwipeUp?(gestureState: PanResponderGestureState): void;
    onSwipeDown?(gestureState: PanResponderGestureState): void;
    onSwipeLeft?(gestureState: PanResponderGestureState): void;
    onSwipeRight?(gestureState: PanResponderGestureState): void;
  }

  export const swipeDirections = {
    SWIPE_UP: "SWIPE_UP",
    SWIPE_DOWN: "SWIPE_DOWN",
    SWIPE_LEFT: "SWIPE_LEFT",
    SWIPE_RIGHT: "SWIPE_RIGHT"
  };
  
  const swipeConfig = {
    velocityThreshold: 0.3,
    directionalOffsetThreshold: 80,
    gestureIsClickThreshold: 5
  };
  
  function isValidSwipe(
    velocity: number,
    velocityThreshold: number,
    directionalOffset: number,
    directionalOffsetThreshold: number
  ) {
    return (
      Math.abs(velocity) > velocityThreshold &&
      Math.abs(directionalOffset) < directionalOffsetThreshold
    );
  }
  
  const GestureRecognizer = (props: PropsWithChildren<Partial<GestureRecognizerProps>>) =>  {
    const _handleShouldSetPanResponder = (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
      return (
        evt.nativeEvent.touches.length === 1 &&
        !_gestureIsClick(gestureState)
      );
    }
  
    const _gestureIsClick = (gestureState: PanResponderGestureState) => {
      return (
        Math.abs(gestureState.dx) < swipeConfig.gestureIsClickThreshold &&
        Math.abs(gestureState.dy) < swipeConfig.gestureIsClickThreshold
      );
    }
  
    const _handlePanResponderEnd = (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
      const swipeDirection = _getSwipeDirection(gestureState);
      _triggerSwipeHandlers(swipeDirection, gestureState);
    }
  
    const _triggerSwipeHandlers = (swipeDirection: string | null, gestureState: PanResponderGestureState) => {
      const {
        onSwipe,
        onSwipeUp,
        onSwipeDown,
        onSwipeLeft,
        onSwipeRight
      } = props;
      const { SWIPE_LEFT, SWIPE_RIGHT, SWIPE_UP, SWIPE_DOWN } = swipeDirections;
      onSwipe && swipeDirection && onSwipe(swipeDirection, gestureState);
      switch (swipeDirection) {
        case SWIPE_LEFT:
          onSwipeLeft && onSwipeLeft(gestureState);
          break;
        case SWIPE_RIGHT:
          onSwipeRight && onSwipeRight(gestureState);
          break;
        case SWIPE_UP:
          onSwipeUp && onSwipeUp(gestureState);
          break;
        case SWIPE_DOWN:
          onSwipeDown && onSwipeDown(gestureState);
          break;
      }
    }
  
    const _getSwipeDirection = (gestureState: PanResponderGestureState) => {
      const { SWIPE_LEFT, SWIPE_RIGHT, SWIPE_UP, SWIPE_DOWN } = swipeDirections;
      const { dx, dy } = gestureState;
      if (_isValidHorizontalSwipe(gestureState)) {
        return dx > 0 ? SWIPE_RIGHT : SWIPE_LEFT;
      } else if (_isValidVerticalSwipe(gestureState)) {
        return dy > 0 ? SWIPE_DOWN : SWIPE_UP;
      }
      return null;
    }
  
    const _isValidHorizontalSwipe = (gestureState: PanResponderGestureState) => {
      const { vx, dy } = gestureState;
      const { velocityThreshold, directionalOffsetThreshold } = swipeConfig;
      return isValidSwipe(vx, velocityThreshold, dy, directionalOffsetThreshold);
    }
  
    const _isValidVerticalSwipe = (gestureState: PanResponderGestureState) => {
      const { vy, dx } = gestureState;
      const { velocityThreshold, directionalOffsetThreshold } = swipeConfig;
      return isValidSwipe(vy, velocityThreshold, dx, directionalOffsetThreshold);
    }
  
    const responderEnd = _handlePanResponderEnd;
    const shouldSetResponder = _handleShouldSetPanResponder;
    const _panResponder = PanResponder.create({
        onStartShouldSetPanResponder: shouldSetResponder,
        onMoveShouldSetPanResponder: shouldSetResponder,
        onPanResponderRelease: responderEnd,
        onPanResponderTerminate: responderEnd
    });
    
    return <View {...props} {..._panResponder.panHandlers} />
  }
  
  export default GestureRecognizer;