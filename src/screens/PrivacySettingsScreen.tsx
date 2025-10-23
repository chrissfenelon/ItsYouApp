import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ImageBackground,
  TouchableOpacity,
  Switch,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Foundation from 'react-native-vector-icons/Foundation';
import { useApp } from '../context/AppContext';
import { getBackgroundSource } from '../utils/backgroundUtils';
import CustomAlert from '../components/common/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';

export const PrivacySettingsScreen: React.FC = () => {
  const { user, navigateToScreen, currentTheme } = useApp();
  const { alertConfig, isVisible, showAlert, hideAlert } = useCustomAlert();

  // Privacy settings state - simplified
  const [dataSharingPartner, setDataSharingPartner] = useState(true);
  const [cloudSyncEnabled, setCloudSyncEnabled] = useState(true);

  const handlePrivacyPolicy = () => {
    showAlert({
      title: 'M gen yon sel kesyon',
      message: 'Bon tale, sa w vin fe la menm?😂',
      buttons: [{ text: 'Klike la pou w kite la pou mwen' }],
      type: 'info',
    });
  };

  const privacySettings = [
    {
      section: 'Partage et synchronisation',
      items: [
        {
          icon: 'heart',
          title: 'Synchronisation avec votre partenaire',
          subtitle: 'Partager certaines données avec votre partenaire',
          type: 'switch',
          value: dataSharingPartner,
          onPress: () => setDataSharingPartner(!dataSharingPartner),
        },
        {
          icon: 'cloud',
          title: 'Sauvegarde cloud',
          subtitle: 'Synchroniser vos données dans le cloud',
          type: 'switch',
          value: cloudSyncEnabled,
          onPress: () => setCloudSyncEnabled(!cloudSyncEnabled),
        },
      ]
    },
    {
      section: 'Informations',
      items: [
        {
          icon: 'page-export-doc',
          title: 'Politique de confidentialité',
          subtitle: 'Consulter notre politique de confidentialité',
          type: 'navigate',
          onPress: handlePrivacyPolicy,
        },
      ]
    },
  ];

  const renderSettingItem = (item: any, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.settingItem}
      onPress={item.onPress}
      activeOpacity={0.8}
    >
      <View style={styles.glassCard}>
        <View style={[styles.gradientOverlay, {
          backgroundColor: `${currentTheme.romantic.primary}08`
        }]} />

        <View style={styles.settingContent}>
          <View style={styles.settingLeft}>
            <View style={[styles.iconContainer, {
              backgroundColor: `${currentTheme.romantic.primary}25`
            }]}>
              <Foundation name={item.icon} size={22} color={currentTheme.romantic.primary} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.settingTitle}>{item.title}</Text>
              <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
            </View>
          </View>
          <View style={styles.settingRight}>
            {item.type === 'switch' ? (
              <Switch
                value={item.value}
                onValueChange={item.onPress}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: currentTheme.romantic.primary }}
                thumbColor="#FFFFFF"
              />
            ) : (
              <Foundation name="arrow-right" size={20} color="rgba(255,255,255,0.5)" />
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ImageBackground
        source={getBackgroundSource(user)}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.adaptiveOverlay}>
            <ScrollView
              style={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity
                  style={[styles.backButton, {
                    backgroundColor: `${currentTheme.romantic.primary}30`,
                    borderColor: `${currentTheme.romantic.primary}50`,
                  }]}
                  onPress={() => navigateToScreen('settings')}
                  activeOpacity={0.8}
                >
                  <Foundation name="arrow-left" size={22} color={currentTheme.romantic.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Confidentialité</Text>
                <View style={styles.placeholder} />
              </View>

              {/* Privacy Info Card */}
              <View style={styles.infoSection}>
                <View style={styles.glassCard}>
                  <View style={[styles.gradientOverlay, {
                    backgroundColor: `${currentTheme.romantic.secondary}12`
                  }]} />

                  <View style={styles.infoContent}>
                    <View style={[styles.iconCircle, {
                      backgroundColor: `${currentTheme.romantic.secondary}25`
                    }]}>
                      <Foundation name="shield" size={32} color={currentTheme.romantic.secondary} />
                    </View>
                    <Text style={styles.infoTitle}>Vi prive w konte pou mwen</Text>
                    <Text style={styles.infoText}>
                      Se sa'k fe m pran tan pou m fe en sorte que tout sa n pataje isi a, rete ant nou selman. Tout done yo kripte Monnamou.
                    </Text>
                  </View>
                </View>
              </View>

              {/* Settings Sections */}
              <View style={styles.settingsContainer}>
                {privacySettings.map((section, sectionIndex) => (
                  <View key={sectionIndex} style={styles.settingsSection}>
                    <Text style={[styles.sectionTitle, {
                      textShadowColor: `${currentTheme.romantic.primary}60`,
                    }]}>{section.section}</Text>
                    {section.items.map((item, itemIndex) =>
                      renderSettingItem(item, itemIndex)
                    )}
                  </View>
                ))}
              </View>

              <View style={styles.bottomSpacer} />
            </ScrollView>
          </View>
        </SafeAreaView>
      </ImageBackground>

      {alertConfig && (
        <CustomAlert
          visible={isVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          onClose={hideAlert}
          theme={currentTheme}
          type={alertConfig.type}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundImage: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  adaptiveOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  title: {
    fontSize: 28,
    fontWeight: '300',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  placeholder: {
    width: 44,
  },
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  glassCard: {
    position: 'relative',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.5,
  },
  infoContent: {
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  infoText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: 0.3,
  },
  settingsContainer: {
    paddingHorizontal: 20,
  },
  settingsSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 10,
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 2,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    opacity: 0.9,
  },
  settingItem: {
    marginBottom: 12,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  settingSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  settingRight: {
    marginLeft: 12,
  },
  bottomSpacer: {
    height: 100,
  },
});

export default PrivacySettingsScreen;
