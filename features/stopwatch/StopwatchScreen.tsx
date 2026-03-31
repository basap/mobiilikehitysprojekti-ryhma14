import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import AsyncStorage from  "@react-native-async-storage/async-storage";
import { firestore } from "../../firebase/config";
import { collection, getDocs } from "firebase/firestore";

export default function StopwatchScreen() {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const StartTimeRef = useRef<number>(0);
  const [activityTitles, setActivityTitles] = useState<string[]>([]);
  const [title, setTitle] = useState("");

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);

    const pad = (n: number) => String(n).padStart(2, "0");

    return `${pad(minutes)}:${pad(seconds)}.${pad (centiseconds)}`
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
    await AsyncStorage.removeItem("startTime");
    await AsyncStorage.removeItem("elapsedMs"); 
    await AsyncStorage.setItem("isRunning", "false");
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
        }, 10)
        setIsRunning(true);
      } else if (savedIsRunning === "false") {
        const savedElapsed = await AsyncStorage.getItem("elapsedMs");
        if (savedElapsed !== null) {
          setElapsedMs(Number(savedElapsed));
        }
      }
    };
    restoreTimer();
  }, []);

  const fetchTitles = async () => {
  try {
    const snapshot = await getDocs(collection(firestore, "activities"));
    const titles = snapshot.docs.map(doc => doc.data().title as string);
    const uniqueTitles = [...new Set(titles)]; // removes duplicates
    setActivityTitles(uniqueTitles);
  } catch (error) {
    console.error("Error fetching titles:", error);
  }
};

useEffect(() => {
  fetchTitles();
}, []);

  return (
    <View style={styles.container}>
      <Text style={styles.stopwatch}>{formatTime(elapsedMs)}</Text>
    
      <View style={styles.buttonRow}>

        <TouchableOpacity style={[styles.button, isRunning && styles.buttonDisabled]} onPress={handleStart} disabled={isRunning}>
          <Text style={styles.buttonText}>Start</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, !isRunning && styles.buttonDisabled]} onPress={handleStop} disabled={!isRunning}>
          <Text style={styles.buttonText}>Stop</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleReset}>
          <Text style={styles.buttonText}>Reset</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
  },
  stopwatch: {
    fontSize: 48,
    fontWeight: "bold",
    marginBottom: 20,
    letterSpacing: 2,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    backgroundColor: "#333",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
  buttonDisabled: {
    backgroundColor: "#888",
  },
});