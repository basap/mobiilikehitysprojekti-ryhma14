import React, { useEffect, useMemo, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { Text, TouchableOpacity, View, StyleSheet, } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { Btn, Card, Colors, Layout, Radius, Spacing, Typography, } from "../../style/styles";
import { Item } from "../todo/TodoItem";
import { ensureTodoListDocument, subscribeToTodos } from "../todo/todoStore";

const actions = [
  { label: "Timer", icon: "⌛️", route: "Timer" },
  { label: "Stopwatch", icon: "⏱", route: "Stopwatch" },
  { label: "Todo", icon: "✅", route: "Todo" },
  { label: "Statistics", icon: "📈", route: "Stats" },
];

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Item[]>([]);

  useEffect(() => {
    if (!user?.uid) {
      setTasks([]);
      return;
    }

    ensureTodoListDocument(user.uid).catch((error) => {
      console.log("Create todo list error:", error);
    });

    const unsubscribe = subscribeToTodos(user.uid, (items) => {
      setTasks(items.filter((item) => !item.isArchived));
    });

    return unsubscribe;
  }, [user?.uid]);

  const visibleTasks = useMemo(() => {
    return [...tasks]
      .sort((a, b) => {
        const first = a.deadline ? new Date(a.deadline).getTime() : Number.MAX_SAFE_INTEGER;
        const second = b.deadline ? new Date(b.deadline).getTime() : Number.MAX_SAFE_INTEGER;
        return first - second;
      })
      .slice(0, 4);
  }, [tasks]);

  const formatDeadline = (deadline?: string) => {
    if (!deadline) {
      return "No deadline";
    }

    const parsedDate = new Date(deadline);

    if (Number.isNaN(parsedDate.getTime())) {
      return "No deadline";
    }

    return parsedDate.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate("Todo" as never)}
          style={styles.taskCard}
        >
          {visibleTasks.length > 0 ? (
            visibleTasks.map((task, index) => (
              <View key={task.id}>
                <View style={styles.taskRow}>
                  <Text style={Typography.body}>{task.name}</Text>
                  <Text style={styles.deadlineText}>{formatDeadline(task.deadline)}</Text>
                </View>
                {index < visibleTasks.length - 1 ? <View style={styles.divider} /> : null}
              </View>
            ))
          ) : (
            <View style={styles.emptyTaskState}>
              <Text style={Typography.body}>No todos yet.</Text>
              <Text style={styles.deadlineText}>Your next tasks will appear here.</Text>
            </View>
          )}
        </TouchableOpacity>

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
    ...Layout.rowBetween,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  deadlineText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: Spacing.md,
  },
  emptyTaskState: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
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
    alignItems: "center",
    borderRadius: Radius.pill,
    position: "relative",
    justifyContent: "center",
    paddingLeft: 64,
    paddingRight: 64,
  },
  actionLabel: {
    ...Btn.primaryText,
    textAlign: "center",
  },
  actionIconCircle: {
    position: "absolute",
    left: Spacing.lg,
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