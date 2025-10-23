import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import * as Animatable from 'react-native-animatable';

interface CountdownTimerProps {
  style?: any;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ style }) => {
  const [timeElapsed, setTimeElapsed] = useState({
    years: 0,
    days: 282,
    minutes: 23,
    seconds: 55
  });

  // Animation pour le titre
  const titleOpacity = useRef(new Animated.Value(1)).current;

  // Date de début: 13 juillet 2023 14h07
  const relationshipStart = new Date('2023-07-13T14:07:00');

  // Calcul du temps écoulé
  useEffect(() => {
    const calculateTimeElapsed = () => {
      const now = new Date();
      const diff = now.getTime() - relationshipStart.getTime();

      const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
      const days = Math.floor((diff % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeElapsed({
        years,
        days,
        minutes: minutes, // Using actual minutes instead of hours
        seconds
      });
    };

    calculateTimeElapsed();
    const interval = setInterval(calculateTimeElapsed, 1000);

    return () => clearInterval(interval);
  }, []);

  // Animation du titre
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    let isMounted = true;

    const startTitleAnimation = () => {
      if (!isMounted) return;

      Animated.sequence([
        Animated.timing(titleOpacity, {
          toValue: 0.4,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (isMounted) {
          timeoutId = setTimeout(startTitleAnimation, 2000);
        }
      });
    };

    startTitleAnimation();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [titleOpacity]);

  return (
    <Animatable.View
      animation="fadeInUp"
      duration={1500}
      delay={500}
      style={[styles.container, style]}
    >
      {/* Main title */}
      <Animated.Text
        style={[styles.mainTitle, { opacity: titleOpacity }]}
      >
        Temps passés ensemble
      </Animated.Text>

      {/* Time counter */}
      <View style={styles.counterContainer}>
        <View style={styles.timeUnit}>
          <Text style={styles.timeNumber}>{timeElapsed.years}</Text>
          <Text style={styles.timeLabel}>Années</Text>
        </View>
        <View style={styles.timeUnit}>
          <Text style={styles.timeNumber}>{timeElapsed.days}</Text>
          <Text style={styles.timeLabel}>Jours</Text>
        </View>
        <View style={styles.timeUnit}>
          <Text style={styles.timeNumber}>{timeElapsed.minutes}</Text>
          <Text style={styles.timeLabel}>Minutes</Text>
        </View>
        <View style={styles.timeUnit}>
          <Text style={styles.timeNumber}>{timeElapsed.seconds}</Text>
          <Text style={styles.timeLabel}>Secondes</Text>
        </View>
      </View>
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '300',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 60,
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  counterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    width: '100%',
    paddingHorizontal: 10,
  },
  timeUnit: {
    alignItems: 'center',
    flex: 1,
  },
  timeNumber: {
    fontSize: 52,
    fontWeight: '200',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(255,105,180,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    letterSpacing: -2,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 5,
    letterSpacing: 0.5,
  },
});

export default CountdownTimer;