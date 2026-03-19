import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { signOut } from "firebase/auth";
import { auth} from "../../firebase/config";

export default function ProfileScreen() {
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.log("Logout failed:", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text>Profile</Text>

      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});