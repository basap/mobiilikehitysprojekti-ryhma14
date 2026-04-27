import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../contexts/AuthContext";
import { firestore } from "../../firebase/config";
import { collection, query, where, doc, getDoc, setDoc, getDocs } from "firebase/firestore";
import { Typography, Btn, Layout, Colors, Dropdown, Input } from "../../style/styles";
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
  const [customHistory, setCustomHistory] = useState<any[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [title, setTitle] = useState("");
  
  const [showList, setShowList] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}`;
  };

  const formatDurationSimple = (ms: number) => {
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
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

  const handleStart = async () => {
    if (!title.trim()) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    const startTime = Date.now() - elapsedMs;
    StartTimeRef.current = startTime;
    
    await AsyncStorage.setItem("startTime", String(startTime));
    await AsyncStorage.setItem("isRunning", "true");
    await AsyncStorage.setItem(STORAGE_SELECTED_TASK_ID, selectedTaskId);
    await AsyncStorage.setItem(STORAGE_SELECTED_TASK_NAME, title);
    
    intervalRef.current = setInterval(() => {
      setElapsedMs(Date.now() - StartTimeRef.current);
    }, 10);
    setIsRunning(true);
    setShowList(false);
    setShowHistory(false);
  };

  const handleStop = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    await AsyncStorage.setItem("isRunning", "false");
    await AsyncStorage.setItem("elapsedMs", String(elapsedMs));
  };

  const performReset = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setElapsedMs(0);
    setTitle("");
    setSelectedTaskId("");
    setSaved(false);
    setShowList(false);
    setShowHistory(false);
    await AsyncStorage.removeItem("startTime");
    await AsyncStorage.removeItem("elapsedMs");
    await AsyncStorage.setItem("isRunning", "false");
    await AsyncStorage.removeItem(STORAGE_SELECTED_TASK_ID);
    await AsyncStorage.removeItem(STORAGE_SELECTED_TASK_NAME);
  };

  const handleReset = () => {
    if (elapsedMs > 0 || isRunning) {
      Alert.alert(
        "Reset Timer",
        "Are you sure you want to reset? Unsaved time will be lost.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Reset", style: "destructive", onPress: performReset }
        ]
      );
    } else {
      performReset();
    }
  };

  const handleSave = async () => {
    const cleanTitle = title.trim();
    if (!cleanTitle || elapsedMs <= 0 || !user?.uid) return;

    try {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];

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
        
        let items = [];
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
            lastUpdatedAt: now.toISOString()
          };
        } else {
          items.push({
            id: Date.now().toString(),
            title: cleanTitle,
            durationMs: elapsedMs,
            timeSpentEntries: [newTimeEntry],
            createdAt: now.toISOString(),
            lastUpdatedAt: now.toISOString()
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
      const savedStartTime = await AsyncStorage.getItem("startTime");
      const savedIsRunning = await AsyncStorage.getItem("isRunning");
      const savedElapsed = await AsyncStorage.getItem("elapsedMs");
      const savedTaskId = await AsyncStorage.getItem(STORAGE_SELECTED_TASK_ID);
      const savedTaskName = await AsyncStorage.getItem(STORAGE_SELECTED_TASK_NAME);

      if (savedTaskId) setSelectedTaskId(savedTaskId);
      if (savedTaskName) setTitle(savedTaskName);

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
            <TouchableOpacity onPress={() => { setShowList(!showList); setShowHistory(false); }}>
              <Text style={styles.listToggleText}>{showList ? "▲ Hide Todo" : "▼ Todo List"}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => { setShowHistory(!showHistory); setShowList(false); }}>
              <Text style={styles.listToggleText}>{showHistory ? "▲ Hide Custom Activities" : "▼ Custom Activities"}</Text>
            </TouchableOpacity>
          </View>

          {(showList || showHistory) && (
            <FlatList
              data={showList ? tasks : customHistory}
              keyExtractor={(item) => item.id}
              style={[Dropdown.list, { maxHeight: 250 }]}
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
                    style={[Dropdown.item, { borderTopWidth: 1, borderTopColor: Colors.border, alignItems: 'center' }]} 
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

        <Text style={Typography.timer}>{formatTime(elapsedMs)}</Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[Btn.outline, styles.btnSmall, (isRunning || !title.trim()) && styles.disabled]}
            onPress={handleStart}
            disabled={isRunning || !title.trim()}
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
  toggleRow: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
  },
  durationText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '400',
  },
});