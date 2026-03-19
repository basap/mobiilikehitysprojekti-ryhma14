import React from "react";
import { View, Text, StyleSheet, Button } from "react-native";

export default function WelcomeScreen({ navigation }: any) {
  return (
    <View>
      <Text>Welcome</Text>
      <Text>Time so save some time.</Text>
      <Button title="Login" onPress={() => navigation.navigate("Login")} />
      <Button title="Register" onPress={() => navigation.navigate("Register")} />
      <Button title="login-without-account" onPress={() => navigation.navigate("Home")} />
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