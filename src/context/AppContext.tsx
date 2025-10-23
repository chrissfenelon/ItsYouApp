import React, { createContext, useContext, useState, ReactNode, useEffect, useRef, useMemo } from 'react';
import { TextStyle, Alert, Platform } from 'react-native';
import RNRestart from 'react-native-restart';
import { AppScreen, BottomTabScreen, User } from '../types';
import { DarkTheme, LuxuriousTheme } from '../constants/Themes';
import FirebaseAuthService from '../services/FirebaseAuthService';
import StorageService from '../services/StorageService';
import NavigationService from '../services/NavigationService';
import ProfileSyncService from '../services/ProfileSyncService';
import UserDeviceSyncService from '../services/UserDeviceSyncService';
import NotesService from '../services/NotesService';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getGlobalFontStyle, mergeWithGlobalFont } from '../utils/fontUtils';
import { updateGlobalFontCache } from '../setup/globalTextSetup';

interface AppContextType {
  currentScreen: AppScreen;
  activeTab: BottomTabScreen;
  user: User | null;
  isDarkTheme: boolean;
  currentTheme: typeof DarkTheme;
  navigateToScreen: (screen: AppScreen, params?: any) => void;
  setActiveTab: (tab: BottomTabScreen) => void;
  toggleTheme: () => void;
  loginUser: (email: string, password: string) => Promise<void>;
  logoutUser: () => void;
  createAccount: (email: string, password: string, name: string) => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  getGlobalFont: (baseSize?: number) => TextStyle;
  mergeGlobalFont: (customStyle?: TextStyle | TextStyle[], baseSize?: number) => TextStyle | TextStyle[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [currentScreen, _setCurrentScreen] = useState<AppScreen>('intro');
  const [activeTab, setActiveTab] = useState<BottomTabScreen>('home');
  const [user, setUser] = useState<User | null>(null);
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [_isLoading, setIsLoading] = useState(true);
  const [_isInitialized, setIsInitialized] = useState(false);
  const [_authReady, setAuthReady] = useState(false); // Track if Firebase Auth is ready

  const navigationRef = useRef<any>(null);
  const currentTheme = useMemo(() => {
    const theme = isDarkTheme ? DarkTheme : LuxuriousTheme;
    console.log(`🎨 Current theme computed: ${isDarkTheme ? 'Dark' : 'Luxurious'}`, theme.background.primary);
    return theme;
  }, [isDarkTheme]);

  // Initialize app with saved data
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing app...');

        // Load theme preference
        const savedTheme = await StorageService.getThemePreference();
        if (savedTheme !== null) {
          setIsDarkTheme(savedTheme);
        }

        // Check if we have valid saved user data
        const hasValidData = await StorageService.hasValidUserData();

        if (hasValidData) {
          const savedUser = await StorageService.getUserData();
          if (savedUser) {
            console.log('📱 Found saved user data:', { email: savedUser.email, id: savedUser.id });

            // IMPORTANT: Check Firebase Auth to ensure session is still valid
            const currentUser = FirebaseAuthService.getCurrentUser();

            if (currentUser && currentUser.uid === savedUser.id) {
              // Session is valid, use saved data but ensure email is up to date
              console.log('✅ Firebase Auth session valid, email:', currentUser.email);

              // ALWAYS update email from Firebase Auth if available (even if missing in saved data)
              if (currentUser.email && (!savedUser.email || currentUser.email !== savedUser.email)) {
                console.log('🔄 Updating email from Firebase Auth:', currentUser.email);
                savedUser.email = currentUser.email;
                await StorageService.saveUserData(savedUser);
              }

              setUser(savedUser);
              NavigationService.navigate('main');
              console.log('Restored user data from storage with email:', savedUser.email);
              return;
            } else {
              console.warn('⚠️ Saved user data found but Firebase Auth session invalid. Waiting for auth...');
              // Don't set user yet, wait for onAuthStateChanged
            }
          }
        }

        // For new users or users without valid data, start with sign in
        NavigationService.navigate('signIn');
        console.log('Starting with sign in screen');
      } catch (error) {
        console.error('Error initializing app:', error);
        NavigationService.navigate('intro');
      } finally {
        setIsInitialized(true);
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Listen to authentication state changes
  useEffect(() => {
    console.log('🔐 Setting up Firebase Auth listener...');
    const unsubscribe = FirebaseAuthService.onAuthStateChanged(async (firebaseUser) => {
      console.log('🔐 Auth state changed. User:', firebaseUser ? firebaseUser.email : 'null');
      setAuthReady(true); // Mark auth as ready (whether logged in or not)

      if (firebaseUser) {
        try {
          // Try to get user data from Firestore
          let userData = null;
          try {
            const userDoc = await firestore().collection('users').doc(firebaseUser.uid).get();
            userData = userDoc.data();

            // Update email in Firestore if not present or different
            if (firebaseUser.email && (!userData || userData.email !== firebaseUser.email)) {
              await firestore().collection('users').doc(firebaseUser.uid).set({
                email: firebaseUser.email,
                displayName: firebaseUser.displayName || userData?.displayName,
              }, { merge: true });
              console.log('Updated email in Firestore:', firebaseUser.email);
            }
          } catch (firestoreError) {
            console.warn('Firestore unavailable during auth state change, proceeding without user data:', firestoreError);
            // Continue without Firestore data
          }

          // IMPORTANT: Always use Firebase Auth email (it's the source of truth)
          const userEmail = firebaseUser.email || '';

          console.log('🔐 Firebase user email:', userEmail);

          if (!userEmail) {
            console.warn('⚠️ Firebase user has no email! UID:', firebaseUser.uid);
          }

          // Get existing user data to preserve settings like background
          const existingUser = await StorageService.getUserData();

          // Priority order for name: Firestore > Local Storage > Firebase Auth > Email-based default
          const userName = userData?.name ||
                          userData?.displayName ||
                          existingUser?.name ||
                          firebaseUser.displayName ||
                          (firebaseUser.email?.includes('Orlie') ? 'Orlie' : 'Toi');

          // Fetch partner's name if partnerId exists
          let partnerName = undefined;
          if (userData?.partnerId) {
            try {
              const partnerDoc = await firestore().collection('users').doc(userData.partnerId).get();
              const partnerData = partnerDoc.data();
              partnerName = partnerData?.name || partnerData?.displayName;
            } catch (error) {
              console.warn('Could not fetch partner name:', error);
            }
          }

          const userToSave = {
            id: firebaseUser.uid,
            email: userEmail, // Always use email from Firebase Auth (source of truth)
            name: userName,
            firstName: userData?.firstName || existingUser?.firstName,
            lastName: userData?.lastName || existingUser?.lastName,
            isAuthenticated: true,
            partnerId: userData?.partnerId, // Get from Firestore
            partnerName, // Partner's name
            relationshipStartDate: userData?.relationshipStartDate?.toDate(),
            // Preserve existing settings or load from Firestore
            backgroundImage: existingUser?.backgroundImage || userData?.backgroundImage,
            backgroundType: existingUser?.backgroundType || userData?.backgroundType,
            photoURL: userData?.photoURL || existingUser?.photoURL, // Prioritize Firestore for photos
            badge: userData?.badge || existingUser?.badge,
            showProfilePhoto: existingUser?.showProfilePhoto !== undefined ? existingUser.showProfilePhoto : userData?.showProfilePhoto,
            globalFontSettings: existingUser?.globalFontSettings || userData?.globalFontSettings,
          };

          console.log('💾 [onAuthStateChanged] Saving user:', {
            id: userToSave.id,
            email: userToSave.email,
            name: userToSave.name,
            emailSource: 'Firebase Auth'
          });

          // Important: Update state and AsyncStorage with fresh Firebase Auth email
          setUser(userToSave);
          await StorageService.saveUserData(userToSave);
          console.log('✅ [onAuthStateChanged] User data saved to state and AsyncStorage with email:', userToSave.email);

          // Sync device info on authentication
          try {
            await UserDeviceSyncService.syncCurrentDevice();
          } catch (syncError) {
            console.warn('Could not sync device on auth state change:', syncError);
          }

          // Sync notes from Firestore to recover user's notes
          try {
            const syncedCount = await NotesService.syncNotesFromFirestore(firebaseUser.uid);
            console.log(`Synced ${syncedCount} notes from Firestore`);
          } catch (syncError) {
            console.warn('Could not sync notes from Firestore:', syncError);
          }

          // Check if permissions have been requested
          const permissionsRequested = await AsyncStorage.getItem('@permissions_requested');
          if (permissionsRequested !== 'true') {
            NavigationService.navigate('permissions');
          } else {
            NavigationService.navigate('main');
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      } else {
        setUser(null);
        NavigationService.navigate('signIn');
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const navigateToScreen = (screen: AppScreen, params?: any) => {
    // Update active tab if navigating to a tab screen
    const tabScreens: BottomTabScreen[] = ['home', 'gallery', 'notes', 'music', 'settings'];
    if (tabScreens.includes(screen as BottomTabScreen)) {
      setActiveTab(screen as BottomTabScreen);
    }

    NavigationService.navigate(screen, params);
  };

  const toggleTheme = async () => {
    const newTheme = !isDarkTheme;
    const newThemeName = newTheme ? 'Mode sombre' : 'Mode luxueux';
    console.log(`🎨 Toggling theme from ${isDarkTheme ? 'Dark' : 'Luxurious'} to ${newTheme ? 'Dark' : 'Luxurious'}`);

    // Save theme preference
    await StorageService.saveThemePreference(newTheme);

    // Prompt user to restart app
    Alert.alert(
      'Redémarrage requis',
      `Le thème "${newThemeName}" sera appliqué au redémarrage de l'application. Voulez-vous redémarrer maintenant ?`,
      [
        {
          text: 'Plus tard',
          style: 'cancel',
          onPress: () => {
            console.log('User chose to restart later');
          }
        },
        {
          text: 'Redémarrer',
          onPress: () => {
            console.log('Restarting app to apply theme...');
            RNRestart.Restart();
          }
        }
      ],
      { cancelable: false }
    );
  };

  const loginUser = async (email: string, password: string): Promise<void> => {
    try {
      const firebaseUser = await FirebaseAuthService.signInWithEmailAndPassword(email, password);

      // Try to get user data from Firestore with retry logic
      let userData = null;
      try {
        const userDoc = await firestore().collection('users').doc(firebaseUser.uid).get();
        userData = userDoc.data();

        // Update email in Firestore if not present or different
        if (firebaseUser.email && (!userData || userData.email !== firebaseUser.email)) {
          await firestore().collection('users').doc(firebaseUser.uid).set({
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || userData?.displayName,
          }, { merge: true });
          console.log('Updated email in Firestore during login:', firebaseUser.email);
        }
      } catch (firestoreError) {
        console.warn('Firestore unavailable, proceeding without user data:', firestoreError);
        // Continue without Firestore data
      }

      // Get existing user data to preserve settings like background
      const existingUser = await StorageService.getUserData();

      // Priority order for name: Firestore > Local Storage > Firebase Auth > Email-based default
      const userName = userData?.name ||
                      userData?.displayName ||
                      existingUser?.name ||
                      firebaseUser.displayName ||
                      (email.includes('Orlie') ? 'Orlie' : 'Toi');

      // Fetch partner's name if partnerId exists
      let partnerName = undefined;
      if (userData?.partnerId) {
        try {
          const partnerDoc = await firestore().collection('users').doc(userData.partnerId).get();
          const partnerData = partnerDoc.data();
          partnerName = partnerData?.name || partnerData?.displayName;
        } catch (error) {
          console.warn('Could not fetch partner name:', error);
        }
      }

      // IMPORTANT: Always use Firebase Auth email as source of truth
      const finalEmail = firebaseUser.email || email;

      const userToSave = {
        id: firebaseUser.uid,
        email: finalEmail,
        name: userName,
        firstName: userData?.firstName || existingUser?.firstName,
        lastName: userData?.lastName || existingUser?.lastName,
        isAuthenticated: true,
        partnerId: userData?.partnerId, // Get from Firestore
        partnerName, // Partner's name
        relationshipStartDate: userData?.relationshipStartDate?.toDate(),
        // Preserve existing settings or load from Firestore
        backgroundImage: existingUser?.backgroundImage || userData?.backgroundImage,
        backgroundType: existingUser?.backgroundType || userData?.backgroundType,
        photoURL: userData?.photoURL || existingUser?.photoURL, // Prioritize Firestore for photos
        badge: userData?.badge || existingUser?.badge,
        showProfilePhoto: existingUser?.showProfilePhoto !== undefined ? existingUser.showProfilePhoto : userData?.showProfilePhoto,
        globalFontSettings: existingUser?.globalFontSettings || userData?.globalFontSettings,
      };

      console.log('💾 [loginUser] Saving user with email:', {
        id: userToSave.id,
        email: userToSave.email,
        name: userToSave.name
      });

      setUser(userToSave);
      // Save user data to local storage
      await StorageService.saveUserData(userToSave);
      console.log('✅ [loginUser] User data saved with email:', userToSave.email);

      // Check if permissions have been requested
      const permissionsRequested = await AsyncStorage.getItem('@permissions_requested');
      if (permissionsRequested !== 'true') {
        NavigationService.navigate('permissions');
      } else {
        NavigationService.navigate('main');
      }
    } catch (error) {
      throw error;
    }
  };

  const createAccount = async (email: string, password: string, name: string): Promise<void> => {
    try {
      const firebaseUser = await FirebaseAuthService.createUserWithEmailAndPassword(email, password, name);

      // Extract firstName and lastName from full name
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const userToSave = {
        id: firebaseUser.uid,
        email: firebaseUser.email || email,
        name: name,
        firstName,
        lastName,
        isAuthenticated: true,
        relationshipStartDate: new Date('2025-07-13'),
        // No partnerId on creation - user will link later
      };

      // Initialize profile across all games
      try {
        await ProfileSyncService.initializeUserProfile(
          firebaseUser.uid,
          firstName,
          lastName,
          email
        );
      } catch (profileError) {
        console.warn('Could not initialize profile across games:', profileError);
      }

      setUser(userToSave);
      // Save user data to local storage
      await StorageService.saveUserData(userToSave);

      // Check if permissions have been requested for new accounts
      const permissionsRequested = await AsyncStorage.getItem('@permissions_requested');
      if (permissionsRequested !== 'true') {
        NavigationService.navigate('permissions');
      } else {
        NavigationService.navigate('main');
      }
    } catch (error) {
      throw error;
    }
  };

  const logoutUser = async () => {
    try {
      await FirebaseAuthService.signOut();
      // Clear saved user data
      await StorageService.clearUserData();
      setUser(null);
      NavigationService.navigate('signIn');
      setActiveTab('home');
      console.log('User logged out and data cleared');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);

      // If global font settings are being updated, update the global cache
      if (updates.globalFontSettings) {
        console.log('🔤 Updating global font cache with new settings:', updates.globalFontSettings);
        updateGlobalFontCache(updates.globalFontSettings);
      }

      // Save to local storage
      try {
        await StorageService.saveUserData(updatedUser);
        console.log('✅ User profile saved to local storage:', updates);

        // Also save to Firestore for persistence across devices
        try {
          // Prepare updates for Firestore (include all important fields)
          const firestoreUpdates: any = {
            ...updates,
            lastUpdated: firestore.FieldValue.serverTimestamp(),
          };

          // If name is being updated, also update displayName
          if (updates.name) {
            firestoreUpdates.displayName = updates.name;
          }

          await firestore().collection('users').doc(user.id).set(firestoreUpdates, { merge: true });
          console.log('✅ User profile updated in Firestore:', firestoreUpdates);
        } catch (firestoreError) {
          console.warn('⚠️ Could not save to Firestore, saved locally only:', firestoreError);
        }
      } catch (error) {
        console.error('❌ Error saving user profile updates:', error);
      }
    }
  };

  // Font utility functions that use current user's font settings
  const getGlobalFont = (baseSize?: number): TextStyle => {
    return getGlobalFontStyle(user?.globalFontSettings, baseSize);
  };

  const mergeGlobalFont = (customStyle?: TextStyle | TextStyle[], baseSize?: number): TextStyle | TextStyle[] => {
    return mergeWithGlobalFont(user?.globalFontSettings, customStyle, baseSize);
  };

  const value: AppContextType = {
    currentScreen,
    activeTab,
    user,
    isDarkTheme,
    currentTheme,
    navigateToScreen,
    setActiveTab,
    toggleTheme,
    loginUser,
    logoutUser,
    createAccount,
    updateUserProfile,
    getGlobalFont,
    mergeGlobalFont,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp doit être utilisé dans un AppProvider');
  }
  return context;
};

export default AppContext;