import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ConnectionQuality, PresenceStatus } from '../../services/PresenceService';

interface PlayerStatusIndicatorProps {
  status: PresenceStatus;
  connectionQuality: ConnectionQuality;
  ping?: number;
  size?: 'small' | 'medium' | 'large';
  showPing?: boolean;
  showLabel?: boolean;
}

const PlayerStatusIndicator: React.FC<PlayerStatusIndicatorProps> = ({
  status,
  connectionQuality,
  ping = 0,
  size = 'medium',
  showPing = true,
  showLabel = false,
}) => {
  const getStatusConfig = () => {
    if (status === 'offline' || status === 'reconnecting') {
      return {
        icon: 'wifi-off',
        color: '#F44336',
        label: status === 'reconnecting' ? 'Reconnexion...' : 'Hors ligne',
        pingText: '—',
      };
    }

    switch (connectionQuality) {
      case 'excellent':
        return {
          icon: 'wifi-strength-4',
          color: '#4CAF50',
          label: 'Excellente',
          pingText: `${ping}ms`,
        };
      case 'good':
        return {
          icon: 'wifi-strength-3',
          color: '#8BC34A',
          label: 'Bonne',
          pingText: `${ping}ms`,
        };
      case 'poor':
        return {
          icon: 'wifi-strength-2',
          color: '#FF9800',
          label: 'Faible',
          pingText: `${ping}ms`,
        };
      case 'disconnected':
        return {
          icon: 'wifi-strength-off',
          color: '#F44336',
          label: 'Déconnecté',
          pingText: '—',
        };
      default:
        return {
          icon: 'wifi-strength-off-outline',
          color: '#9E9E9E',
          label: 'Inconnue',
          pingText: '—',
        };
    }
  };

  const config = getStatusConfig();

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return {
          iconSize: 14,
          fontSize: 10,
          padding: 4,
          gap: 4,
        };
      case 'large':
        return {
          iconSize: 20,
          fontSize: 14,
          padding: 10,
          gap: 8,
        };
      case 'medium':
      default:
        return {
          iconSize: 16,
          fontSize: 12,
          padding: 6,
          gap: 6,
        };
    }
  };

  const sizeConfig = getSizeConfig();

  return (
    <View
      style={[
        styles.container,
        {
          padding: sizeConfig.padding,
          gap: sizeConfig.gap,
        },
      ]}
    >
      {/* Status Badge */}
      <View
        style={[
          styles.badge,
          {
            backgroundColor: `${config.color}20`,
            borderColor: config.color,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={config.icon}
          size={sizeConfig.iconSize}
          color={config.color}
        />
        {showPing && (
          <Text
            style={[
              styles.pingText,
              {
                color: config.color,
                fontSize: sizeConfig.fontSize,
              },
            ]}
          >
            {config.pingText}
          </Text>
        )}
      </View>

      {/* Optional Label */}
      {showLabel && (
        <Text
          style={[
            styles.label,
            {
              fontSize: sizeConfig.fontSize,
            },
          ]}
        >
          {config.label}
        </Text>
      )}

      {/* Pulsing Dot for Online Status */}
      {status === 'online' && connectionQuality !== 'disconnected' && (
        <View style={styles.pulsingDotContainer}>
          <View
            style={[
              styles.pulsingDot,
              {
                backgroundColor: config.color,
              },
            ]}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  pingText: {
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  label: {
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  pulsingDotContainer: {
    width: 8,
    height: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.8,
  },
});

export default PlayerStatusIndicator;
