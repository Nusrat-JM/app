import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import theme from "../lib/theme";
import { useLang } from "../hooks/useLang";

// Tab pages
import PersonalInfoScreen from "./profile/PersonalInfoScreen";
import SecurityScreen from "./profile/SecurityScreen";
import AccountScreen from "./profile/AccountScreen";
import PreferencesScreen from "./profile/PreferencesScreen"; // ✅ added

// Edit pages
import LanguageScreen from "./profile/LanguageScreen";
import EditNameScreen from "./profile/EditNameScreen";
import EditEmailScreen from "./profile/EditEmailScreen";
import EditPhoneScreen from "./profile/EditPhoneScreen";
import Favoritescreen from "./profile/FavoritesScreen";

const Tab = createMaterialTopTabNavigator();
const Stack = createNativeStackNavigator();

/** Top-tabs component; receives initialTab as a prop */
function ProfileTabs({ initialTab }) {
  const { t } = useLang();
  return (
    <Tab.Navigator
      initialRouteName={initialTab}
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarIndicatorStyle: { backgroundColor: theme.colors.primary, height: 3, borderRadius: 2 },
        tabBarStyle: { backgroundColor: theme.colors.surface, elevation: 0, shadowOpacity: 0 },
        tabBarLabelStyle: { fontWeight: "700", textTransform: "none" },
      }}
    >
      <Tab.Screen name="Personal" component={PersonalInfoScreen} options={{ title: t("personalInfo") }} />
      <Tab.Screen name="Security" component={SecurityScreen} options={{ title: t("security") }} />
      <Tab.Screen name="Account" component={AccountScreen} options={{ title: t("account") }} />
      {/* ✅ New tab */}
      <Tab.Screen name="Preferences" component={PreferencesScreen} options={{ title: t("preferences") }} />
    </Tab.Navigator>
  );
}

/** Wrapper so we can use `component` instead of `children` (prevents the error) */
function TabsWrapper({ route }) {
  const initialTab =
    route?.params?.tab ??
    route?.params?.params?.tab ??
    route?.params?.initialTab ??
    "Personal";
  return <ProfileTabs initialTab={initialTab} />;
}

export default function ProfileHub({ route }) {
  const initialTab =
    route?.params?.tab ??
    route?.params?.params?.tab ??
    "Personal";

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Tabs"
        component={TabsWrapper}                 // ✅ use component
        options={{ headerShown: false }}
        initialParams={{ initialTab }}         // ✅ pass initial tab safely
      />
      {/* Edit / sub-pages */}
      <Stack.Screen name="Language" component={LanguageScreen} />
      <Stack.Screen name="EditName" component={EditNameScreen} />
      <Stack.Screen name="EditEmail" component={EditEmailScreen} />
      <Stack.Screen name="EditPhone" component={EditPhoneScreen} />
      <Stack.Screen name="Favorites" component={Favoritescreen} />
    </Stack.Navigator>
  );
}
