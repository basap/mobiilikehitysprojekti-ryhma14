import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../contexts/AuthContext";
import { Typography, Btn, Layout, Colors, Dropdown } from "../../style/styles";
import { Item } from "../todo/TodoItem";
import { addTimeSpentToTodo, ensureTodoListDocument, subscribeToTodos } from "../todo/todoStore";

const STORAGE_SELECTED_TASK_ID = "stopwatchSelectedTaskId";
const STORAGE_SELECTED_TASK_NAME = "stopwatchSelectedTaskName";

export default function StopwatchScreen() {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const StartTimeRef = useRef<number>(0);
  const [tasks, setTasks] = useState<Item[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [selectedTaskName, setSelectedTaskName] = useState("");
  const [showList, setShowList] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}`;
  };

  const handleStart = async () => {
    if (!selectedTaskId) {
      return;
    }

    if (intervalRef.current) clearInterval(intervalRef.current);
    const startTime = Date.now() - elapsedMs;
    StartTimeRef.current = startTime;
    await AsyncStorage.setItem("startTime", String(startTime));
    await AsyncStorage.setItem("isRunning", "true");
    await AsyncStorage.setItem(STORAGE_SELECTED_TASK_ID, selectedTaskId);
    await AsyncStorage.setItem(STORAGE_SELECTED_TASK_NAME, selectedTaskName);
    intervalRef.current = setInterval(() => {
      setElapsedMs(Date.now() - StartTimeRef.current);
    }, 10);
    setIsRunning(true);
    setShowList(false);
  };

  const handleStop = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    await AsyncStorage.setItem("isRunning", "false");
    await AsyncStorage.setItem("elapsedMs", String(elapsedMs));
  };

  const handleReset = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setElapsedMs(0);
    setSaved(false);
    setShowList(false);
    setSelectedTaskId("");
    setSelectedTaskName("");
    await AsyncStorage.removeItem("startTime");
    await AsyncStorage.removeItem("elapsedMs");
    await AsyncStorage.setItem("isRunning", "false");
    await AsyncStorage.removeItem(STORAGE_SELECTED_TASK_ID);
    await AsyncStorage.removeItem(STORAGE_SELECTED_TASK_NAME);
  };

  const handleSave = async () => {
    if (!user?.uid || !selectedTaskId || elapsedMs <= 0) {
      return;
    }

    try {
      await addTimeSpentToTodo(user.uid, selectedTaskId, elapsedMs);
      setSaveMessage("âœ“ Saved!");
      setTimeout(() => setSaveMessage(""), 2000);
      handleReset();
    } catch (error) {
      console.error("Saving failed:", error);
      setSaveMessage("âœ— Saving failed");
      setTimeout(() => setSaveMessage(""), 2000);
    }
  };

  useEffect(() => {
    const restoreTimer = async () => {
      const savedStartTime = await AsyncStorage.getItem("startTime");
      const savedIsRunning = await AsyncStorage.getItem("isRunning");
      const savedElapsed = await AsyncStorage.getItem("elapsedMs");
      const savedTaskId = await AsyncStorage.getItem(STORAGE_SELECTED_TASK_ID);
      const savedTaskName = await AsyncStorage.getItem(STORAGE_SELECTED_TASK_NAME);

      if (savedTaskId) {
        setSelectedTaskId(savedTaskId);
      }

      if (savedTaskName) {
        setSelectedTaskName(savedTaskName);
      }

      if (savedIsRunning === "true" && savedStartTime !== null) {
        const startTime = Number(savedStartTime);
        StartTimeRef.current = startTime;
        intervalRef.current = setInterval(() => {
          setElapsedMs(Date.now() - StartTimeRef.current);
        }, 10);
        setIsRunning(true);
      } else if (savedElapsed !== null) {
        setElapsedMs(Number(savedElapsed));
      }
    };

    restoreTimer();
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      setTasks([]);
      return;
    }

    ensureTodoListDocument(user.uid).catch((error) => {
      console.log("Create todo list error:", error);
    });

    const unsubscribe = subscribeToTodos(user.uid, (items) => {
      const nextTasks = items.filter((item) => !item.isArchived);
      setTasks(nextTasks);

      if (selectedTaskId && !nextTasks.some((item) => item.id === selectedTaskId)) {
        setSelectedTaskId("");
        setSelectedTaskName("");
      }
    });

    return unsubscribe;
  }, [selectedTaskId, user?.uid]);

  return (
    <View style={Layout.screen}>
      {!isRunning && (
        <View style={styles.activitySection}>
          <Text style={styles.label}>Task</Text>

          <TouchableOpacity
            style={styles.listToggle}
            onPress={() => setShowList(!showList)}
            activeOpacity={0.7}
          >
            <Text style={styles.listToggleText}>
              {selectedTaskName
                ? showList
                  ? "Hide task list"
                  : selectedTaskName
                : showList
                  ? "Hide task list"
                  : "Choose a task"}
            </Text>
          </TouchableOpacity>

          {showList && (
            <FlatList
              data={tasks}
              keyExtractor={(item) => item.id}
              style={[Dropdown.list, { maxHeight: 180 }]}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={Dropdown.item}
                  onPress={() => {
                    setSelectedTaskId(item.id);
                    setSelectedTaskName(item.name);
                    setShowList(false);
                    setSaved(false);
                  }}
                >
                  <Text style={Dropdown.itemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={Dropdown.empty}>
                  <Text style={Dropdown.emptyText}>No active tasks available</Text>
                </View>
              }
            />
          )}

          {!isRunning && elapsedMs > 0 && !showList && (
            <TouchableOpacity
              style={[Btn.primary, styles.saveBtn, (!selectedTaskId || saved) && styles.disabled]}
              onPress={handleSave}
              disabled={!selectedTaskId || saved}
            >
              <Text style={Btn.primaryText}>
                {saved ? "âœ“ Saved" : "Save time to task"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.clockSection}>
        {saveMessage ? (
          <Text style={styles.saveMessage}>{saveMessage}</Text>
        ) : selectedTaskName ? (
          <Text style={styles.activeTitle}>{selectedTaskName}</Text>
        ) : (
          <Text style={styles.activeTitleEmpty}>No task chosen</Text>
        )}

        <Text style={Typography.timer}>{formatTime(elapsedMs)}</Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[Btn.outline, styles.btnSmall, (isRunning || !selectedTaskId) && styles.disabled]}
            onPress={handleStart}
            disabled={isRunning || !selectedTaskId}
          >
            <Text style={Btn.outlineText}>Start</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[Btn.primary, styles.btnSmall, !isRunning && styles.disabled]}
            onPress={handleStop}
            disabled={!isRunning}
          >
            <Text style={Btn.primaryText}>Stop</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[Btn.outline, styles.btnSmall]} onPress={handleReset}>
            <Text style={Btn.outlineText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  disabled: {
    opacity: 0.4,
  },
  btnSmall: {
    minWidth: 0,
    paddingHorizontal: 20,
  },
  activitySection: {
    width: "100%",
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.primary,
    marginBottom: 2,
  },
  listToggle: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    marginBottom: 8,
  },
  listToggleText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "500",
  },
  saveBtn: {
    marginTop: 8,
    minWidth: 0,
    width: "100%",
  },
  clockSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 50,
  },
  activeTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  activeTitleEmpty: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 8,
    fontStyle: "italic",
  },
  saveMessage: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
    marginBottom: 8,
  },
});
