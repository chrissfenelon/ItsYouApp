import React, { useEffect, useState, useRef } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import Foundation from 'react-native-vector-icons/Foundation';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface NetworkIndicatorProps {
  displayDuration?: number; // Duration to show in milliseconds (default: 3000ms)
}

interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
}

const NetworkIndicator: React.FC<NetworkIndicatorProps> = ({ displayDuration = 3000 }) => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: null,
    type: null,
  });
  const [slideAnim] = useState(new Animated.Value(-100));
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousStatusRef = useRef<NetworkStatus>(networkStatus);

  useEffect(() => {
    // Subscribe to network changes using NetInfo directly
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setNetworkStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      });
    });

    // Get initial state
    NetInfo.fetch().then((state: NetInfoState) => {
      setNetworkStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      });
    });

    return () => {
      unsubscribe();
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const prevStatus = previousStatusRef.current;

    // Check if connection status actually changed
    const hasChanged = prevStatus.isConnected !== networkStatus.isConnected ||
                      prevStatus.isInternetReachable !== networkStatus.isInternetReachable;

    if (hasChanged) {
      // Clear any existing timeout
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }

      // Show indicator
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Auto-hide after displayDuration
      hideTimeoutRef.current = setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, displayDuration);

      // Update previous status
      previousStatusRef.current = networkStatus;
    }
  }, [networkStatus, slideAnim, displayDuration]);

  const getStatusColor = () => {
    if (!networkStatus.isConnected) {
      return '#EF4444'; // Red
    }
    if (networkStatus.isInternetReachable === false) {
      return '#F59E0B'; // Orange
    }
    if (networkStatus.isInternetReachable === true) {
      return '#10B981'; // Green
    }
    return '#6B7280'; // Gray
  };

  const getStatusIcon = () => {
    if (!networkStatus.isConnected) {
      return 'x';
    }
    if (networkStatus.isInternetReachable === false) {
      return 'alert';
    }
    if (networkStatus.isInternetReachable === true) {
      return 'check';
    }
    return 'refresh';
  };

  const getStatusMessage = (status: NetworkStatus): string => {
    if (!status.isConnected) {
      return 'No Internet Connection';
    }
    if (status.isInternetReachable === false) {
      return 'Connected but No Internet';
    }
    if (status.isInternetReachable === true) {
      return 'Connected to Internet';
    }
    return 'Checking Connection...';
  };

  const statusColor = getStatusColor();
  const statusMessage = getStatusMessage(networkStatus);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: statusColor,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Foundation name={getStatusIcon()} size={16} color="#FFFFFF" />
      <Text style={styles.text}>{statusMessage}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
    zIndex: 9999,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default NetworkIndicator;