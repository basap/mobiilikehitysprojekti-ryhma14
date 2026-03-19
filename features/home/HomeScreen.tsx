import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";

export default function TaskListScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home screen page</Text>

      <Text>Homescreen page</Text>
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