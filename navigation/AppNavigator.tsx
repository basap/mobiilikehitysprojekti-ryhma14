import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthProvider, useAuth } from "../contexts/AuthContext";

import LoginScreen from "../features/auth/LoginScreen";
import HomeScreen from "../features/home/HomeScreen";
import StatsScreen from "../features/stats/StatsScreen";
import WelcomeScreen from "../features/auth/WelcomeScreen";
import RegisterScreen from "../features/auth/RegisterScreen";
import StopwatchScreen from "../features/stopwatch/StopwatchScreen";
import TimerScreen from "../features/timer/TimerScreen";
import ProfileScreen from "../features/profile/ProfileScreen";
import TodoScreen from "../features/todo/TodoScreen";

const Stack = createNativeStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
};

function MainStack() {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Todo" component={TodoScreen} />
      <Stack.Screen name="Stopwatch" component={StopwatchScreen} />
      <Stack.Screen name="Timer" component={TimerScreen} />
      <Stack.Screen name="Stats" component={StatsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    return <MainStack />;
  }

  return <AuthStack />;
}

export default function AppNavigator() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
