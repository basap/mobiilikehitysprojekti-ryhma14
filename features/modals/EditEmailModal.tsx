import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { EmailAuthProvider, reauthenticateWithCredential, updateEmail } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, firestore } from '../../firebase/config';
import { Btn, Colors, Input, ModalStyle, Spacing, Typography } from '../../style/styles';

interface EditEmailModalProps {
  visible: boolean;
  onClose: () => void;
  currentEmail: string;
  currentUsername: string;
  onSaved: (email: string) => void;
}

export default function EditEmailModal({
  visible,
  onClose,
  currentEmail,
  currentUsername,
  onSaved,
}: EditEmailModalProps) {
  const [email, setEmail] = useState(currentEmail);
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const user = auth.currentUser;
  const canEditEmail = useMemo(() => {
    return Boolean(
      user?.email &&
      user.providerData.some((provider) => provider.providerId === 'password')
    );
  }, [user]);

  useEffect(() => {
    if (visible) {
      setEmail(currentEmail);
      setPassword('');
      setErrorMessage('');
    }
  }, [currentEmail, visible]);

  const handleClose = () => {
    setEmail(currentEmail);
    setPassword('');
    setErrorMessage('');
    onClose();
  };

  const handleSave = async () => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!user) {
      setErrorMessage('You need to be signed in');
      return;
    }

    if (!canEditEmail || !user.email) {
      setErrorMessage('Email can only be changed for email/password accounts');
      return;
    }

    if (!trimmedEmail) {
      setErrorMessage('Please enter an email');
      return;
    }

    if (trimmedEmail === currentEmail.trim().toLowerCase()) {
      handleClose();
      return;
    }

    if (!password.trim()) {
      setErrorMessage('Please confirm your password');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');

      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      await updateEmail(user, trimmedEmail);

      await setDoc(
        doc(firestore, 'users', user.uid),
        {
          uid: user.uid,
          email: trimmedEmail,
          username: currentUsername,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      onSaved(trimmedEmail);
      handleClose();
    } catch (error: any) {
      console.log('Edit email error:', error.code || error.message);

      switch (error?.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
          setErrorMessage('Current password is incorrect');
          break;
        case 'auth/invalid-email':
          setErrorMessage('Please enter a valid email address');
          break;
        case 'auth/email-already-in-use':
          setErrorMessage('Email is already in use');
          break;
        case 'auth/requires-recent-login':
          setErrorMessage('Please sign in again and try one more time');
          break;
        case 'auth/too-many-requests':
          setErrorMessage('Too many attempts. Try again later');
          break;
        default:
          setErrorMessage('Could not update email. Please try again');
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
            <Text style={Typography.pageHeading}>Edit Email</Text>
            <View style={{ height: Spacing.xs }} />
            <Text style={Typography.subtitle}>
              {canEditEmail
                ? 'Update your account email and confirm it with your password.'
                : 'Email editing not available for guest accounts.'}
            </Text>
            <View style={{ height: Spacing.lg }} />

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
              autoFocus
              editable={canEditEmail}
            />

            <View style={{ height: Spacing.md }} />
            <Text style={Typography.inputLabel}>Current Password</Text>
            <TextInput
              style={Input.field}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrorMessage('');
              }}
              placeholder="Enter your password"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              editable={canEditEmail}
            />

            {errorMessage ? (
              <>
                <View style={{ height: Spacing.sm }} />
                <Text style={{ color: Colors.error }}>{errorMessage}</Text>
              </>
            ) : null}

            <View style={{ height: Spacing.lg }} />

            <TouchableOpacity
              style={[Btn.primary, (!canEditEmail || !email.trim()) && { opacity: 0.5 }]}
              activeOpacity={0.7}
              onPress={handleSave}
              disabled={!canEditEmail || !email.trim() || loading}
            >
              <Text style={Btn.primaryText}>
                {loading ? 'Saving...' : 'Save email'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
}
