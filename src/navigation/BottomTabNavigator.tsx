import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Foundation from 'react-native-vector-icons/Foundation';
import { BlurView } from '@react-native-community/blur';
import ErrorBoundary from '../components/common/ErrorBoundary';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import GalleryScreen from '../screens/GalleryScreen';
import NotesScreen from '../screens/NotesScreen';
import MusicScreen from '../screens/MusicScreen';
import GamesScreen from '../screens/GamesScreen';
import AdminMessagesScreen from '../screens/AdminMessagesScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

// Placeholder screens for tabs without implemented screens
const PlaceholderScreen = ({ route }: any) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '0' }}>
    <Text style={{ color: '#fff', fontSize: 18 }}>{route.name} - Coming Soon</Text>
  </View>
);

const BottomTabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      id="BottomTabs"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'home':
              iconName = 'home';
              break;
            case 'gallery':
              iconName = 'photo';
              break;
            case 'notes':
              iconName = 'page-edit';
              break;
            case 'music':
              iconName = 'music';
              break;
            case 'games':
              iconName = 'social-game-center';
              break;
            case 'admin':
              iconName = 'shield';
              break;
            case 'settings':
              iconName = 'widget';
              break;
            default:
              iconName = 'home';
          }

          return (
            <View style={focused ? styles.iconGlow : undefined}>
              <Foundation name={iconName} size={size} color={color} />
            </View>
          );
        },
        tabBarActiveTintColor: '#FF69B4',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.5)',
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          height: 65 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom,
        },
        tabBarBackground: () => (
          <View style={styles.tabBarBackgroundContainer}>
            {Platform.OS === 'ios' ? (
              <BlurView
                style={styles.blurView}
                blurType="dark"
                blurAmount={1}
                reducedTransparencyFallbackColor="rgba(0)"
              />
            ) : (
              <BlurView
                style={styles.blurView}
                blurType="dark"
                blurAmount={1}
                reducedTransparencyFallbackColor="rgba(0)"
              />
            )}
            <View style={styles.glassOverlay} />
          </View>
        ),
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
          marginBottom: 2,
        },
      })}
    >
      <Tab.Screen
        name="home"
        options={{ tabBarLabel: 'Accueil' }}
      >
        {() => (
          <ErrorBoundary context="Home Screen">
            <HomeScreen />
          </ErrorBoundary>
        )}
      </Tab.Screen>
      <Tab.Screen
        name="gallery"
        options={{ tabBarLabel: 'Photos' }}
      >
        {() => (
          <ErrorBoundary context="Gallery Screen">
            <GalleryScreen />
          </ErrorBoundary>
        )}
      </Tab.Screen>
      <Tab.Screen
        name="notes"
        options={{ tabBarLabel: 'Notes' }}
      >
        {() => (
          <ErrorBoundary context="Notes Screen">
            <NotesScreen />
          </ErrorBoundary>
        )}
      </Tab.Screen>
      <Tab.Screen
        name="music"
        options={{ tabBarLabel: 'Musique' }}
      >
        {() => (
          <ErrorBoundary context="Music Screen">
            <MusicScreen />
          </ErrorBoundary>
        )}
      </Tab.Screen>
      <Tab.Screen
        name="games"
        options={{ tabBarLabel: 'Jeux' }}
      >
        {() => (
          <ErrorBoundary context="Games Screen">
            <GamesScreen />
          </ErrorBoundary>
        )}
      </Tab.Screen>
      <Tab.Screen
        name="admin"
        options={{ tabBarLabel: 'Admin' }}
      >
        {() => (
          <ErrorBoundary context="Admin Messages Screen">
            <AdminMessagesScreen />
          </ErrorBoundary>
        )}
      </Tab.Screen>
      <Tab.Screen
        name="settings"
        options={{ tabBarLabel: 'Paramètres' }}
      >
        {() => (
          <ErrorBoundary context="Settings Screen">
            <SettingsScreen />
          </ErrorBoundary>
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarBackgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  blurView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  glassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0)',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0)',
  },
  iconGlow: {
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default BottomTabNavigator;
