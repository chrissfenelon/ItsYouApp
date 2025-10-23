import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  PanResponder,
  Animated,
  StyleSheet,
  Dimensions,
  Vibration,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface DraggableElementProps {
  children: React.ReactNode;
  initialPosition?: { x: number; y: number };
  onPositionChange?: (position: { x: number; y: number }) => void;
  elementKey: string;
}

export const DraggableElement: React.FC<DraggableElementProps> = ({
  children,
  initialPosition = { x: 0, y: 0 },
  onPositionChange,
  elementKey,
}) => {
  const pan = useRef(new Animated.ValueXY(initialPosition)).current;
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Update position when initialPosition changes (e.g., loaded from AsyncStorage)
  useEffect(() => {
    pan.setValue(initialPosition);
  }, [initialPosition.x, initialPosition.y]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => isDraggingRef.current,
      onPanResponderGrant: () => {
        // Start long press timer
        longPressTimer.current = setTimeout(() => {
          // Haptic feedback when drag mode activates
          Vibration.vibrate(50);
          isDraggingRef.current = true;
          setIsDragging(true);
          pan.setOffset({
            // @ts-ignore
            x: pan.x._value,
            // @ts-ignore
            y: pan.y._value,
          });
          pan.setValue({ x: 0, y: 0 });
        }, 500); // 500ms long press
      },
      onPanResponderMove: (e, gestureState) => {
        // If moved before long press completes, cancel it
        if (!isDraggingRef.current && longPressTimer.current) {
          if (Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
          }
        }

        // Only move if dragging is active
        if (isDraggingRef.current) {
          pan.x.setValue(gestureState.dx);
          pan.y.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: () => {
        // Clear long press timer if still waiting
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }

        if (isDraggingRef.current) {
          pan.flattenOffset();

          // Get final position
          // @ts-ignore
          const finalX = pan.x._value;
          // @ts-ignore
          const finalY = pan.y._value;

          if (onPositionChange) {
            onPositionChange({ x: finalX, y: finalY });
          }

          // Always deselect after dragging
          isDraggingRef.current = false;
          setIsDragging(false);
        }
      },
      onPanResponderTerminationRequest: () => !isDraggingRef.current,
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: pan.getTranslateTransform(),
        },
      ]}
      {...panResponder.panHandlers}
    >
      {children}
      {/* Visual-only border overlay that appears when dragging */}
      {isDragging && (
        <View
          style={styles.borderOverlay}
          pointerEvents="none"
        />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 1, // Allow visual overlapping
  },
  borderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 3,
    borderColor: '#FF69B4',
    borderStyle: 'solid',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 105, 180, 0.1)',
    pointerEvents: 'none', // Don't interfere with touch events
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 10,
  },
});

export default DraggableElement;
