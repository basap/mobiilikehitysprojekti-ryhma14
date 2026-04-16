import React, { useEffect, useMemo, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAuth } from "../../contexts/AuthContext";
import { Btn, Card, Colors, Dropdown, Input, Layout, ModalStyle, Radius, Spacing, Typography } from "../../style/styles";
import TodoInput from "./TodoInput";
import { Item } from "./TodoItem";
import { addTodo, archiveTodos, ensureTodoListDocument, subscribeToTodos, updateTodo } from "./todoStore";

const ITEMS_PER_PAGE = 5;
const hours = Array.from({ length: 24 }, (_, index) => index);
const minutes = Array.from({ length: 60 }, (_, index) => index);

const sortOptions = [
  { label: "Due date", value: "dueDate" },
  { label: "Creation date", value: "creationDate" },
  { label: "Alphabetical", value: "alphabetical" },
] as const;

type SortValue = (typeof sortOptions)[number]["value"];

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

function padNumber(value: number) {
  return String(value).padStart(2, "0");
}

export default function TodoScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [sortBy, setSortBy] = useState<SortValue>("dueDate");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [page, setPage] = useState(0);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editName, setEditName] = useState("");
  const [editDate, setEditDate] = useState(new Date());
  const [editHour, setEditHour] = useState(0);
  const [editMinute, setEditMinute] = useState(0);
  const [showEditPicker, setShowEditPicker] = useState(false);

  useEffect(() => {
    if (!user?.uid) {
      setItems([]);
      return;
    }

    ensureTodoListDocument(user.uid).catch((error) => {
      console.log("Create todo list error:", error);
    });

    const unsubscribe = subscribeToTodos(user.uid, (nextItems) => {
      setItems(nextItems.filter((item) => !item.isArchived));
    });

    return unsubscribe;
  }, [user?.uid]);

  const sortedItems = useMemo(() => {
    const itemsCopy = [...items];

    if (sortBy === "alphabetical") {
      return itemsCopy.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      );
    }

    if (sortBy === "creationDate") {
      return itemsCopy.sort((a, b) => {
        const first = new Date(a.createdAt ?? 0).getTime();
        const second = new Date(b.createdAt ?? 0).getTime();
        return second - first;
      });
    }

    return itemsCopy.sort((a, b) => {
      const first = a.deadline ? new Date(a.deadline).getTime() : Number.MAX_SAFE_INTEGER;
      const second = b.deadline ? new Date(b.deadline).getTime() : Number.MAX_SAFE_INTEGER;
      return first - second;
    });
  }, [items, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / ITEMS_PER_PAGE));
  const visibleItems = sortedItems.slice(
    page * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE + ITEMS_PER_PAGE
  );
  const selectedSortLabel =
    sortOptions.find((option) => option.value === sortBy)?.label ?? "Due date";

  useEffect(() => {
    setPage(0);
  }, [sortBy]);

  useEffect(() => {
    if (page > totalPages - 1) {
      setPage(Math.max(0, totalPages - 1));
    }
  }, [page, totalPages]);

  useEffect(() => {
    setSelectedTaskIds((current) =>
      current.filter((id) => items.some((item) => item.id === id))
    );
  }, [items]);

  const formattedEditDate = useMemo(
    () =>
      editDate.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [editDate]
  );

  const handleAddItem = async (name: string, date: Date) => {
    if (!user?.uid) {
      return;
    }

    const userUid = user.uid;

    try {
      await addTodo(userUid, name, date);
    } catch (error) {
      console.log("Add task error:", error);
    }
  };

  const handleToggleSelected = (taskId: string) => {
    setSelectedTaskIds((current) =>
      current.includes(taskId)
        ? current.filter((id) => id !== taskId)
        : [...current, taskId]
    );
  };

  const handleArchivePress = async () => {
    if (selectedTaskIds.length === 0) {
      navigation.navigate("Archive" as never);
      return;
    }

    if (!user?.uid) {
      return;
    }

    const userUid = user.uid;

    try {
      await archiveTodos(userUid, selectedTaskIds);
      setSelectedTaskIds([]);
    } catch (error) {
      console.log("Archive tasks error:", error);
    }
  };

  const openEditModal = (item: Item) => {
    const deadline = item.deadline ? new Date(item.deadline) : new Date();

    setEditingItem(item);
    setEditName(item.name);
    setEditDate(deadline);
    setEditHour(deadline.getHours());
    setEditMinute(deadline.getMinutes());
    setShowEditPicker(false);
  };

  const closeEditModal = () => {
    setEditingItem(null);
    setEditName("");
    setEditDate(new Date());
    setEditHour(0);
    setEditMinute(0);
    setShowEditPicker(false);
  };

  const handleSaveEdit = async () => {
    if (!editingItem || !user?.uid || !editName.trim()) {
      return;
    }

    const deadline = new Date(editDate);
    deadline.setHours(editHour, editMinute, 0, 0);

    try {
      await updateTodo(user.uid, editingItem.id, {
        name: editName.trim(),
        deadline,
      });
      closeEditModal();
    } catch (error) {
      console.log("Update task error:", error);
    }
  };

  return (
    <View style={Layout.screen}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={Typography.screenTitle}>Todo</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={handleArchivePress} style={styles.archiveButton}>
            <Text style={styles.archiveButtonText}>
              {selectedTaskIds.length > 0 ? "Archive selected" : "Archive"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dropdownWrap}>
          <Pressable onPress={() => setShowSortMenu((current) => !current)} style={styles.dropdownButton}>
            <Text style={styles.dropdownLabel}>Sort by</Text>
            <Text style={styles.dropdownValue}>{selectedSortLabel}</Text>
          </Pressable>

          {showSortMenu ? (
            <View style={Dropdown.list}>
              {sortOptions.map((option, index) => (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    setSortBy(option.value);
                    setShowSortMenu(false);
                  }}
                  style={[
                    Dropdown.item,
                    option.value === sortBy ? Dropdown.highlightedItem : null,
                    index === sortOptions.length - 1 ? styles.lastDropdownItem : null,
                  ]}
                >
                  <Text
                    style={[
                      Dropdown.itemText,
                      option.value === sortBy ? Dropdown.highlightedText : null,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.listCard}>
          {visibleItems.length > 0 ? (
            visibleItems.map((item, index) => (
              <View key={item.id}>
                <View style={styles.todoRow}>
                  <Pressable onPress={() => openEditModal(item)} style={styles.todoInfo}>
                    <Text style={styles.todoName}>{item.name}</Text>
                    <Text style={styles.todoDeadline}>Deadline: {formatDate(item.deadline)}</Text>
                  </Pressable>

                  <View style={styles.rowActions}>
                    <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate("Stopwatch" as never)} style={styles.iconButton}>
                      <Text style={styles.stopwatchIcon}>⏱</Text>
                    </TouchableOpacity>

                    <Pressable onPress={() => handleToggleSelected(item.id)}
                      style={[
                        styles.checkbox,
                        selectedTaskIds.includes(item.id) ? styles.checkboxSelected : null,
                      ]}
                    >
                      {selectedTaskIds.includes(item.id) ? (
                        <View style={styles.checkboxInner} />
                      ) : null}
                    </Pressable>
                  </View>
                </View>

                {index < visibleItems.length - 1 ? <View style={styles.divider} /> : null}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={Typography.body}>No todos yet.</Text>
              <Text style={Typography.caption}>Your saved tasks will appear here.</Text>
            </View>
          )}
        </View>

        <View style={styles.paginationRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            disabled={page === 0}
            onPress={() => setPage((current) => Math.max(0, current - 1))}
            style={[styles.arrowButton, page === 0 ? styles.disabledButton : null]}
          >
            <Text style={styles.arrowLabel}>{"<"}</Text>
          </TouchableOpacity>

          <Text style={styles.pageLabel}>
            Page {totalPages === 0 ? 0 : page + 1} / {totalPages}
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            disabled={page >= totalPages - 1}
            onPress={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
            style={[styles.arrowButton, page >= totalPages - 1 ? styles.disabledButton : null]}
          >
            <Text style={styles.arrowLabel}>{">"}</Text>
          </TouchableOpacity>
        </View>

        <TodoInput onAdd={handleAddItem} />
      </View>

      <Modal
        visible={editingItem !== null}
        transparent
        animationType="fade"
        onRequestClose={closeEditModal}
      >
        <TouchableOpacity style={ModalStyle.backdrop} activeOpacity={1} onPress={closeEditModal}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <TouchableOpacity activeOpacity={1} style={styles.modalCard}>
              <Text style={Typography.pageHeading}>Edit Todo</Text>
              <View style={styles.modalGapSmall} />
              <Text style={Typography.subtitle}>Update the task name and deadline.</Text>
              <View style={styles.modalGapLarge} />

              <Text style={Typography.inputLabel}>Todo name</Text>
              <TextInput
                autoFocus
                style={Input.field}
                value={editName}
                onChangeText={setEditName}
                placeholder="Write your todo name"
                placeholderTextColor={Colors.textMuted}
              />

              <View style={styles.modalGapMedium} />
              <Text style={Typography.inputLabel}>Deadline day</Text>
              <Pressable
                onPress={() => setShowEditPicker((current) => !current)}
                style={styles.selectionButton}
              >
                <Text style={styles.selectionValue}>{formattedEditDate}</Text>
              </Pressable>

              {showEditPicker ? (
                <View style={styles.calendarWrap}>
                  <DateTimePicker
                    value={editDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "inline" : "calendar"}
                    themeVariant="light"
                    onChange={(_, nextDate) => {
                      if (nextDate) {
                        setEditDate(nextDate);
                        setShowEditPicker(false);
                      }
                      if (!nextDate) {
                        setShowEditPicker(false);
                      }
                    }}
                  />
                </View>
              ) : null}

              <View style={styles.modalGapMedium} />
              <Text style={Typography.inputLabel}>Deadline time</Text>
              <View style={styles.timeRow}>
                <View style={styles.timeColumn}>
                  <Text style={styles.timeLabel}>Hour</Text>
                  <ScrollView style={styles.timeList} nestedScrollEnabled>
                    {hours.map((hour) => (
                      <Pressable
                        key={hour}
                        onPress={() => setEditHour(hour)}
                        style={[
                          styles.timeOption,
                          editHour === hour ? styles.timeOptionSelected : null,
                        ]}
                      >
                        <Text
                          style={[
                            styles.timeOptionText,
                            editHour === hour ? styles.timeOptionTextSelected : null,
                          ]}
                        >
                          {padNumber(hour)}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.timeColumn}>
                  <Text style={styles.timeLabel}>Minute</Text>
                  <ScrollView style={styles.timeList} nestedScrollEnabled>
                    {minutes.map((minute) => (
                      <Pressable
                        key={minute}
                        onPress={() => setEditMinute(minute)}
                        style={[
                          styles.timeOption,
                          editMinute === minute ? styles.timeOptionSelected : null,
                        ]}
                      >
                        <Text
                          style={[
                            styles.timeOptionText,
                            editMinute === minute ? styles.timeOptionTextSelected : null,
                          ]}
                        >
                          {padNumber(minute)}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <View style={styles.modalGapLarge} />
              <View style={styles.modalButtonRow}>
                <TouchableOpacity activeOpacity={0.7} onPress={closeEditModal} style={styles.secondaryButton}>
                  <Text style={Btn.outlineText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  disabled={!editName.trim()}
                  onPress={handleSaveEdit}
                  style={[styles.primaryButton, !editName.trim() ? styles.disabledButton : null]}
                >
                  <Text style={Btn.primaryText}>Save</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </KeyboardAvoidingView>
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
  headerRow: {
    ...Layout.rowBetween,
    alignItems: "center",
    gap: Spacing.md,
  },
  archiveButton: {
    ...Btn.outline,
    minWidth: 0,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  archiveButtonText: {
    ...Btn.outlineText,
    fontSize: 14,
  },
  dropdownWrap: {
    ...Dropdown.container,
    marginTop: Spacing.lg,
  },
  dropdownButton: {
    ...Card.base,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
  },
  dropdownLabel: {
    ...Typography.inputLabel,
  },
  dropdownValue: {
    ...Typography.body,
    color: Colors.primaryDark,
    fontWeight: "600",
  },
  lastDropdownItem: {
    borderBottomWidth: 0,
  },
  listCard: {
    ...Card.base,
    marginTop: Spacing.lg,
    paddingVertical: 0,
    overflow: "hidden",
  },
  todoRow: {
    ...Layout.rowBetween,
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  todoInfo: {
    flex: 1,
  },
  todoName: {
    ...Typography.body,
    fontWeight: "600",
  },
  todoDeadline: {
    ...Typography.caption,
    marginTop: Spacing.xs,
    color: Colors.textMuted,
  },
  rowActions: {
    ...Layout.row,
    gap: Spacing.sm,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
  },
  stopwatchIcon: {
    fontSize: 18,
    color: Colors.primary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: Radius.sm,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
  },
  checkboxInner: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: Colors.white,
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
  paginationRow: {
    ...Layout.rowBetween,
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  arrowButton: {
    ...Btn.outline,
    minWidth: 0,
    width: 56,
    paddingVertical: 10,
    paddingHorizontal: 0,
  },
  disabledButton: {
    opacity: 0.4,
  },
  arrowLabel: {
    ...Btn.outlineText,
    fontSize: 24,
    lineHeight: 28,
  },
  pageLabel: {
    ...Typography.subtitle,
    flex: 1,
    textAlign: "center",
  },
  modalCard: {
    ...ModalStyle.container,
    width: "88%",
    maxWidth: 380,
  },
  selectionButton: {
    ...Card.base,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
  },
  selectionValue: {
    ...Typography.body,
  },
  calendarWrap: {
    marginTop: Spacing.sm,
    borderRadius: Radius.md,
    overflow: "hidden",
    backgroundColor: Colors.white,
  },
  timeRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  timeColumn: {
    flex: 1,
  },
  timeLabel: {
    ...Typography.caption,
    marginBottom: Spacing.xs,
  },
  timeList: {
    maxHeight: 180,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
  },
  timeOption: {
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  timeOptionSelected: {
    backgroundColor: Colors.primaryLight,
  },
  timeOptionText: {
    ...Typography.body,
    textAlign: "center",
  },
  timeOptionTextSelected: {
    color: Colors.primaryDark,
    fontWeight: "700",
  },
  modalButtonRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  secondaryButton: {
    ...Btn.outline,
    minWidth: 0,
    flex: 1,
  },
  primaryButton: {
    ...Btn.primary,
    minWidth: 0,
    flex: 1,
  },
  modalGapSmall: {
    height: Spacing.xs,
  },
  modalGapMedium: {
    height: Spacing.md,
  },
  modalGapLarge: {
    height: Spacing.lg,
  },
});
