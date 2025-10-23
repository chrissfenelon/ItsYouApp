import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import Foundation from 'react-native-vector-icons/Foundation';

interface NetworkStatusIndicatorProps {
  theme: any;
}

const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({ theme }) => {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [showIndicator, setShowIndicator] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected && state.isInternetReachable;

      // Only show indicator when status changes
      if (isConnected !== null && connected !== isConnected) {
        setIsConnected(connected);
        setShowIndicator(true);

        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();

        // Auto-hide after 3 seconds
        setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            setShowIndicator(false);
          });
        }, 3000);
      } else if (isConnected === null) {
        // First time, just set the state without showing indicator
        setIsConnected(connected);
      }
    });

    return () => unsubscribe();
  }, [isConnected]);

  if (!showIndicator) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: isConnected
            ? 'rgba(34, 197, 94, 0.95)'
            : 'rgba(239, 68, 68, 0.95)',
          opacity: fadeAnim,
        },
      ]}
    >
      <Foundation
        name={isConnected ? 'check' : 'x'}
        size={16}
        color="#FFFFFF"
      />
      <Text style={styles.text}>
        {isConnected ? 'En ligne' : 'Hors ligne'}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default NetworkStatusIndicator;
