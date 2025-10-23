import { NavigationContainerRef, CommonActions } from '@react-navigation/native';
import { AppScreen } from '../types';

class NavigationService {
  private navigationRef: React.RefObject<NavigationContainerRef<any>> | null = null;
  private pendingNavigation: { screenName: AppScreen; params?: any } | null = null;

  setNavigationRef(ref: React.RefObject<NavigationContainerRef<any>>) {
    console.log('🔗 NavigationService: Setting navigation ref');
    this.navigationRef = ref;

    // Execute pending navigation if any
    if (this.pendingNavigation && this.navigationRef?.current) {
      console.log('✅ NavigationService: Executing pending navigation to:', this.pendingNavigation.screenName);
      const { screenName, params } = this.pendingNavigation;
      this.pendingNavigation = null;
      this.navigate(screenName, params);
    }
  }

  navigate(screenName: AppScreen, params?: any) {
    if (!this.navigationRef?.current) {
      console.log('⏳ NavigationService: Navigation ref not ready, queueing navigation to:', screenName);
      this.pendingNavigation = { screenName, params };

      // Wait for navigation ref to be ready
      const waitForRef = async () => {
        try {
          const ref = await this.getNavigationRef();
          if (ref && this.pendingNavigation) {
            console.log('✅ NavigationService: Navigation ref ready, executing pending navigation');
            const pending = this.pendingNavigation;
            this.pendingNavigation = null;
            this.navigate(pending.screenName, pending.params);
          }
        } catch (error) {
          console.error('❌ NavigationService: Failed to get navigation ref:', error);
        }
      };

      waitForRef();
      return;
    }

    console.log('🚀 NavigationService: Navigating to:', screenName);

    // Tab screens should navigate to 'main' with nested navigation
    const tabScreens = ['home', 'gallery', 'notes', 'music', 'games', 'settings'];

    if (tabScreens.includes(screenName)) {
      this.navigationRef.current.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{
            name: 'main',
            state: {
              routes: [{ name: screenName, params: params }],
              index: 0
            }
          }]
        })
      );
    } else {
      // Non-tab screens navigate directly
      (this.navigationRef.current as any).navigate(screenName, params);
    }
  }

  goBack() {
    if (this.navigationRef?.current?.canGoBack()) {
      this.navigationRef.current.goBack();
    }
  }

  reset(screenName: AppScreen) {
    if (this.navigationRef?.current) {
      // Simplified reset - just reset to the specified screen
      this.navigationRef.current.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: screenName }]
        })
      );
    }
  }

  getCurrentRoute() {
    if (this.navigationRef?.current) {
      return this.navigationRef.current.getCurrentRoute();
    }
    return null;
  }

  getNavigationRef(): Promise<NavigationContainerRef<any> | null> {
    return new Promise((resolve) => {
      if (this.navigationRef?.current) {
        resolve(this.navigationRef.current);
      } else {
        // Wait for navigation ref to be available
        const checkInterval = setInterval(() => {
          if (this.navigationRef?.current) {
            clearInterval(checkInterval);
            resolve(this.navigationRef.current);
          }
        }, 100);

        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve(null);
        }, 5000);
      }
    });
  }
}

export default new NavigationService();