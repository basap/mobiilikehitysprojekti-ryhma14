import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../contexts/AuthContext";
import { firestore } from "../../firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Typography, Btn, Layout, Colors, Dropdown, Input, Spacing, Radius } from "../../style/styles";
import { Item } from "../todo/TodoItem";
import { addTimeSpentToTodo, ensureTodoListDocument, subscribeToTodos } from "../todo/todoStore";

const STORAGE_KEYS = {
  startTime: "timerStartTime",
  isRunning: "timerIsRunning",
  elapsedMs: "timerElapsedMs",
  durationMs: "timerDurationMs",
  selectedTaskId: "timerSelectedTaskId",
  selectedTaskName: "timerSelectedTaskName",
};

const PRESET_TIMERS = [
  { label: "Quick break", seconds: 300 },
  { label: "Pomodoro", seconds: 900 },
  { label: "Stretch", seconds: 30 },
];

export default function TimerScreen() {
  const { user } = useAuth();

  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const [tasks, setTasks] = useState<Item[]>([]);
  const [customHistory, setCustomHistory] = useState<any[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [title, setTitle] = useState("");

  const [showList, setShowList] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  const [customMinutes, setCustomMinutes] = useState("");
  const [customSeconds, setCustomSeconds] = useState("");

  const [saved, setSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const formatRemaining = (elapsed: number, total: number) => {
    const remaining = Math.max(0, total - elapsed);
    const totalSeconds = Math.ceil(remaining / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  const formatDurationSimple = (ms: number) => {
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const formatPresetDuration = (ms: number) => {
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs === 0 ? `${mins}min` : `${mins}min ${secs}s`;
  };

  const fetchCustomHistory = async () => {
    if (!user?.uid) return;
    try {
      const listDocRef = doc(firestore, "users", user.uid, "customactivities", "list");
      const docSnap = await getDoc(listDocRef);

      if (docSnap.exists()) {
        const allItems = docSnap.data().items || [];
        const sorted = [...allItems].sort((a: any, b: any) =>
          new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime()
        );
        setCustomHistory(sorted.slice(0, 20));
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  const startTicking = (totalDuration: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      if (elapsed >= totalDuration) {
        finishTimer(totalDuration);
      } else {
        setElapsedMs(elapsed);
      }
    }, 100);
  };

  const finishTimer = async (totalDuration: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setElapsedMs(totalDuration);
    setIsRunning(false);
    setIsFinished(true);
    await AsyncStorage.setItem(STORAGE_KEYS.isRunning, "false");
    await AsyncStorage.setItem(STORAGE_KEYS.elapsedMs, String(totalDuration));
  };

  const handleStart = async () => {
    if (!title.trim() || durationMs === 0 || elapsedMs >= durationMs) return;
    const startTime = Date.now() - elapsedMs;
    startTimeRef.current = startTime;

    await AsyncStorage.setItem(STORAGE_KEYS.startTime, String(startTime));
    await AsyncStorage.setItem(STORAGE_KEYS.isRunning, "true");
    await AsyncStorage.setItem(STORAGE_KEYS.durationMs, String(durationMs));
    await AsyncStorage.setItem(STORAGE_KEYS.selectedTaskId, selectedTaskId);
    await AsyncStorage.setItem(STORAGE_KEYS.selectedTaskName, title);

    setIsRunning(true);
    setIsFinished(false);
    setShowList(false);
    setShowHistory(false);
    setShowPresets(false);
    startTicking(durationMs);
  };

  const handlePause = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setIsRunning(false);
    await AsyncStorage.setItem(STORAGE_KEYS.isRunning, "false");
    await AsyncStorage.setItem(STORAGE_KEYS.elapsedMs, String(elapsedMs));
  };

  const performReset = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setIsRunning(false);
    setIsFinished(false);
    setElapsedMs(0);
    setDurationMs(0);
    setTitle("");
    setSelectedTaskId("");
    setSaved(false);
    setShowList(false);
    setShowHistory(false);
    setShowPresets(false);
    setCustomMinutes("");
    setCustomSeconds("");
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.startTime,
      STORAGE_KEYS.elapsedMs,
      STORAGE_KEYS.durationMs,
      STORAGE_KEYS.selectedTaskId,
      STORAGE_KEYS.selectedTaskName,
    ]);
    await AsyncStorage.setItem(STORAGE_KEYS.isRunning, "false");
  };

  const handleReset = () => {
    if (elapsedMs > 0 || isRunning) {
      Alert.alert(
        "Reset Timer",
        "Are you sure you want to reset? Unsaved time will be lost.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Reset", style: "destructive", onPress: performReset },
        ]
      );
    } else {
      performReset();
    }
  };

  const handleSelectPreset = (preset: typeof PRESET_TIMERS[number]) => {
    const ms = preset.seconds * 1000;
    setDurationMs(ms);
    setElapsedMs(0);
    setIsFinished(false);
    setShowPresets(false);
    setSaved(false);
    setCustomMinutes("");
    setCustomSeconds("");
    if (!title.trim()) {
      setTitle(preset.label);
    }
  };

  const handleSetCustom = () => {
    const mins = parseInt(customMinutes, 10) || 0;
    const secs = parseInt(customSeconds, 10) || 0;
    const totalMs = (mins * 60 + secs) * 1000;
    if (totalMs <= 0) return;

    setDurationMs(totalMs);
    setElapsedMs(0);
    setIsFinished(false);
    setShowPresets(false);
    setSaved(false);
  };

  const customDurationValid =
    (parseInt(customMinutes, 10) || 0) * 60 + (parseInt(customSeconds, 10) || 0) > 0;

  const handleSave = async () => {
    const cleanTitle = title.trim();
    if (!cleanTitle || elapsedMs <= 0 || !user?.uid) return;

    try {
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];

      const newTimeEntry = {
        date: dateStr,
        durationMs: elapsedMs,
        savedAt: now.toISOString(),
      };

      if (selectedTaskId) {
        await addTimeSpentToTodo(user.uid, selectedTaskId, elapsedMs);
      } else {
        const listDocRef = doc(firestore, "users", user.uid, "customactivities", "list");
        const listSnap = await getDoc(listDocRef);

        let items: any[] = [];
        if (listSnap.exists()) {
          items = listSnap.data().items || [];
        }

        const existingItemIndex = items.findIndex((item: any) =>
          (item.title || item.name || "").toLowerCase() === cleanTitle.toLowerCase()
        );

        if (existingItemIndex !== -1) {
          const existingItem = items[existingItemIndex];
          items[existingItemIndex] = {
            ...existingItem,
            title: cleanTitle,
            durationMs: (existingItem.durationMs || 0) + elapsedMs,
            timeSpentEntries: [...(existingItem.timeSpentEntries || []), newTimeEntry],
            lastUpdatedAt: now.toISOString(),
          };
        } else {
          items.push({
            id: Date.now().toString(),
            title: cleanTitle,
            durationMs: elapsedMs,
            timeSpentEntries: [newTimeEntry],
            createdAt: now.toISOString(),
            lastUpdatedAt: now.toISOString(),
          });
        }

        await setDoc(listDocRef, { items });
      }

      setSaveMessage("✓ Saved!");
      setSaved(true);
      setTimeout(() => setSaveMessage(""), 2000);
      fetchCustomHistory();
      performReset();
    } catch (error) {
      console.error("Saving failed:", error);
      setSaveMessage("✗ Saving failed");
      setTimeout(() => setSaveMessage(""), 2000);
    }
  };

  useEffect(() => {
    const restoreTimer = async () => {
      const [savedStartTime, savedIsRunning, savedElapsed, savedDuration, savedTaskId, savedTaskName] =
        await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.startTime),
          AsyncStorage.getItem(STORAGE_KEYS.isRunning),
          AsyncStorage.getItem(STORAGE_KEYS.elapsedMs),
          AsyncStorage.getItem(STORAGE_KEYS.durationMs),
          AsyncStorage.getItem(STORAGE_KEYS.selectedTaskId),
          AsyncStorage.getItem(STORAGE_KEYS.selectedTaskName),
        ]);

      if (savedTaskId) setSelectedTaskId(savedTaskId);
      if (savedTaskName) setTitle(savedTaskName);

      const duration = savedDuration !== null ? Number(savedDuration) : 0;
      if (duration > 0) setDurationMs(duration);

      if (savedIsRunning === "true" && savedStartTime !== null && duration > 0) {
        const startTime = Number(savedStartTime);
        startTimeRef.current = startTime;
        const elapsed = Date.now() - startTime;

        if (elapsed >= duration) {
          // Timer completed while the app was closed
          setElapsedMs(duration);
          setIsFinished(true);
          setIsRunning(false);
          await AsyncStorage.setItem(STORAGE_KEYS.isRunning, "false");
          await AsyncStorage.setItem(STORAGE_KEYS.elapsedMs, String(duration));
        } else {
          setElapsedMs(elapsed);
          setIsRunning(true);
          startTicking(duration);
        }
      } else if (savedElapsed !== null) {
        const elapsed = Number(savedElapsed);
        setElapsedMs(elapsed);
        if (duration > 0 && elapsed >= duration) setIsFinished(true);
      }
    };
    restoreTimer();
    fetchCustomHistory();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) {
      setTasks([]);
      return;
    }
    ensureTodoListDocument(user.uid).catch(console.error);
    const unsubscribe = subscribeToTodos(user.uid, (items) => {
      const nextTasks = items.filter((item) => !item.isArchived);
      setTasks(nextTasks);
    });
    return unsubscribe;
  }, [user?.uid]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <View style={Layout.screen}>
      {!isRunning && (
        <View style={styles.activitySection}>
          <Text style={styles.label}>Activity / Task</Text>

          <TextInput
            style={Input.field}
            placeholder="Write title or choose below"
            placeholderTextColor={Colors.textMuted}
            value={title}
            maxLength={40}
            onChangeText={(text) => {
              setTitle(text);
              setSelectedTaskId("");
              setSaved(false);
            }}
          />

          <View style={styles.toggleRow}>
            <TouchableOpacity onPress={() => { setShowList(!showList); setShowHistory(false); setShowPresets(false); }}>
              <Text style={styles.listToggleText}>{showList ? "▲ Hide Todo" : "▼ Todo List"}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setShowHistory(!showHistory); setShowList(false); setShowPresets(false); }}>
              <Text style={styles.listToggleText}>{showHistory ? "▲ Hide Custom Activities" : "▼ Custom Activities"}</Text>
            </TouchableOpacity>
          </View>

          {(showList || showHistory) && (
            <FlatList
              data={showList ? tasks : customHistory}
              keyExtractor={(item) => item.id}
              style={[Dropdown.list, { maxHeight: 250, position: "relative", top: 0 }]}
              renderItem={({ item }) => {
                const name = showList ? item.name : item.title;
                const duration = showList ? (item.timeSpentMs || 0) : (item.durationMs || 0);

                return (
                  <TouchableOpacity
                    style={Dropdown.item}
                    onPress={() => {
                      setTitle(name);
                      if (showList) setSelectedTaskId(item.id);
                      setShowList(false);
                      setShowHistory(false);
                      setSaved(false);
                    }}
                  >
                    <View style={styles.dropdownRow}>
                      <Text style={Dropdown.itemText}>{name}</Text>
                      <Text style={styles.durationText}>{formatDurationSimple(duration)}</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListFooterComponent={
                (showList ? tasks.length > 0 : customHistory.length > 0) ? (
                  <TouchableOpacity
                    style={[Dropdown.item, { borderTopWidth: 1, borderTopColor: Colors.border, alignItems: "center" }]}
                    onPress={() => { setShowList(false); setShowHistory(false); }}
                  >
                    <Text style={[styles.listToggleText, { fontSize: 12 }]}>▲ Close List</Text>
                  </TouchableOpacity>
                ) : null
              }
              ListEmptyComponent={
                <TouchableOpacity
                  style={Dropdown.empty}
                  onPress={() => { setShowList(false); setShowHistory(false); }}
                >
                  <Text style={Dropdown.emptyText}>
                    {showList ? "No active tasks found" : "No history yet"}
                  </Text>
                  <Text style={[styles.listToggleText, { fontSize: 12, marginTop: 4, opacity: 0.7 }]}>
                    Click to close
                  </Text>
                </TouchableOpacity>
              }
            />
          )}

          <Text style={[styles.label, { marginTop: 8 }]}>Timer length</Text>
          <TouchableOpacity
            style={[Input.field, styles.presetTrigger]}
            onPress={() => { setShowPresets(!showPresets); setShowList(false); setShowHistory(false); }}
          >
            <Text style={[Dropdown.itemText, durationMs === 0 && { color: Colors.textMuted }]}>
              {durationMs > 0 ? formatPresetDuration(durationMs) : "Pick timer length"}
            </Text>
            <Text style={styles.listToggleText}>{showPresets ? "▲" : "▼"}</Text>
          </TouchableOpacity>

          {showPresets && (
            <View style={[Dropdown.list, { position: "relative", top: 0 }]}>
              {PRESET_TIMERS.map((preset) => (
                <TouchableOpacity
                  key={preset.label}
                  style={Dropdown.item}
                  onPress={() => handleSelectPreset(preset)}
                >
                  <View style={styles.dropdownRow}>
                    <Text style={Dropdown.itemText}>{preset.label}</Text>
                    <Text style={styles.durationText}>{formatPresetDuration(preset.seconds * 1000)}</Text>
                  </View>
                </TouchableOpacity>
              ))}

              <View style={styles.customRow}>
                <Text style={styles.customLabel}>Custom</Text>
                <TextInput
                  style={styles.customInput}
                  keyboardType="number-pad"
                  maxLength={3}
                  value={customMinutes}
                  onChangeText={(text) => setCustomMinutes(text.replace(/[^0-9]/g, ""))}
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                />
                <Text style={styles.customUnit}>min</Text>
                <TextInput
                  style={styles.customInput}
                  keyboardType="number-pad"
                  maxLength={2}
                  value={customSeconds}
                  onChangeText={(text) => setCustomSeconds(text.replace(/[^0-9]/g, ""))}
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                />
                <Text style={styles.customUnit}>sec</Text>
                <TouchableOpacity
                  style={[styles.customSetBtn, !customDurationValid && styles.disabled]}
                  onPress={handleSetCustom}
                  disabled={!customDurationValid}
                >
                  <Text style={styles.customSetBtnText}>Set</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {!isRunning && elapsedMs > 0 && (
            <TouchableOpacity
              style={[Btn.primary, styles.saveBtn, (!title.trim() || saved) && styles.disabled]}
              onPress={handleSave}
              disabled={!title.trim() || saved}
            >
              <Text style={Btn.primaryText}>{saved ? "✓ Saved" : "Save activity"}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.clockSection}>
        {saveMessage ? (
          <Text style={styles.saveMessage}>{saveMessage}</Text>
        ) : title.trim() ? (
          <Text style={styles.activeTitle}>{title.trim()}</Text>
        ) : (
          <Text style={styles.activeTitleEmpty}>No title chosen</Text>
        )}

        <Text style={[Typography.timer, isFinished && { color: Colors.error }]}>
          {formatRemaining(elapsedMs, durationMs)}
        </Text>

        {isFinished && <Text style={styles.finishedText}>Time's up!</Text>}

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[Btn.outline, styles.btnSmall, (isRunning || !title.trim() || durationMs === 0 || isFinished) && styles.disabled]}
            onPress={handleStart}
            disabled={isRunning || !title.trim() || durationMs === 0 || isFinished}
          >
            <Text style={Btn.outlineText}>Start</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[Btn.primary, styles.btnSmall, !isRunning && styles.disabled]}
            onPress={handlePause}
            disabled={!isRunning}
          >
            <Text style={Btn.primaryText}>Pause</Text>
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
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    paddingHorizontal: 4,
  },
  listToggleText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "600",
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
  dropdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    alignItems: "center",
  },
  durationText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: "400",
  },
  presetTrigger: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  finishedText: {
    fontSize: 14,
    color: Colors.error,
    fontWeight: "600",
    marginTop: 6,
  },
  customRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 6,
  },
  customLabel: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: "500",
    marginRight: 4,
  },
  customInput: {
    width: 44,
    textAlign: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingVertical: 6,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.white,
  },
  customUnit: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  customSetBtn: {
    marginLeft: "auto",
    backgroundColor: Colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: Radius.sm,
  },
  customSetBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: "600",
  },
});
