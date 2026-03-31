import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Typography, Btn, Input, Layout } from '../../style/styles';
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { firestore, auth } from "../../firebase/config";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const navigation = useNavigation();
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case "auth/email-already-in-use":
        return "Email is already in use";
      case "auth/invalid-email":
        return "Invalid email address";
      case "auth/weak-password":
        return "Password should be at least 6 characters";
      default:
        return "Something went wrong. Please try again";
    }
  };

  const handleRegister = async () => {
    if (!username || !email || !password) {
      setErrorMessage("Please fill all fields");
      return;
    }

    if (!agreed) {
      setErrorMessage("You must accept the terms");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');

      const userCredential = await createUserWithEmailAndPassword(
        auth, email.trim(), password
      );

      const user = userCredential.user;

      await updateProfile(user, {
        displayName: username,
      });

      await setDoc(doc(firestore, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        username: username,
        createdAt: serverTimestamp(),
      });

      console.log("User created:", user.uid);
    } catch (error: any) {
      console.log("Register failed:", error.code);
      setErrorMessage(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={Layout.screen}>
      <View style={Layout.center}>
        <Text style={Typography.pageHeading}>Sign Up</Text>
        <View style={{ height: Spacing.lg }} />

        <View style={{ width: '100%' }}>
          <Text style={Typography.inputLabel}>Username</Text>
          <TextInput
            style={Input.field}
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              setErrorMessage('');
            }}
            placeholder="Username"
            placeholderTextColor={Colors.textMuted}
          />
          <View style={{ height: Spacing.md }} />

          <Text style={Typography.inputLabel}>Email</Text>
          <TextInput
            style={Input.field}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setErrorMessage('');
            }}
            placeholder="Email Address"
            placeholderTextColor={Colors.textMuted}
            keyboardType="email-address"
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
            placeholder="Your password"
            placeholderTextColor={Colors.textMuted}
            secureTextEntry
          />
        </View>

        <View style={{ height: Spacing.lg }} />

        {/* Terms checkbox */}
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' }}
          onPress={() => setAgreed(!agreed)}
          activeOpacity={0.7}
        >
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 4,
              borderWidth: 1.5,
              borderColor: agreed ? Colors.primary : Colors.border,
              backgroundColor: agreed ? Colors.primary : '#FFF',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: Spacing.sm,
            }}
          >
            {agreed && <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '700' }}>✓</Text>}
          </View>
          <Text style={[Typography.subtitle, { flex: 1 }]}> 
            I agree to the{' '}
            <Text style={Typography.link}>Terms of Services</Text> and{' '}
            <Text style={Typography.link}>Privacy Policy</Text>.
          </Text>
        </TouchableOpacity>

        <View style={{ height: Spacing.lg }} />

        {errorMessage ? (
          <>
            <View style={{ height: Spacing.sm }} />
            <Text style={{ color: 'red' }}>{errorMessage}</Text>
          </>
        ) : null}

        <TouchableOpacity
          style={[Btn.primary, !agreed && { opacity: 0.5 }]}
          activeOpacity={0.7}
          disabled={!agreed || loading}
          onPress={handleRegister}
        >
          <Text style={Btn.primaryText}>
            {loading ? "Creating account..." : "Register"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bottom link */}
      <View style={{ alignItems: 'center', paddingBottom: Spacing.lg }}>
        <Text style={Typography.subtitle}>
          Have an Account?{' '}
          <Text style={Typography.link} onPress={() => navigation.goBack()}>
            Sign In
          </Text>
        </Text>
      </View>
    </View>
  );
}
