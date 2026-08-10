import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppDataProvider, useAppData } from './src/context/AppDataContext';
import RootNavigator from './src/navigation/RootNavigator';
import OnboardingScreen from './src/screens/OnboardingScreen';
import { useTheme } from './src/theme';

function AppShell() {
  const { loaded, onboarded, completeOnboarding } = useAppData();
  const { colors, isDark } = useTheme();

  if (!loaded) {
    return <View style={styles.loading} />;
  }

  if (!onboarded) {
    return <OnboardingScreen onDone={completeOnboarding} />;
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <RootNavigator />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AppDataProvider>
          <AppShell />
        </AppDataProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loading: {
    flex: 1,
    backgroundColor: '#000',
  },
});
