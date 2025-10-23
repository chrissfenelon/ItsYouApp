import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import Foundation from 'react-native-vector-icons/Foundation';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
}

export const NetworkIndicator: React.FC = () => {
  const { currentTheme } = useApp();
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
  });
  const [showIndicator, setShowIndicator] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    // S'abonner aux changements de connexion
    const unsubscribe = NetInfo.addEventListener(state => {
      const newState: NetworkState = {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      };

      setNetworkState(newState);

      // Afficher l'indicateur si la connexion change
      const shouldShow =
        !newState.isConnected ||
        newState.isInternetReachable === false;

      if (shouldShow) {
        setShowIndicator(true);
        // Ne pas cacher automatiquement si pas de connexion
      } else {
        // Si reconnecté, afficher pendant 3 secondes puis cacher
        setShowIndicator(true);
        setTimeout(() => {
          setShowIndicator(false);
        }, 3000);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (showIndicator) {
      // Slide down
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      // Slide up
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showIndicator, slideAnim]);

  const getIndicatorConfig = () => {
    if (!networkState.isConnected) {
      return {
        text: 'Pas de connexion Internet',
        icon: 'wifi',
        backgroundColor: '#EF4444',
      };
    }

    if (networkState.isInternetReachable === false) {
      return {
        text: 'Connexion Internet faible',
        icon: 'alert',
        backgroundColor: '#F59E0B',
      };
    }

    return {
      text: 'Connexion rétablie',
      icon: 'check',
      backgroundColor: '#10B981',
    };
  };

  const config = getIndicatorConfig();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: config.backgroundColor,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        <Foundation name={config.icon} size={20} color="#FFFFFF" />
        <Text style={styles.text}>{config.text}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingTop: 40, // Pour le status bar
    paddingBottom: 12,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
