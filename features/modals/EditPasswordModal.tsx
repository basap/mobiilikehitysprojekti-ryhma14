import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { Btn, Colors, Input, ModalStyle, Spacing, Typography } from '../../style/styles';
import ForgotPasswordModal from './ForgotPassword';

interface EditPasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function EditPasswordModal({
  visible,
  onClose,
}: EditPasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const user = auth.currentUser;
  const canEditPassword = useMemo(() => {
    return Boolean(
      user?.email &&
      user.providerData.some((provider) => provider.providerId === 'password')
    );
  }, [user]);

  useEffect(() => {
    if (visible) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrorMessage('');
      setShowForgotPassword(false);
    }
  }, [visible]);

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMessage('');
    setShowForgotPassword(false);
    onClose();
  };

  const handleSave = async () => {
    if (!user) {
      setErrorMessage('You need to be signed in');
      return;
    }

    if (!canEditPassword || !user.email) {
      setErrorMessage('Password can only be changed for email/password accounts');
      return;
    }

    if (!currentPassword.trim()) {
      setErrorMessage('Please enter your current password');
      return;
    }

    if (!newPassword.trim()) {
      setErrorMessage('Please enter a new password');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      setErrorMessage('New password must be different from the current password');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');

      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      handleClose();
    } catch (error: any) {
      console.log('Edit password error:', error.code || error.message);

      switch (error?.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
          setErrorMessage('Current password is incorrect');
          break;
        case 'auth/weak-password':
          setErrorMessage('New password is too weak');
          break;
        case 'auth/requires-recent-login':
          setErrorMessage('Please sign in again and try one more time');
          break;
        case 'auth/too-many-requests':
          setErrorMessage('Too many attempts. Try again later');
          break;
        default:
          setErrorMessage('Could not update password. Please try again');
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
            <ForgotPasswordModal
              visible={showForgotPassword}
              onClose={() => setShowForgotPassword(false)}
              initialEmail={user?.email ?? ''}
              successButtonLabel="Back"
            />

            <Text style={Typography.pageHeading}>Change Password</Text>
            <View style={{ height: Spacing.xs }} />
            <Text style={Typography.subtitle}>
              {canEditPassword
                ? 'Confirm your current password and choose a new one.'
                : 'Password changing is not available for guest accounts.'}
            </Text>
            <View style={{ height: Spacing.lg }} />

            <Text style={Typography.inputLabel}>Current Password</Text>
            <TextInput
              style={Input.field}
              value={currentPassword}
              onChangeText={(text) => {
                setCurrentPassword(text);
                setErrorMessage('');
              }}
              placeholder="Enter your current password"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              autoFocus
              editable={canEditPassword}
            />

            {canEditPassword ? (
              <>
                <View style={{ height: Spacing.xs }} />
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowForgotPassword(true)}
                >
                  <Text style={Typography.link}>Forgot current password?</Text>
                </TouchableOpacity>
              </>
            ) : null}

            <View style={{ height: Spacing.md }} />
            <Text style={Typography.inputLabel}>New Password</Text>
            <TextInput
              style={Input.field}
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                setErrorMessage('');
              }}
              placeholder="Enter a new password"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              editable={canEditPassword}
            />

            <View style={{ height: Spacing.md }} />
            <Text style={Typography.inputLabel}>Confirm New Password</Text>
            <TextInput
              style={Input.field}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setErrorMessage('');
              }}
              placeholder="Enter the new password again"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              editable={canEditPassword}
            />

            {errorMessage ? (
              <>
                <View style={{ height: Spacing.sm }} />
                <Text style={{ color: Colors.error }}>{errorMessage}</Text>
              </>
            ) : null}

            <View style={{ height: Spacing.lg }} />

            <TouchableOpacity
              style={[
                Btn.primary,
                (!canEditPassword || !currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) &&
                  { opacity: 0.5 },
              ]}
              activeOpacity={0.7}
              onPress={handleSave}
              disabled={
                !canEditPassword ||
                !currentPassword.trim() ||
                !newPassword.trim() ||
                !confirmPassword.trim() ||
                loading
              }
            >
              <Text style={Btn.primaryText}>
                {loading ? 'Saving...' : 'Save password'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
}
