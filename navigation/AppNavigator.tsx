import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

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
const Tab = createBottomTabNavigator();

function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
};

function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Auth" component={AuthStack} />
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Todo" component={TodoScreen} />
      <Tab.Screen name="Stopwatch" component={StopwatchScreen} />
      <Tab.Screen name="Timer" component={TimerScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <MainTabs />
    </NavigationContainer>
  );
}