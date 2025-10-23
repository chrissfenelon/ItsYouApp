import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { DominoTile } from '../../types/dominos.types';

interface DominoTileProps {
  tile: DominoTile;
  onPress?: () => void;
  selected?: boolean;
  disabled?: boolean;
  showBack?: boolean;
  isPlayable?: boolean;
  onDragStart?: () => void;
  onDragEnd?: (dropZone: 'left' | 'right' | 'pass' | null) => void;
  enableDrag?: boolean;
}

export const DominoTileComponent: React.FC<DominoTileProps> = ({
  tile,
  onPress,
  selected = false,
  disabled = false,
  showBack = false,
  isPlayable = false,
  onDragStart,
  onDragEnd,
  enableDrag = false,
}) => {
  const [translateX] = useState(new Animated.Value(0));
  const [translateY] = useState(new Animated.Value(0));
  const [isDragging, setIsDragging] = useState(false);

  const onGestureEvent = Animated.event(
    [
      {
        nativeEvent: {
          translationX: translateX,
          translationY: translateY,
        },
      },
    ],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = ({ nativeEvent }: any) => {
    if (nativeEvent.state === State.BEGAN) {
      setIsDragging(true);
      onDragStart?.();
    } else if (nativeEvent.state === State.END || nativeEvent.state === State.CANCELLED) {
      setIsDragging(false);

      // Determine drop zone based on final position
      const { translationX: x, translationY: y } = nativeEvent;
      let dropZone: 'left' | 'right' | 'pass' | null = null;

      // Board is in center, so if dragged up significantly, it's a play
      if (y < -100) {
        // Dragged upward to board area
        if (x < -50) {
          dropZone = 'left';
        } else if (x > 50) {
          dropZone = 'right';
        }
      } else if (y < -50) {
        // Small upward drag could be pass
        dropZone = 'pass';
      }

      onDragEnd?.(dropZone);

      // Reset position
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  };

  const renderDots = (value: number) => {
    const dots = [];
    const positions = getDotPositions(value);

    positions.forEach((pos, index) => {
      dots.push(
        <View
          key={index}
          style={[
            styles.dot,
            { top: pos.top, left: pos.left, right: pos.right, bottom: pos.bottom },
          ]}
        />
      );
    });

    return dots;
  };

  // If showing back of tile (opponent's hand)
  if (showBack) {
    return (
      <View style={[styles.container, styles.back]}>
        <Text style={styles.backText}>🎴</Text>
      </View>
    );
  }

  const tileContent = (
    <View
      style={[
        styles.container,
        selected && styles.selected,
        disabled && styles.disabled,
        isPlayable && styles.playable,
        isDragging && styles.dragging,
      ]}
    >
      <View style={styles.half}>
        {renderDots(tile.left)}
      </View>
      <View style={styles.divider} />
      <View style={styles.half}>
        {renderDots(tile.right)}
      </View>
    </View>
  );

  // If drag is enabled and tile is playable
  if (enableDrag && isPlayable && !disabled) {
    return (
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
      >
        <Animated.View
          style={{
            transform: [{ translateX }, { translateY }],
          }}
        >
          {tileContent}
        </Animated.View>
      </PanGestureHandler>
    );
  }

  // Regular touchable tile (fallback)
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || !onPress}
      activeOpacity={0.7}
    >
      {tileContent}
    </TouchableOpacity>
  );
};

function getDotPositions(value: number) {
  const positions = [];

  switch (value) {
    case 1:
      positions.push({ top: '40%', left: '40%' });
      break;
    case 2:
      positions.push({ top: '20%', left: '20%' });
      positions.push({ bottom: '20%', right: '20%' });
      break;
    case 3:
      positions.push({ top: '20%', left: '20%' });
      positions.push({ top: '40%', left: '40%' });
      positions.push({ bottom: '20%', right: '20%' });
      break;
    case 4:
      positions.push({ top: '20%', left: '20%' });
      positions.push({ top: '20%', right: '20%' });
      positions.push({ bottom: '20%', left: '20%' });
      positions.push({ bottom: '20%', right: '20%' });
      break;
    case 5:
      positions.push({ top: '20%', left: '20%' });
      positions.push({ top: '20%', right: '20%' });
      positions.push({ top: '40%', left: '40%' });
      positions.push({ bottom: '20%', left: '20%' });
      positions.push({ bottom: '20%', right: '20%' });
      break;
    case 6:
      positions.push({ top: '15%', left: '20%' });
      positions.push({ top: '15%', right: '20%' });
      positions.push({ top: '42%', left: '20%' });
      positions.push({ top: '42%', right: '20%' });
      positions.push({ bottom: '15%', left: '20%' });
      positions.push({ bottom: '15%', right: '20%' });
      break;
  }

  return positions;
}

const styles = StyleSheet.create({
  container: {
    width: 50,
    height: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#000000',
    overflow: 'hidden',
  },
  selected: {
    borderColor: '#FF69B4',
    borderWidth: 3,
  },
  disabled: {
    opacity: 0.5,
  },
  playable: {
    borderColor: '#4CAF50',
    borderWidth: 2,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  back: {
    backgroundColor: '#8B4513',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 32,
  },
  dragging: {
    opacity: 0.8,
    transform: [{ scale: 1.1 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  half: {
    flex: 1,
    position: 'relative',
  },
  divider: {
    height: 2,
    backgroundColor: '#000000',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#000000',
    position: 'absolute',
  },
});
