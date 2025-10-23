import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import GalleryScreen from '../screens/GalleryScreen';
import NotesScreen from '../screens/NotesScreen';
import MusicScreen from '../screens/MusicScreen';
import GamesScreen from '../screens/GamesScreen';

const Tab = createBottomTabNavigator();

const BottomTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      id="BottomTabs"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Gallery':
              iconName = focused ? 'images' : 'images-outline';
              break;
            case 'Notes':
              iconName = focused ? 'create' : 'create-outline';
              break;
            case 'Music':
              iconName = focused ? 'musical-notes' : 'musical-notes-outline';
              break;
            case 'Games':
              iconName = focused ? 'game-controller' : 'game-controller-outline';
              break;
            default:
              iconName = 'home-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF69B4',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          height: 90,
          paddingTop: 10,
          paddingBottom: 25,
        },
        tabBarBackground: () => (
          <View style={styles.tabBarBackground} />
        ),
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 5,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Accueil' }}
      />
      <Tab.Screen
        name="Gallery"
        component={GalleryScreen}
        options={{ tabBarLabel: 'Photos' }}
      />
      <Tab.Screen
        name="Notes"
        component={NotesScreen}
        options={{ tabBarLabel: 'Notes' }}
      />
      <Tab.Screen
        name="Music"
        component={MusicScreen}
        options={{ tabBarLabel: 'Musique' }}
      />
      <Tab.Screen
        name="Games"
        component={GamesScreen}
        options={{ tabBarLabel: 'Jeux' }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  //  backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 105, 180, 0.3)',
  },
});

export default BottomTabNavigator;