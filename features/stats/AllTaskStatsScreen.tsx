import React, { useEffect, useMemo, useState } from "react";
import { Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { PieChart } from "react-native-chart-kit";
import { useAuth } from "../../contexts/AuthContext";
import { Btn, Card, Colors, Dropdown, Layout, ModalStyle, Spacing, Typography, Radius } from "../../style/styles";
import { Item } from "../todo/TodoItem";
import { ensureTodoListDocument, subscribeToTodos } from "../todo/todoStore";
import { RangeValue, buildTaskTotals, formatMinutes, rangeOptions, } from "./statsUtils";

const screenWidth = Dimensions.get("window").width;

const PIE_COLORS = [
  "#4CAF50",
  "#2E7D32",
  "#81C784",
  "#FFB300",
  "#FF7043",
  "#29B6F6",
  "#7E57C2",
  "#EC407A",
];

export default function AllTaskStatsScreen() {
  const { user } = useAuth();

  const [items, setItems] = useState<Item[]>([]);
  const [range, setRange] = useState<RangeValue>("week");
  const [showRangeMenu, setShowRangeMenu] = useState(false);

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

  const selectedRangeLabel =
    rangeOptions.find((option) => option.value === range)?.label ?? "Week";

  const slices = useMemo(() => {
    const totals = buildTaskTotals(items, range, new Date());
    const totalDuration = totals.reduce((sum, item) => sum + item.durationMs, 0);

    return totals.map((item, index) => ({
      name: item.name,
      population: item.durationMs,
      color: PIE_COLORS[index % PIE_COLORS.length],
      legendFontColor: Colors.text,
      legendFontSize: 12,
      percentage:
        totalDuration > 0 ? (item.durationMs / totalDuration) * 100 : 0,
      durationMs: item.durationMs,
      id: item.id,
    }));
  }, [items, range]);

  const totalDuration = slices.reduce((sum, s) => sum + s.population, 0);

  return (
    <View style={Layout.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={Typography.screenTitle}>All tasks</Text>

        <View style={styles.dropdownWrap}>
          <Pressable onPress={() => setShowRangeMenu(true)} style={styles.dropdownButton}>
            <Text style={styles.dropdownLabel}>Range</Text>
            <Text style={styles.dropdownValue}>{selectedRangeLabel}</Text>
          </Pressable>
        </View>

        <View style={styles.chartCard}>
          {slices.length > 0 ? (
            <>
              <View style={styles.chartWrapper}>
                <PieChart
                  data={slices}
                  width={220}
                  height={220}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="55"
                  hasLegend={false}
                  chartConfig={{
                    color: () => Colors.text,
                  }}
                />
              </View>

              <View style={styles.totalContainer}>
                <Text style={Typography.caption}>Total</Text>
                <Text style={styles.totalValue}>
                  {formatMinutes(totalDuration)}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={Typography.body}>
                No saved time for this range.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.legendCard}>
          {slices.map((slice, index) => (
            <View key={slice.id}>
              <View style={styles.legendRow}>
                <View style={styles.legendTask}>
                  <View style={[ styles.legendColor, { backgroundColor: slice.color }, ]} />
                  <Text style={styles.legendName}>{slice.name}</Text>
                </View>

                <View style={styles.legendValues}>
                  <Text style={styles.legendPercent}>
                    {slice.percentage.toFixed(1)}%
                  </Text>
                  <Text style={styles.legendTime}>
                    {formatMinutes(slice.durationMs)}
                  </Text>
                </View>
              </View>

              {index < slices.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={showRangeMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRangeMenu(false)}
      >
        <TouchableOpacity
          style={ModalStyle.backdrop}
          activeOpacity={1}
          onPress={() => setShowRangeMenu(false)}
        >
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
  lastDropdownItem: {
    borderBottomWidth: 0,
  },
  chartCard: {
    ...Card.base,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 280,
  },
  donutBase: {
    alignItems: "center",
    justifyContent: "center",
  },
  segmentWrapper: {
    position: "absolute",
  },
  segment: {
    position: "absolute",
    width: 8,
    borderRadius: Radius.pill,
  },
  donutCenter: {
    width: 112,
    height: 112,
    borderRadius: Radius.pill,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  donutCenterLabel: {
    ...Typography.caption,
  },
  donutCenterValue: {
    ...Typography.body,
    fontWeight: "700",
    textAlign: "center",
    paddingHorizontal: Spacing.xs,
  },
  emptyDonut: {
    width: 112,
    height: 112,
    borderRadius: Radius.pill,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  legendCard: {
    ...Card.base,
    paddingVertical: 0,
    overflow: "hidden",
  },
  legendRow: {
    ...Layout.rowBetween,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  legendTask: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  legendColor: {
    width: 14,
    height: 14,
    borderRadius: Radius.pill,
  },
  legendName: {
    ...Typography.body,
    flex: 1,
  },
  legendValues: {
    alignItems: "flex-end",
  },
  legendPercent: {
    ...Typography.body,
    fontWeight: "700",
  },
  legendTime: {
    ...Typography.caption,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: Spacing.md,
  },
  emptyState: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  totalContainer: {
    alignItems: "center",
    marginTop: 8,
  },
  totalValue: {
    ...Typography.body,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 4,
  },
  chartWrapper: {
    alignItems: "center",
    width: "100%"
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
