import React from "react";
import { useNavigation } from "@react-navigation/native";
import { Text, TouchableOpacity, View, StyleSheet, } from "react-native";
import { Btn, Card, Colors, Layout, Radius, Spacing, Typography, } from "../../style/styles";

const tasks = [
  "aaa",
  "bbb",
  "ccc",
  "ddd",
];

const actions = [
  { label: "Timer", icon: "⌛️", route: "Timer" },
  { label: "Stopwatch", icon: "⏱", route: "Stopwatch" },
  { label: "Todo", icon: "✅", route: "Todo" },
  { label: "Statistics", icon: "📈", route: "Stats" },
];

export default function HomeScreen() {
  const navigation = useNavigation();

  return (
    <View style={Layout.screen}>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={Typography.screenTitle}>Welcome</Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate("Profile" as never)}
            style={styles.profileButton}
          >
            <View style={styles.profileIconCircle}>
              <Text style={styles.profileIconText}>P</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.taskCard}>
          {tasks.map((task, index) => (
            <View key={task}>
              <View style={styles.taskRow}>
                <Text style={Typography.body}>{task}</Text>
              </View>
              {index < tasks.length - 1 ? <View style={styles.divider} /> : null}
            </View>
          ))}
        </View>

        <View style={styles.buttonGroup}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.label}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(action.route as never)}
              style={styles.actionButton}
            >
              <View style={styles.actionIconCircle}>
                <Text style={styles.actionIconText}>{action.icon}</Text>
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
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
  topRow: {
    ...Layout.rowBetween,
    alignItems: "flex-start",
  },
  profileButton: {
    padding: Spacing.xs,
    marginTop: 4,
  },
  profileIconCircle: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
  },
  profileIconText: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: "700",
  },
  taskCard: {
    ...Card.base,
    marginTop: Spacing.lg,
    paddingVertical: 0,
    overflow: "hidden",
  },
  taskRow: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: Spacing.md,
  },
  buttonGroup: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  actionButton: {
    ...Btn.primary,
    minWidth: 0,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
    borderRadius: Radius.pill,
  },
  actionLabel: {
    ...Btn.primaryText,
  },
  actionIconCircle: {
    width: 30,
    height: 30,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
  },
  actionIconText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
});