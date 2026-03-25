import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { EmailAuthProvider, reauthenticateWithCredential, updateProfile } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, firestore } from '../../firebase/config';
import { Btn, Colors, Input, ModalStyle, Spacing, Typography } from '../../style/styles';

interface EditUsernameModalProps {
  visible: boolean;
  onClose: () => void;
  currentUsername: string;
  onSaved: (username: string) => void;
}

export default function EditUsernameModal({
  visible,
  onClose,
  currentUsername,
  onSaved,
}: EditUsernameModalProps) {
  const [username, setUsername] = useState(currentUsername);
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const user = auth.currentUser;
  const requiresPassword = useMemo(() => {
    return Boolean(
      user?.email &&
      user.providerData.some((provider) => provider.providerId === 'password')
    );
  }, [user]);

  useEffect(() => {
    if (visible) {
      setUsername(currentUsername);
      setPassword('');
      setErrorMessage('');
    }
  }, [currentUsername, visible]);

  const handleClose = () => {
    setUsername(currentUsername);
    setPassword('');
    setErrorMessage('');
    onClose();
  };

  const handleSave = async () => {
    const trimmedUsername = username.trim();

    if (!user) {
      setErrorMessage('You need to be signed in');
      return;
    }

    if (!trimmedUsername) {
      setErrorMessage('Please enter a username');
      return;
    }

    if (trimmedUsername === currentUsername.trim()) {
      handleClose();
      return;
    }

    if (requiresPassword && !password.trim()) {
      setErrorMessage('Please confirm your password');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');

      if (requiresPassword && user.email) {
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);
      }

      await updateProfile(user, {
        displayName: trimmedUsername,
      });

      await setDoc(
        doc(firestore, 'users', user.uid),
        {
          uid: user.uid,
          email: user.email ?? null,
          username: trimmedUsername,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      onSaved(trimmedUsername);
      handleClose();
    } catch (error: any) {
      console.log('Edit username error:', error.code || error.message);

      switch (error?.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
          setErrorMessage('Current password is incorrect');
          break;
        case 'auth/too-many-requests':
          setErrorMessage('Too many attempts. Try again later');
          break;
        default:
          setErrorMessage('Could not update username. Please try again');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <TouchableOpacity style={ModalStyle.backdrop} activeOpacity={1} onPress={handleClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity activeOpacity={1} style={ModalStyle.container}>
            <Text style={Typography.pageHeading}>Edit Username</Text>
            <View style={{ height: Spacing.xs }} />
            <Text style={Typography.subtitle}>
              Update the name shown on your profile.
            </Text>
            <View style={{ height: Spacing.lg }} />

            <Text style={Typography.inputLabel}>Username</Text>
            <TextInput style={Input.field} value={username}
              onChangeText={(text) => {
                setUsername(text);
                setErrorMessage('');
              }}
              placeholder="Username" placeholderTextColor={Colors.textMuted} autoCapitalize="none" autoFocus />

            {requiresPassword ? (
              <>
                <View style={{ height: Spacing.md }} />
                <Text style={Typography.inputLabel}>Current Password</Text>
                <TextInput style={Input.field} value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setErrorMessage('');
                  }}
                  placeholder="Enter your password" placeholderTextColor={Colors.textMuted} secureTextEntry />
              </>
            ) : null}

            {errorMessage ? (
              <>
                <View style={{ height: Spacing.sm }} />
                <Text style={{ color: Colors.error }}>{errorMessage}</Text>
              </>
            ) : null}

            <View style={{ height: Spacing.lg }} />

            <TouchableOpacity style={[Btn.primary, !username.trim() && { opacity: 0.5 }]} activeOpacity={0.7} onPress={handleSave} disabled={!username.trim() || loading}>
              <Text style={Btn.primaryText}>
                {loading ? 'Saving...' : 'Save username'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
}
