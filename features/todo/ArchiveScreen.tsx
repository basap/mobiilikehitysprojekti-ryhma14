import React, { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { Btn, Card, Colors, Layout, ModalStyle, Spacing, Typography } from "../../style/styles";
import { Item } from "./TodoItem";
import { ensureTodoListDocument, restoreTodo, subscribeToTodos } from "./todoStore";

function formatDate(dateString?: string) {
  if (!dateString) {
    return "No deadline";
  }

  const parsedDate = new Date(dateString);

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
}

function formatTimeSpent(timeSpentMs: number) {
  if (!timeSpentMs) {
    return "Not available yet";
  }

  const totalMinutes = Math.floor(timeSpentMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours}h ${minutes}min`;
}

export default function ArchiveScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setItems([]);
      return;
    }

    ensureTodoListDocument(user.uid).catch((error) => {
      console.log("Create todo list error:", error);
    });

    const unsubscribe = subscribeToTodos(user.uid, (nextItems) => {
      setItems(nextItems.filter((item) => item.isArchived));
    });

    return unsubscribe;
  }, [user?.uid]);

  const sortedItems = useMemo(
    () =>
      [...items].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      ),
    [items]
  );

  const handleRestore = async () => {
    if (!selectedItem || !user?.uid) {
      return;
    }

    const userUid = user.uid;

    try {
      await restoreTodo(userUid, selectedItem.id);
      setSelectedItem(null);
    } catch (error) {
      console.log("Restore task error:", error);
    }
  };

  return (
    <View style={Layout.screen}>
      <View style={styles.content}>
        <Text style={Typography.screenTitle}>Archive</Text>

        <View style={styles.listCard}>
          {sortedItems.length > 0 ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              {sortedItems.map((item, index) => (
                <View key={item.id}>
                  <Pressable onPress={() => setSelectedItem(item)} style={styles.rowButton}>
                    <View style={styles.taskRow}>
                      <Text style={styles.taskName}>{item.name}</Text>
                      <Text style={styles.taskDeadline}>Deadline: {formatDate(item.deadline)}</Text>
                    </View>
                  </Pressable>
                  {index < sortedItems.length - 1 ? <View style={styles.divider} /> : null}
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <Text style={Typography.body}>No archived tasks yet.</Text>
              <Text style={Typography.caption}>Archived todos will appear here.</Text>
            </View>
          )}
        </View>
      </View>

      <Modal
        visible={selectedItem !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedItem(null)}
      >
        <TouchableOpacity
          style={ModalStyle.backdrop}
          activeOpacity={1}
          onPress={() => setSelectedItem(null)}
        >
          <TouchableOpacity activeOpacity={1} style={ModalStyle.container}>
            <Text style={Typography.pageHeading}>{selectedItem?.name ?? "Task"}</Text>
            <View style={styles.modalGapSmall} />
            <Text style={Typography.subtitle}>
              Total spent time: {formatTimeSpent(selectedItem?.timeSpentMs ?? 0)}
            </Text>
            <View style={styles.modalGapLarge} />

            <TouchableOpacity activeOpacity={0.7} onPress={handleRestore} style={styles.restoreButton}>
              <Text style={Btn.primaryText}>Return to todos</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  listCard: {
    ...Card.base,
    marginTop: Spacing.lg,
    paddingVertical: 0,
    overflow: "hidden",
    flex: 1,
  },
  rowButton: {
    width: "100%",
  },
  taskRow: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  taskName: {
    ...Typography.body,
    fontWeight: "600",
  },
  taskDeadline: {
    ...Typography.caption,
    marginTop: Spacing.xs,
    color: Colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: Spacing.md,
  },
  emptyState: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    gap: Spacing.xs,
  },
  modalGapSmall: {
    height: Spacing.xs,
  },
  modalGapLarge: {
    height: Spacing.lg,
  },
  restoreButton: {
    ...Btn.primary,
    minWidth: 0,
    width: "100%",
  },
});
