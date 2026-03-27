import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Colors, Spacing, Typography, Btn, Input,  ModalStyle } from '../../style/styles';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from "../../firebase/config";

interface ForgotPasswordProps {
  visible: boolean;
  onClose: () => void;
  initialEmail?: string;
  successButtonLabel?: string;
}

export default function ForgotPasswordModal({
  visible,
  onClose,
  initialEmail = '',
  successButtonLabel = 'Done',
}: ForgotPasswordProps) {
  const [resetEmail, setResetEmail] = useState(initialEmail);
  const [resetSent, setResetSent] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setResetEmail(initialEmail);
      setResetSent(false);
    }
  }, [initialEmail, visible]);

  const handleResetPassword = async () => {
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());

      setResetSent(true);
    } catch (error: any) {
      console.log("Reset password error:", error.message);
    }
  };

  const handleClose = () => {
    setResetEmail('');
    setResetSent(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <TouchableOpacity style={ModalStyle.backdrop} activeOpacity={1} onPress={handleClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity activeOpacity={1} style={ModalStyle.container}>
            {!resetSent ? (
              <>
                <Text style={Typography.pageHeading}>Reset Password</Text>
                <View style={{ height: Spacing.xs }} />
                <Text style={Typography.subtitle}>
                  Enter your email and we'll send you a reset link.
                </Text>
                <View style={{ height: Spacing.lg }} />

                <Text style={Typography.inputLabel}>Email</Text>
                <TextInput
                  style={Input.field}
                  value={resetEmail}
                  onChangeText={setResetEmail}
                  placeholder="example@email.com"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoFocus
                />
                <View style={{ height: Spacing.lg }} />

                <TouchableOpacity
                  style={[Btn.primary, !resetEmail.trim() && { opacity: 0.5 }]}
                  activeOpacity={0.7}
                  disabled={!resetEmail.trim()}
                  onPress={handleResetPassword}
                >
                  <Text style={Btn.primaryText}>Send Reset Link</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={{ fontSize: 40, textAlign: 'center' }}>✉️</Text>
                <View style={{ height: Spacing.sm }} />
                <Text style={[Typography.pageHeading, { textAlign: 'center' }]}>Check your email</Text>
                <View style={{ height: Spacing.xs }} />
                <Text style={[Typography.subtitle, { textAlign: 'center' }]}>
                  We've sent a password reset link to {resetEmail}
                </Text>
                <View style={{ height: Spacing.lg }} />
                <TouchableOpacity style={Btn.primary} activeOpacity={0.7} onPress={handleClose}>
                  <Text style={Btn.primaryText}>{successButtonLabel}</Text>
                </TouchableOpacity>
              </>
            )}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
}
