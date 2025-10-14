// App.js
import 'react-native-gesture-handler';
import 'react-native-reanimated'; 

import SeatSelectionScreen from './screens/SeatSelectionScreen';
import ShortestPathScreen from './screens/ShortestPathScreen'; 
//import TicketBookingScreen from './screens/';
import React from "react";
import { StatusBar } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";


// Auth
import { AuthProvider, useAuth } from "./hooks/useAuth";

// Core screens
import SignupScreen from "./screens/SignupScreen";
import LoginScreen from "./screens/LoginScreen";
import HomeScreen from "./screens/HomeScreen";
import PackageScreen from "./screens/PackageScreen";
import ShiftScreen from "./screens/ShiftScreen";
import ProfileScreen from "./screens/ProfileScreen";
import PaymentsScreen from "./screens/PaymentsScreen";
import DetailsScreen from "./screens/DetailsScreen";

// Ride flow
import PickRideScreen from "./screens/PickRideScreen";
import RideSummaryScreen from "./screens/RideSummaryScreen";

// Profile hub (top tabs + edit screens live inside this)
import ProfileHub from "./screens/ProfileHub";

// Language provider (app-wide i18n)
import { LangProvider } from "./hooks/useLang";


import TripPlannerScreen from './trip/TripPlannerScreen';
import TripResultsScreen from './trip/TripResultsScreen';
import TripDetailsScreen from './trip/TripDetailsScreen';
import TripWelcomeScreen from './trip/TripWelcomeScreen.js'; 
import TripIntroScreen from './trip/TripIntroScreen.js';

import EcoRewardsScreen from './screens/EcoRewardsScreen';
import VoucherScreen from './screens/VoucherScreen';


import PackageBoxesScreen from './screens/PackageBoxesScreen';
import PackageConfirmScreen from './screens/PackageConfirmScreen';
import ShipmentDetailsScreen from './screens/ShipmentDetailsScreen';
import { setAuthToken } from './lib/api';

import RideDashboardScreen from './screens/RideDashboardScreen';
import TripDashboardScreen from './screens/TripDashboardScreen';
import ShiftDashboardScreen from './screens/ShiftDashboardScreen';
import PackageDashboardScreen from './screens/PackageDashboardScreen';
import RideTrackerScreen from "./screens/RideTrackerScreen";

// ⬇️ Ticket flow screens (DEFAULT imports, no “Screen” suffix)
import TicketBooking from './screens/TicketBooking';
import TicketSearch from './screens/TicketSearch';
import TicketResults from './screens/TicketResults';
import TicketSeat from './screens/TicketSeat';
import TicketPayment from './screens/TicketPayment';
import TicketSuccess from './screens/TicketSuccess';
import TicketConfirm from './screens/TicketConfirm';
const Stack = createNativeStackNavigator();

function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="Home" component={HomeScreen} />

      {/* Ride flow */}
      <Stack.Screen
        name="PickRide"
        component={PickRideScreen}
        options={{ title: "Select Locations" }}
      />
      <Stack.Screen
        name="RideSummary"
        component={RideSummaryScreen}
        options={{ title: "Choose Vehicle" }}
      />
      <Stack.Screen
        name="ShortestPath"
        component={ShortestPathScreen}
        options={{ title: "Shortest Path" }}
      />

      {/* Services */}
      <Stack.Screen name="Package" component={PackageScreen} />
      <Stack.Screen name="Shift" component={ShiftScreen} />

      {/* Profile */}
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen
        name="ProfileHub"
        component={ProfileHub}
        options={{ title: "Profile" }}
      />

      {/* Other */}
      <Stack.Screen name="Payments" component={PaymentsScreen} />
      <Stack.Screen name="Details" component={DetailsScreen} />
    
      <Stack.Screen name="SeatSelection" component={SeatSelectionScreen} />
      <Stack.Screen name="TripPlanner" component={TripPlannerScreen} />
<Stack.Screen name="TripResults" component={TripResultsScreen} />
<Stack.Screen name="TripDetails" component={TripDetailsScreen} />
<Stack.Screen name="TripWelcome" component={TripWelcomeScreen} options={{ title: 'Trip Planner' }} />
<Stack.Screen name="TripIntro" component={TripIntroScreen} options={{ headerShown: false }} />
      
      <Stack.Screen name="Dashboard" component={require('./screens/DashboardScreen').default} />
     
<Stack.Screen name="EcoRewards" component={EcoRewardsScreen} />
<Stack.Screen name="Voucher" component={VoucherScreen} />
 
<Stack.Screen name="PackageBoxes" component={PackageBoxesScreen} />
<Stack.Screen name="PackageConfirm" component={PackageConfirmScreen} />
<Stack.Screen name="ShipmentDetails" component={ShipmentDetailsScreen} />
<Stack.Screen name="RideTracker" component={RideTrackerScreen} options={{ headerShown: true, title: "Track Ride" }} />
<Stack.Screen name="TicketBooking" component={TicketBooking} />
<Stack.Screen name="TicketSearch" component={TicketSearch} />
<Stack.Screen name="TicketResults" component={TicketResults} />
<Stack.Screen name="TicketSeat" component={TicketSeat} />
<Stack.Screen name="TicketPayment" component={TicketPayment} />
 <Stack.Screen name="TicketSuccess" component={TicketSuccess} />
 <Stack.Screen name="TicketConfirm" component={TicketConfirm} />


    </Stack.Navigator>
  );
}


function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { user } = useAuth();
  return <NavigationContainer>{user ? <MainStack /> : <AuthStack />}</NavigationContainer>;
}

export default function App() {
  return (
    <AuthProvider>
      {/* App-wide language context (i18n). Changing language re-renders all screens. */}
      <LangProvider>
        <StatusBar barStyle="dark-content" />
        <RootNavigator />
      </LangProvider>
    </AuthProvider>
  );
}
