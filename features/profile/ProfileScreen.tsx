import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
import { firestore } from "../../firebase/config";
import EditEmailModal from "../modals/EditEmailModal";
import EditUsernameModal from "../modals/EditUsernameModal";
import { Btn, Card, Colors, Layout, Spacing, Typography } from "../../style/styles";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const fallbackUsername =
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "Guest user";
  const fallbackEmail = user?.email || "No email added";

  const [username, setUsername] = useState(fallbackUsername);
  const [email, setEmail] = useState(fallbackEmail);
  const [showEditUsername, setShowEditUsername] = useState(false);
  const [showEditEmail, setShowEditEmail] = useState(false);

  useEffect(() => {
    const loadUsername = async () => {
      if (!user?.uid) {
        setUsername(fallbackUsername);
        return;
      }

      try {
        const userDoc = await getDoc(doc(firestore, "users", user.uid));
        const savedUsername = userDoc.data()?.username;

        if (typeof savedUsername === "string" && savedUsername.trim()) {
          setUsername(savedUsername);
          return;
        }
      } catch (error: any) {
        console.log("Load username error:", error.message);
      }

      setUsername(fallbackUsername);
    };

    loadUsername();
  }, [fallbackUsername, user?.uid]);

  useEffect(() => {
    setEmail(fallbackEmail);
  }, [fallbackEmail]);

  return (
    <View style={Layout.screen}>
      <EditEmailModal
        visible={showEditEmail}
        onClose={() => setShowEditEmail(false)}
        currentEmail={email}
        currentUsername={username}
        onSaved={setEmail}
      />

      <EditUsernameModal
        visible={showEditUsername}
        onClose={() => setShowEditUsername(false)}
        currentUsername={username}
        onSaved={setUsername}
      />

      <View style={styles.content}>
        <Text style={Typography.screenTitle}>Profile</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.info}>
              <Text style={styles.label}>Username</Text>
              <Text style={styles.value}>{username}</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              style={Btn.pill}
              onPress={() => setShowEditUsername(true)}
            >
              <Text style={Btn.pillText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.info}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{email}</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              style={Btn.pill}
              onPress={() => setShowEditEmail(true)}
            >
              <Text style={Btn.pillText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.info}>
              <Text style={styles.label}>Password</Text>
              <Text style={styles.value}>••••••••••</Text>
            </View>
            <TouchableOpacity activeOpacity={0.7} style={Btn.pill}>
              <Text style={Btn.pillText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.7}>
          <Text style={Btn.primaryText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  card: {
    ...Card.base,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.lg,
  },
  row: {
    ...Layout.rowBetween,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  info: {
    flex: 1,
    marginRight: Spacing.md,
  },
  label: {
    ...Typography.inputLabel,
    marginBottom: Spacing.xs,
  },
  value: {
    ...Typography.body,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: Spacing.md,
  },
  logoutButton: {
    ...Btn.primary,
    minWidth: 0,
    width: "100%",
    marginTop: Spacing.lg,
  },
});
