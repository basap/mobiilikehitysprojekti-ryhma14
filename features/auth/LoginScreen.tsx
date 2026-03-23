import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Typography, Btn, Input, Layout } from '../../style/styles';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase/config";
import { useAuth } from "../../contexts/AuthContext";
import ForgotPasswordModal from '../modals/ForgotPassword';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const navigation = useNavigation();
  const { loginAsGuest } = useAuth();

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth, email, password
      );
      console.log("Logged in:", userCredential.user.uid);
    } catch (error: any) {
      console.log("Login failed:", error.message);
    }
  };

  return (
    <View style={Layout.screen}>
      <View style={Layout.center}>
        <ForgotPasswordModal
          visible={showForgot}
          onClose={() => setShowForgot(false)}
          initialEmail={email}
        />

        {/* Logo placeholder */}
        <Text style={{ fontSize: 54 }}>⏱</Text>
        <Text style={{ fontSize: 32, fontStyle: 'italic', color: Colors.text, marginBottom: Spacing.xl, marginTop: -10 }}>
          AikaSaver
        </Text>

        <Text style={Typography.pageHeading}>Sign In</Text>
        <View style={{ height: Spacing.xs }} />
        <Text style={Typography.subtitle}>Hi there! Nice to see you saving time.</Text>
        <View style={{ height: Spacing.lg }} />

        <View style={{ width: '100%' }}>
          <Text style={Typography.inputLabel}>Email</Text>
          <TextInput
            style={Input.field}
            value={email}
            onChangeText={setEmail}
            placeholder="example@email.com"
            placeholderTextColor={Colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <View style={{ height: Spacing.md }} />

          <Text style={Typography.inputLabel}>Password</Text>
          <TextInput
            style={Input.field}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••••"
            placeholderTextColor={Colors.textMuted}
            secureTextEntry
          />
        </View>

        <View style={{ height: Spacing.lg }} />
        <TouchableOpacity style={Btn.primary} onPress={handleLogin} activeOpacity={0.7}>
          <Text style={Btn.primaryText}>Sign in</Text>
        </TouchableOpacity>
        <View style={{ height: Spacing.sm }} />
        <TouchableOpacity onPress={loginAsGuest}>
          <Text style={Typography.subtitle}>or continue without logging in</Text>
        </TouchableOpacity>
      </View>

      <View style={[Layout.rowBetween, { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg }]}>
        <TouchableOpacity onPress={() => setShowForgot(true)}>
          <Text style={Typography.subtitle}>Forgot Password?</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Register' as never)}>
          <Text style={Typography.link}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
