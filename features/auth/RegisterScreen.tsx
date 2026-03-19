import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { firestore, auth } from "../../firebase/config";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth, email, password
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

      console.log("User created:", userCredential.user.uid);
    } catch (error: any) {
      console.log("Register failed:", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rekisteröidy</Text>
      <TextInput placeholder="Username" value={username} onChangeText={setUsername} style={styles.input} />
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
      <Button title="Register" onPress={handleRegister} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    marginBottom: 10,
    padding: 10,
  },
});