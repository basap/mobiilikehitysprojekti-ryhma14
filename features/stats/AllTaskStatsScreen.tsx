import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, Dimensions } from "react-native";
import { PieChart } from "react-native-chart-kit";
import { useAuth } from "../../contexts/AuthContext";
import { Btn, Card, Colors, Dropdown, Layout, Spacing, Typography, Radius } from "../../style/styles";
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
        <Text>All tasks</Text>

        <View style={styles.dropdownWrap}>
          <Pressable onPress={() => setShowRangeMenu((prev) => !prev)} style={styles.dropdownButton}>
            <Text style={styles.dropdownLabel}>Range</Text>
            <Text style={styles.dropdownValue}>{selectedRangeLabel}</Text>
          </Pressable>

          {showRangeMenu && (
            <View style={Dropdown.list}>
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
            </View>
          )}
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
            <View>
              <Text>
                No saved time for this range.
              </Text>
            </View>
          )}
        </View>

        <View>
          {slices.map((slice, index) => (
            <View key={slice.id}>
              <View>
                <View style={styles.legendTask}>
                  <View style={[ styles.legendColor, { backgroundColor: slice.color }, ]} />
                  <Text>{slice.name} {slice.percentage.toFixed(1)}% {formatMinutes(slice.durationMs)}</Text>
                </View>
              </View>

              {index < slices.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
      </ScrollView>
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
  chartCard: {
    ...Card.base,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 280,
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
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: Spacing.md,
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
  }
});
