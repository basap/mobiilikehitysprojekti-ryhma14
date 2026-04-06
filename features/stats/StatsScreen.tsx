import React from "react";
import { useNavigation } from "@react-navigation/native";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Btn } from "../../style/styles";

export default function StatsScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Stats page</Text>

      <TouchableOpacity
        style={styles.homeButton}
        onPress={() => navigation.navigate("Home" as never)}
        activeOpacity={0.7}
      >
        <Text style={Btn.outlineText}>Home</Text>
      </TouchableOpacity>

      <Text>Stats page</Text>
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
  homeButton: {
    ...Btn.outline,
    minWidth: 0,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
});
