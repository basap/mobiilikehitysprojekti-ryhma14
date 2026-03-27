import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Typography, Btn, Input, Layout } from '../../style/styles';
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, firestore } from "../../firebase/config";
import { useAuth } from "../../contexts/AuthContext";
import ForgotPasswordModal from '../modals/ForgotPassword';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const navigation = useNavigation();
  const { loginAsGuest } = useAuth();
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case "auth/invalid-email":
        return "Invalid email address";
      case "auth/user-not-found":
        return "No account found with this email";
      case "auth/wrong-password":
        return "Incorrect password";
      case "auth/invalid-credential":
        return "Email or password is incorrect";
      case "auth/too-many-requests":
        return "Too many attempts. Try again later";
      default:
        return "Something went wrong. Please try again";    
    }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      const userCredential = await signInWithEmailAndPassword(
        auth, email.trim(), password
      );

      const user = userCredential.user;
      await user.reload();
      const updatedUser = auth.currentUser;

      if (updatedUser) {
        await setDoc(
          doc(firestore, "users", updatedUser.uid),
          {
            email: updatedUser.email,
          },
          { merge: true }
        );
      }

      console.log("Logged in:", userCredential.user.uid);
    } catch (error: any) {
      console.log("Login failed:", error.code);
      setErrorMessage(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={Layout.screen}>
      <View style={Layout.center}>
        <ForgotPasswordModal
          visible={showForgot}
          onClose={() => setShowForgot(false)}
          initialEmail={email}
          successButtonLabel="Back to Sign In"
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
            onChangeText={(text) => {
              setEmail(text);
              setErrorMessage('');
            }}
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
            onChangeText={(text) => {
              setPassword(text);
              setErrorMessage('');
            }}
            placeholder="••••••••••"
            placeholderTextColor={Colors.textMuted}
            secureTextEntry
          />

          {errorMessage ? (
            <>
              <View style={{ height: Spacing.sm }} />
              <Text style={{ color: 'red'}}>{errorMessage}</Text>
            </>
          ) : null}
        </View>

        <View style={{ height: Spacing.lg }} />
        <TouchableOpacity style={Btn.primary} onPress={handleLogin} activeOpacity={0.7}>
          <Text style={Btn.primaryText}>
            {loading ? "Signing in..." : "Sign in"}
          </Text>
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
