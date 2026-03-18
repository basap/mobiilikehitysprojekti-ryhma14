import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>loginaa</Text>

      <View style={styles.buttonContainer}>
        <Button title="sähköposti" onPress={() => {}} />
        <Button title="salasana" onPress={() => {}} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  buttonContainer: {
    width: "100%",
    gap: 10,
  },
});