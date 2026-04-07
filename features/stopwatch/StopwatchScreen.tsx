import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { firestore } from "../../firebase/config";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { Typography, Btn, Layout, Colors, Input, Dropdown } from '../../style/styles';

export default function StopwatchScreen() {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const StartTimeRef = useRef<number>(0);
  const [activityTitles, setActivityTitles] = useState<string[]>([]);
  const [title, setTitle] = useState("");
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
    if (intervalRef.current) clearInterval(intervalRef.current);
    const startTime = Date.now() - elapsedMs;
    StartTimeRef.current = startTime;
    await AsyncStorage.setItem("startTime", String(startTime));
    await AsyncStorage.setItem("isRunning", "true");
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
    setTitle("");
    setSaved(false);
    setShowList(false);
    await AsyncStorage.removeItem("startTime");
    await AsyncStorage.removeItem("elapsedMs");
    await AsyncStorage.setItem("isRunning", "false");
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    try {
      await addDoc(collection(firestore, "activities"), {
        title: title.trim(),
        durationMs: elapsedMs,
        createdAt: new Date(),
      });
      fetchTitles();
      setSaveMessage("✓ Saved!");
      setTimeout(() => setSaveMessage(""), 2000);
      handleReset();
    } catch (error) {
      console.error("Saving failed:", error);
      setSaveMessage("✗ Saving failed");
      setTimeout(() => setSaveMessage(""), 2000);
    }
  };

const fetchTitles = async () => {
    try {
      const snapshot = await getDocs(collection(firestore, "activities"));
      const titles = snapshot.docs.map(doc => doc.data().title as string);
      const uniqueTitles = [...new Set(titles)];

      const sortedTitles = uniqueTitles.sort((a, b) => 
        a.localeCompare(b, undefined, { sensitivity: 'base' })
      );

      setActivityTitles(sortedTitles);
    } catch (error) {
      console.error("Error fetching titles:", error);
    }
  };

  useEffect(() => {
    const restoreTimer = async () => {
      const savedStartTime = await AsyncStorage.getItem("startTime");
      const savedIsRunning = await AsyncStorage.getItem("isRunning");
      if (savedIsRunning === "true" && savedStartTime !== null) {
        const startTime = Number(savedStartTime);
        StartTimeRef.current = startTime;
        intervalRef.current = setInterval(() => {
          setElapsedMs(Date.now() - StartTimeRef.current);
        }, 10);
        setIsRunning(true);
      } else if (savedIsRunning === "false") {
        const savedElapsed = await AsyncStorage.getItem("elapsedMs");
        if (savedElapsed !== null) setElapsedMs(Number(savedElapsed));
      }
    };
    restoreTimer();
  }, []);

  useEffect(() => {
    fetchTitles();
  }, []);

  return (
    <View style={Layout.screen}>
      {!isRunning && (
        <View style={styles.activitySection}>
          <Text style={styles.label}>Activity title</Text>

          <TextInput
            style={Input.field}
            placeholder="Write a new activity title"
            placeholderTextColor={Colors.textMuted}
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              setSaved(false);
            }}
          />

          {}
          {showList && (
            <FlatList
              data={activityTitles}
              keyExtractor={(item) => item}
              style={[Dropdown.list, { maxHeight: 140 }]} 
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={Dropdown.item}
                  onPress={() => {
                    setTitle(item);
                    setShowList(false);
                    setSaved(false);
                  }}
                >
                  <Text style={Dropdown.itemText}>{item}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={Dropdown.empty}>
                  <Text style={Dropdown.emptyText}>Ei tallennettuja aktiviteetteja</Text>
                </View>
              }
            />
          )}

          {!isRunning && elapsedMs > 0 && (
          <TouchableOpacity
            style={[Btn.primary, styles.saveBtn, (!title.trim() || saved) && styles.disabled]}
            onPress={handleSave}
            disabled={!title.trim() || saved}
          >
            <Text style={Btn.primaryText}>
              {saved ? "✓ Saved" : "Save activity"}
            </Text>
          </TouchableOpacity>
        )}
          <TouchableOpacity
            style={styles.listToggle}
            onPress={() => setShowList(!showList)}
          >
            <Text style={styles.listToggleText}>
              {showList ? "▲ Hide the list" : "▼ Choose an existing title"}
            </Text>
          </TouchableOpacity>


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
            style={[Btn.outline, styles.btnSmall, isRunning && styles.disabled]}
            onPress={handleStart}
            disabled={isRunning}
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
    paddingVertical: 8,
    marginBottom: 20,
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
});