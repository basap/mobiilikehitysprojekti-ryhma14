import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Btn, Card, Colors, Input, ModalStyle, Radius, Spacing, Typography } from "../../style/styles";

interface Props {
  onAdd: (text: string, date: Date) => void;
}

const hours = Array.from({ length: 24 }, (_, index) => index);
const minutes = Array.from({ length: 60 }, (_, index) => index);

function padNumber(value: number) {
  return String(value).padStart(2, "0");
}

export default function TodoInput({ onAdd }: Props) {
  const [value, setValue] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedHour, setSelectedHour] = useState(new Date().getHours());
  const [selectedMinute, setSelectedMinute] = useState(new Date().getMinutes());
  const [showPicker, setShowPicker] = useState(false);

  const formattedDate = useMemo(
    () =>
      selectedDate.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [selectedDate]
  );

  const resetFields = () => {
    const now = new Date();
    setValue("");
    setSelectedDate(now);
    setSelectedHour(now.getHours());
    setSelectedMinute(now.getMinutes());
    setShowPicker(false);
  };

  const handleClose = () => {
    resetFields();
    setModalVisible(false);
  };

  const handleAdd = () => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return;
    }

    const deadline = new Date(selectedDate);
    deadline.setHours(selectedHour, selectedMinute, 0, 0);

    onAdd(trimmedValue, deadline);
    handleClose();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setModalVisible(true)}
        style={styles.openButton}
      >
        <Text style={Btn.primaryText}>Add todo</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={handleClose}>
        <TouchableOpacity style={ModalStyle.backdrop} activeOpacity={1} onPress={handleClose}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <TouchableOpacity activeOpacity={1} style={styles.modalCard}>
              <Text style={Typography.pageHeading}>Add Todo</Text>
              <View style={styles.gapSmall} />
              <Text style={Typography.subtitle}>Choose a name and deadline for your task.</Text>
              <View style={styles.gapLarge} />

              <Text style={Typography.inputLabel}>Todo name</Text>
              <TextInput
                autoFocus
                style={Input.field}
                value={value}
                onChangeText={setValue}
                placeholder="Write your todo name"
                placeholderTextColor={Colors.textMuted}
              />

              <View style={styles.gapMedium} />
              <Text style={Typography.inputLabel}>Deadline day</Text>
              <Pressable onPress={() => setShowPicker((current) => !current)} style={styles.selectionButton}>
                <Text style={styles.selectionValue}>{formattedDate}</Text>
              </Pressable>

              {showPicker ? (
                <View style={styles.calendarWrap}>
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "inline" : "calendar"}
                    themeVariant="light"
                    onChange={(_, nextDate) => {
                      if (nextDate) {
                        setSelectedDate(nextDate);
                        setShowPicker(false);
                      }
                      if (!nextDate) {
                        setShowPicker(false);
                      }
                    }}
                  />
                </View>
              ) : null}

              <View style={styles.gapMedium} />
              <Text style={Typography.inputLabel}>Deadline time</Text>
              <View style={styles.timeRow}>
                <View style={styles.timeColumn}>
                  <Text style={styles.timeLabel}>Hour</Text>
                  <ScrollView style={styles.timeList} nestedScrollEnabled>
                    {hours.map((hour) => (
                      <Pressable
                        key={hour}
                        onPress={() => setSelectedHour(hour)}
                        style={[
                          styles.timeOption,
                          selectedHour === hour ? styles.timeOptionSelected : null,
                        ]}
                      >
                        <Text
                          style={[
                            styles.timeOptionText,
                            selectedHour === hour ? styles.timeOptionTextSelected : null,
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
                        onPress={() => setSelectedMinute(minute)}
                        style={[
                          styles.timeOption,
                          selectedMinute === minute ? styles.timeOptionSelected : null,
                        ]}
                      >
                        <Text
                          style={[
                            styles.timeOptionText,
                            selectedMinute === minute ? styles.timeOptionTextSelected : null,
                          ]}
                        >
                          {padNumber(minute)}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <View style={styles.gapLarge} />
              <View style={styles.buttonRow}>
                <TouchableOpacity activeOpacity={0.7} onPress={handleClose} style={styles.secondaryButton}>
                  <Text style={Btn.outlineText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  disabled={!value.trim()}
                  onPress={handleAdd}
                  style={[styles.primaryButton, !value.trim() ? styles.disabledButton : null]}
                >
                  <Text style={Btn.primaryText}>Add</Text>
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
  container: {
    width: "100%",
    marginTop: Spacing.lg,
  },
  openButton: {
    ...Btn.primary,
    minWidth: 0,
    width: "100%",
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
  buttonRow: {
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
  disabledButton: {
    opacity: 0.5,
  },
  gapSmall: {
    height: Spacing.xs,
  },
  gapMedium: {
    height: Spacing.md,
  },
  gapLarge: {
    height: Spacing.lg,
  },
});
