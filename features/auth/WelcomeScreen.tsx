import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Typography, Btn, Layout } from '../../style/styles';
import { useAuth } from "../../contexts/AuthContext";

export default function WelcomeScreen({ navigation }: any) {
  const { loginAsGuest } = useAuth();

  return (
    <View style={Layout.screen}>
      <View style={Layout.center}>
        {/* Logo placeholder */}
        <Text style={{ fontSize: 54 }}>⏱</Text>
        <Text style={{ fontSize: 32, fontStyle: 'italic', color: Colors.text, marginBottom: Spacing.xl, marginTop: -10 }}>
          AikaSaver
        </Text>

        <Text style={Typography.screenTitle}>Welcome</Text>
        <View style={{ height: Spacing.xs }} />
        <Text style={Typography.subtitle}>Time is limited, it's time to save it!</Text>

        <View style={{ height: Spacing.xl }} />

        <TouchableOpacity
          style={Btn.primary}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Login' as never)}
        >
          <Text style={Btn.primaryText}>Continue by signing in</Text>
        </TouchableOpacity>

        <View style={{ height: Spacing.sm }} />

        <TouchableOpacity
          style={Btn.primary}
          activeOpacity={0.7}
          onPress={loginAsGuest}
        >
          <Text style={Btn.primaryText}>Continue as a guest</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
