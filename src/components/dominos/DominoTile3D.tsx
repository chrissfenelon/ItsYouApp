import React, { useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { DominoTile } from '../../types/dominos.types';

interface DominoTile3DProps {
  tile: DominoTile;
  showBack?: boolean;
  isPlayable?: boolean;
  isDraggable?: boolean;
  onDragStart?: () => void;
  onDragEnd?: (dropZone: 'left' | 'right' | 'pass' | null) => void;
  size?: 'small' | 'normal' | 'large';
  isHorizontal?: boolean;
}

export const DominoTile3D: React.FC<DominoTile3DProps> = ({
  tile,
  showBack = false,
  isPlayable = false,
  isDraggable = false,
  onDragStart,
  onDragEnd,
  size = 'normal',
  isHorizontal = false,
}) => {
  const [translateX] = useState(new Animated.Value(0));
  const [translateY] = useState(new Animated.Value(0));
  const [scale] = useState(new Animated.Value(1));
  const [isDragging, setIsDragging] = useState(false);

  const sizes = {
    small: { width: 30, height: 60, dotSize: 4 },
    normal: { width: 50, height: 100, dotSize: 8 },
    large: { width: 60, height: 120, dotSize: 10 },
  };

  const { width: tileWidth, height: tileHeight, dotSize } = sizes[size];

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
    if (!isDraggable) return;

    if (nativeEvent.state === State.BEGAN) {
      setIsDragging(true);
      Animated.spring(scale, {
        toValue: 1.2,
        useNativeDriver: true,
      }).start();
      onDragStart?.();
    } else if (nativeEvent.state === State.END || nativeEvent.state === State.CANCELLED) {
      setIsDragging(false);

      // Determine drop zone based on final position
      const { translationX: x, translationY: y } = nativeEvent;
      let dropZone: 'left' | 'right' | 'pass' | null = null;

      // Dragged upward to table area (negative Y)
      if (y < -80) {
        if (x < -100) {
          dropZone = 'left';
        } else if (x > 100) {
          dropZone = 'right';
        }
      }

      onDragEnd?.(dropZone);

      // Reset position and scale
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const renderDots = (value: number) => {
    const positions = getDotPositions(value, tileWidth, tileHeight);

    return positions.map((pos, index) => (
      <View
        key={index}
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            top: pos.top,
            left: pos.left,
            right: pos.right,
            bottom: pos.bottom,
          },
        ]}
      />
    ));
  };

  // Back of tile (opponent's hand)
  if (showBack) {
    return (
      <View
        style={[
          styles.tileContainer,
          {
            width: tileWidth,
            height: tileHeight,
          },
          styles.tileBack,
        ]}
      >
        <Text style={styles.backIcon}>🎴</Text>
      </View>
    );
  }

  const tileContent = (
    <View
      style={[
        styles.tileContainer,
        isHorizontal && styles.tileHorizontal,
        {
          width: isHorizontal ? tileHeight : tileWidth,
          height: isHorizontal ? tileWidth : tileHeight,
        },
        isPlayable && styles.playable,
        isDragging && styles.dragging,
      ]}
    >
      {isHorizontal ? (
        <>
          {/* Left half (when horizontal) */}
          <View style={styles.tileHalfHorizontal}>{renderDots(tile.left)}</View>
          {/* Divider */}
          <View style={styles.tileDividerVertical} />
          {/* Right half (when horizontal) */}
          <View style={styles.tileHalfHorizontal}>{renderDots(tile.right)}</View>
        </>
      ) : (
        <>
          {/* Top half (when vertical) */}
          <View style={styles.tileHalf}>{renderDots(tile.left)}</View>
          {/* Divider */}
          <View style={styles.tileDivider} />
          {/* Bottom half (when vertical) */}
          <View style={styles.tileHalf}>{renderDots(tile.right)}</View>
        </>
      )}
    </View>
  );

  // If draggable, wrap in PanGestureHandler
  if (isDraggable && isPlayable) {
    return (
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
      >
        <Animated.View
          style={{
            transform: [{ translateX }, { translateY }, { scale }],
          }}
        >
          {tileContent}
        </Animated.View>
      </PanGestureHandler>
    );
  }

  return tileContent;
};

function getDotPositions(
  value: number,
  tileWidth: number,
  tileHeight: number
): Array<{
  top?: number | string;
  left?: number | string;
  right?: number | string;
  bottom?: number | string;
}> {
  const positions: any[] = [];
  const halfHeight = tileHeight / 2;

  // Percentages for positioning
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
  tileContainer: {
    backgroundColor: '#F5F5DC', // Ivoire
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#8B7355',
    overflow: 'hidden',
    // 3D Shadow effect
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
  tileHorizontal: {
    flexDirection: 'row',
  },
  tileHalf: {
    flex: 1,
    position: 'relative',
  },
  tileHalfHorizontal: {
    flex: 1,
    position: 'relative',
  },
  tileDivider: {
    height: 2,
    backgroundColor: '#000',
  },
  tileDividerVertical: {
    width: 2,
    backgroundColor: '#000',
  },
  dot: {
    backgroundColor: '#000',
    position: 'absolute',
  },
  playable: {
    borderColor: '#4CAF50',
    borderWidth: 3,
    shadowColor: '#4CAF50',
    shadowOpacity: 0.6,
  },
  dragging: {
    opacity: 0.9,
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 12,
  },
  tileBack: {
    backgroundColor: '#8B4513',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 28,
  },
});

export default DominoTile3D;
