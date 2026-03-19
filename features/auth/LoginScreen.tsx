import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Typography, Btn, Input, Layout } from '../../style/styles';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View style={Layout.screen}>
      <View style={Layout.center}>
        {/* Logo logic coming soon! */}
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
        <TouchableOpacity style={Btn.primary} activeOpacity={0.7}>
          <Text style={Btn.primaryText}>Sign in</Text>
        </TouchableOpacity>
        <View style={{ height: Spacing.sm }} />
        <TouchableOpacity>
          <Text style={Typography.subtitle}>or continue without logging in</Text>
        </TouchableOpacity>
      </View>

      <View style={[Layout.rowBetween, { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg }]}>
        <TouchableOpacity>
          <Text style={Typography.subtitle}>Forgot Password?</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={Typography.link}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}