import React, { useEffect, useMemo, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BarChart } from "react-native-chart-kit";
import { useAuth } from "../../contexts/AuthContext";
import { Btn, Card, Colors, Dropdown, Layout, ModalStyle, Spacing, Typography } from "../../style/styles";
import { Item } from "../todo/TodoItem";
import { ensureTodoListDocument, subscribeToTodos } from "../todo/todoStore";
import { RangeValue, buildAllTimeBars, buildDayBars, buildMonthBars, filterEntriesByRange, formatMinutes, rangeOptions, } from "./statsUtils";

const screenWidth = Dimensions.get("window").width;

export default function StatsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [items, setItems] = useState<Item[]>([]);
  const [range, setRange] = useState<RangeValue>("week");
  const [showRangeMenu, setShowRangeMenu] = useState(false);
  const [showTaskMenu, setShowTaskMenu] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState("");

  useEffect(() => {
    if (!user?.uid) {
      setItems([]);
      return;
    }

    ensureTodoListDocument(user.uid).catch(console.log);

    const unsubscribe = subscribeToTodos(user.uid, (nextItems) => {
      setItems(nextItems.filter((item) => !item.isArchived));
    });

    return unsubscribe;
  }, [user?.uid]);

  useEffect(() => {
    if (!items.some((item) => item.id === selectedTaskId)) {
      setSelectedTaskId(items[0]?.id ?? "");
    }
  }, [items, selectedTaskId]);

  const selectedTask = items.find((item) => item.id === selectedTaskId) ?? null;

  const selectedRangeLabel =
    rangeOptions.find((option) => option.value === range)?.label ?? "Week";

  const chartBars = useMemo(() => {
    if (!selectedTask) return [];

    const now = new Date();
    const entries = filterEntriesByRange(selectedTask.timeSpentEntries, range, now);

    switch (range) {
      case "day":
        return buildDayBars(entries, 1, now);
      case "week":
        return buildDayBars(entries, 7, now);
      case "month":
        return buildDayBars(entries, 30, now);
      case "year":
        return buildMonthBars(entries, 12, now);
      case "all":
        return buildAllTimeBars(entries);
    }
  }, [range, selectedTask]);

  const totalDuration = chartBars.reduce((sum, bar) => sum + bar.durationMs, 0);

  const chartData = {
    labels: chartBars.map((b, i) =>
      i % 1 === 0 ? b.label : ""
    ),
    datasets: [
      {
        data: chartBars.map((b) => Math.round(b.durationMs / 60000)),
      },
    ],
  };

  const chartWidth = Math.max(
    screenWidth - 32,
    chartBars.length * 60
  );

  const closeMenus = () => {
    setShowRangeMenu(false);
    setShowTaskMenu(false);
  };

  return (
    <View style={Layout.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={Typography.screenTitle}>Statistics</Text>

        <View style={styles.controls}>
          <View style={styles.dropdownWrap}>
            <Pressable
              onPress={() => {
                setShowRangeMenu(true);
                setShowTaskMenu(false);
              }}
              style={styles.dropdownButton}
            >
              <Text style={styles.dropdownLabel}>Range</Text>
              <Text style={styles.dropdownValue}>{selectedRangeLabel}</Text>
            </Pressable>
          </View>

          <View style={styles.dropdownWrap}>
            <Pressable
              onPress={() => {
                setShowTaskMenu(true);
                setShowRangeMenu(false);
              }}
              style={styles.dropdownButton}
            >
              <Text style={styles.dropdownLabel}>Task</Text>
              <Text style={styles.dropdownValue}>
                {selectedTask?.name ?? "Choose task"}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.chartCard}>
          {selectedTask ? (
            <>
              <Text style={styles.chartTitle}>{selectedTask.name}</Text>
              <Text style={styles.totalTimeLabel}>
                Time spent: {formatMinutes(totalDuration)}
              </Text>

              {chartBars.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator>
                  <BarChart
                    data={chartData}
                    width={chartWidth}
                    height={260}
                    yAxisLabel=""
                    yAxisSuffix="m"
                    chartConfig={{
                      backgroundGradientFrom: "#fff",
                      backgroundGradientTo: "#fff",
                      decimalPlaces: 0,
                      color: (opacity = 1) =>
                        `rgba(76, 175, 80, ${opacity})`,
                      labelColor: () => Colors.text,
                      propsForBackgroundLines: {
                        stroke: Colors.borderLight,
                      },
                    }}
                  />
                </ScrollView>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={Typography.body}>
                    No saved time for this range.
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={Typography.body}>
                Choose a task to see statistics.
              </Text>
            </View>
          )}
        </View>

        <Pressable onPress={() => navigation.navigate("AllTaskStats" as never)} style={styles.allTasksButton}>
          <Text style={Btn.outlineText}>All tasks</Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={showRangeMenu}
        transparent
        animationType="fade"
        onRequestClose={closeMenus}
      >
        <TouchableOpacity style={ModalStyle.backdrop} activeOpacity={1} onPress={closeMenus}>
          <TouchableOpacity activeOpacity={1} style={styles.modalCard}>
            <Text style={Typography.pageHeading}>Select Range</Text>
            <View style={styles.modalGap} />
            <ScrollView style={styles.modalList} nestedScrollEnabled>
              {rangeOptions.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    setRange(option.value);
                    setShowRangeMenu(false);
                  }}
                  style={[
                    Dropdown.item,
                    option.value === range && Dropdown.highlightedItem,
                  ]}
                >
                  <Text
                    style={[
                      Dropdown.itemText,
                      option.value === range && Dropdown.highlightedText,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showTaskMenu}
        transparent
        animationType="fade"
        onRequestClose={closeMenus}
      >
        <TouchableOpacity style={ModalStyle.backdrop} activeOpacity={1} onPress={closeMenus}>
          <TouchableOpacity activeOpacity={1} style={styles.modalCard}>
            <Text style={Typography.pageHeading}>Select Task</Text>
            <View style={styles.modalGap} />
            <ScrollView style={styles.modalList} nestedScrollEnabled>
              {items.length > 0 ? (
                items.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      setSelectedTaskId(item.id);
                      setShowTaskMenu(false);
                    }}
                    style={[
                      Dropdown.item,
                      item.id === selectedTaskId && Dropdown.highlightedItem,
                    ]}
                  >
                    <Text
                      style={[
                        Dropdown.itemText,
                        item.id === selectedTaskId && Dropdown.highlightedText,
                      ]}
                    >
                      {item.name}
                    </Text>
                  </Pressable>
                ))
              ) : (
                <View style={Dropdown.empty}>
                  <Text style={Dropdown.emptyText}>No tasks found.</Text>
                </View>
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  controls: {
    gap: Spacing.md,
  },
  dropdownWrap: {
    ...Dropdown.container,
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
  chartCard: {
    ...Card.base,
  },
  chartTitle: {
    ...Typography.sectionHeading,
    marginBottom: Spacing.xs,
  },
  totalTimeLabel: {
    ...Typography.subtitle,
    marginBottom: Spacing.md,
  },
  emptyState: {
    minHeight: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  allTasksButton: {
    ...Btn.outline,
    width: "100%",
  },
  modalCard: {
    ...ModalStyle.container,
    width: "88%",
    maxWidth: 380,
    maxHeight: "70%",
    paddingVertical: Spacing.md,
  },
  modalGap: {
    height: Spacing.sm,
  },
  modalList: {
    maxHeight: 320,
  },
});
