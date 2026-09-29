import React from 'react';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n';
import { MIN_TOUCH, type } from '../theme/tokens';

import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import FarmScreen from '../screens/FarmScreen';
import ScanScreen from '../screens/ScanScreen';
import AssistantScreen from '../screens/AssistantScreen';
import MoreScreen from '../screens/MoreScreen';
import {
  CropRecommendationScreen,
  WeatherScreen,
  IrrigationScreen,
  MarketScreen,
  MarketplaceScreen,
  ProfitabilityScreen,
  SchemesScreen,
  InsuranceScreen,
  ExpertScreen,
  SettingsScreen,
} from '../screens/MoreScreens';
import { getFarmProfile } from '../services/storage';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MoreStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MoreHome" component={MoreScreen} />
      <Stack.Screen name="CropRecommendation" component={CropRecommendationScreen} />
      <Stack.Screen name="Weather" component={WeatherScreen} />
      <Stack.Screen name="Irrigation" component={IrrigationScreen} />
      <Stack.Screen name="Market" component={MarketScreen} />
      <Stack.Screen name="Marketplace" component={MarketplaceScreen} />
      <Stack.Screen name="Profitability" component={ProfitabilityScreen} />
      <Stack.Screen name="Schemes" component={SchemesScreen} />
      <Stack.Screen name="Insurance" component={InsuranceScreen} />
      <Stack.Screen name="Expert" component={ExpertScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

function Tabs() {
  const { theme } = useTheme();
  const { t } = useI18n();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: [type.caption, { marginBottom: 6 }],
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
            Home: 'home-variant',
            Farm: 'sprout',
            Scan: 'scan-helper',
            AI: 'chat-question',
            More: 'dots-horizontal',
          };
          return (
            <MaterialCommunityIcons
              name={icons[route.name] ?? 'circle'}
              size={size ?? 24}
              color={color}
            />
          );
        },
        tabBarStyle: [
          styles.tabBar,
          { backgroundColor: theme.tabBar, borderTopColor: theme.border },
        ],
      })}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: t('nav.home'), tabBarAccessibilityLabel: t('a11y.tab_home') }}
      />
      <Tab.Screen
        name="Farm"
        component={FarmScreen}
        options={{ tabBarLabel: t('nav.farm'), tabBarAccessibilityLabel: t('a11y.tab_farm') }}
      />
      <Tab.Screen
        name="Scan"
        component={ScanScreen}
        options={{ tabBarLabel: t('nav.scan'), tabBarAccessibilityLabel: t('a11y.scan_tab') }}
      />
      <Tab.Screen
        name="AI"
        component={AssistantScreen}
        options={{ tabBarLabel: t('nav.ai'), tabBarAccessibilityLabel: t('a11y.tab_ai') }}
      />
      <Tab.Screen
        name="More"
        component={MoreStack}
        options={{ tabBarLabel: t('nav.more'), tabBarAccessibilityLabel: t('a11y.tab_more') }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const [ready, setReady] = React.useState(false);
  const [onboarded, setOnboarded] = React.useState(false);

  React.useEffect(() => {
    getFarmProfile().then((p) => {
      setOnboarded(!!p?.onboarded);
      setReady(true);
    });
  }, []);

  if (!ready) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!onboarded ? (
          <Stack.Screen name="Onboarding">
            {() => <OnboardingScreen onDone={() => setOnboarded(true)} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Tabs" component={Tabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    minHeight: MIN_TOUCH + 16,
    paddingTop: 8,
    borderTopWidth: 1,
  },
});
