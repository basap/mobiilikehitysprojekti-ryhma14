import React from "react";
import { View, Text, StyleSheet, Button } from "react-native";
import { useAuth } from "../../contexts/AuthContext";

export default function WelcomeScreen({ navigation }: any) {
  const { loginAsGuest } = useAuth();

  return (
    <View>
      <Text>Welcome</Text>
      <Text>Time to save some time.</Text>
      <Button title="Login" onPress={() => navigation.navigate("Login")} />
      <Button title="Register" onPress={() => navigation.navigate("Register")} />
      <Button title="Guest login" onPress={loginAsGuest} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
  },
});