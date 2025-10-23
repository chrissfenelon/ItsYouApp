import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WORD_SEARCH_COLORS } from '../../../data/constants/colors';

interface GameTimerProps {
  timeElapsed: number;
  timeLimit?: number;
  isPaused?: boolean;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const GameTimer: React.FC<GameTimerProps> = ({ timeElapsed, timeLimit, isPaused = false }) => {
  const [displayTime, setDisplayTime] = useState(timeElapsed);

  useEffect(() => {
    setDisplayTime(timeElapsed);
  }, [timeElapsed]);

  const timeRemaining = timeLimit ? Math.max(0, timeLimit - displayTime) : null;
  const isLowTime = timeRemaining !== null && timeRemaining < 30;
  const isVeryLowTime = timeRemaining !== null && timeRemaining < 10;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {timeLimit ? 'Temps Restant' : 'Temps'}
      </Text>
      <Text
        style={[
          styles.time,
          isLowTime && styles.timeLow,
          isVeryLowTime && styles.timeVeryLow,
          isPaused && styles.timePaused,
        ]}
      >
        {timeLimit ? formatTime(timeRemaining!) : formatTime(displayTime)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: WORD_SEARCH_COLORS.headerBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  label: {
    fontSize: 12,
    color: WORD_SEARCH_COLORS.textSecondary,
    marginBottom: 4,
  },
  time: {
    fontSize: 24,
    fontWeight: 'bold',
    color: WORD_SEARCH_COLORS.textPrimary,
  },
  timeLow: {
    color: WORD_SEARCH_COLORS.warning,
  },
  timeVeryLow: {
    color: WORD_SEARCH_COLORS.error,
  },
  timePaused: {
    opacity: 0.5,
  },
});

export default GameTimer;
