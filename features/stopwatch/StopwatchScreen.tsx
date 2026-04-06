import React, { useState, useRef, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { firestore } from "../../firebase/config";
import { collection, getDocs } from "firebase/firestore";
import { Typography, Btn, Layout, Colors } from '../../style/styles';

export default function StopwatchScreen() {
  const navigation = useNavigation();
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const StartTimeRef = useRef<number>(0);
  const [activityTitles, setActivityTitles] = useState<string[]>([]);

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
    const fetchTitles = async () => {
      try {
        const snapshot = await getDocs(collection(firestore, "activities"));
        const titles = snapshot.docs.map(doc => doc.data().title as string);
        setActivityTitles([...new Set(titles)]);
      } catch (error) {
        console.error("Error fetching titles:", error);
      }
    };
    fetchTitles();
  }, []);

  return (
    <View style={Layout.center}>
      <TouchableOpacity
        style={styles.homeButton}
        onPress={() => navigation.navigate("Home" as never)}
        activeOpacity={0.7}
      >
        <Text style={Btn.outlineText}>Home</Text>
      </TouchableOpacity>

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
  );
}

const styles = StyleSheet.create({
  homeButton: {
    ...Btn.outline,
    minWidth: 0,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 24,
  },
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
});
