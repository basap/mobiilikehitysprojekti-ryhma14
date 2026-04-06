import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, TouchableOpacity, TextInput, FlatList, Pressable } from 'react-native';
import { Input, Spacing, Typography, Btn, Layout, Dropdown } from '../../style/styles';
import { Timer } from '../utils/Timer';

// TODO: replace with real data from storage
const savedTimers = [
  { label: 'Quick break', seconds: 300 },
  { label: 'Pomodoro',    seconds: 900 },
  { label: 'Stretch',     seconds: 30 },
];

const formatCountdown = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export default function TimerScreen() {
  const navigation = useNavigation();
  const [durationMs, setDurationMs] = useState(0);
  const [display, setDisplay] = useState('00:00');
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const timerRef = useRef<Timer | null>(null);
  const inputRef = useRef<TextInput>(null);

  const buildTimer = useCallback((totalMs: number) => {
    timerRef.current?.destroy();

    timerRef.current = new Timer((elapsed) => {
      const remaining = totalMs - elapsed;
      if (remaining <= 0) {
        timerRef.current?.pause();
        setDisplay('00:00');
        setIsRunning(false);
        setIsFinished(true);
        return;
      }
      setDisplay(formatCountdown(remaining));
    }, 100);
  }, []);

  useEffect(() => {
    return () => timerRef.current?.destroy();
  }, []);

  const filtered = savedTimers.filter((t) =>
    t.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (timer: (typeof savedTimers)[number]) => {
    setQuery(timer.label);
    setShowDropdown(false);
    setIsFinished(false);

    const ms = timer.seconds * 1000;
    setDurationMs(ms);
    setDisplay(formatCountdown(ms));
    buildTimer(ms);
    hideDropdown();
  };

  const toggleTimer = () => {
    if (!timerRef.current || durationMs === 0) return;

    if (isRunning) {
      timerRef.current.pause();
    } else {
      timerRef.current.start();
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    timerRef.current?.destroy();
    timerRef.current = null;
    setDurationMs(0);
    setDisplay('00:00');
    setQuery('');
    setIsRunning(false);
    setIsFinished(false);
  };

  const hideDropdown = () => {
    inputRef.current?.blur();
    setShowDropdown(false);
  };

  return (
    <Pressable onPress={hideDropdown} style={Layout.screen}>
      <View style={[Layout.center, { overflow: 'visible' }]}>
        <TouchableOpacity
          style={[Btn.outline, { minWidth: 0, paddingVertical: 10, paddingHorizontal: 16, marginBottom: Spacing.lg }]}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Home' as never)}
        >
          <Text style={Btn.outlineText}>Home</Text>
        </TouchableOpacity>

        <Text style={Typography.bigTitle}>Timer</Text>

        <View style={{ height: Spacing.sm, zIndex: 1 }} />

        <View style={[Dropdown.container, { zIndex: 10 }]}>
          <TextInput
            ref={inputRef}
            style={[
              Input.field,
              showDropdown && filtered.length > 0 && {
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
              },
            ]}
            placeholder="Pick activity name for timer"
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              setShowDropdown(text.length > 0);
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          />

          {showDropdown && filtered.length > 0 && (
            <View style={[Dropdown.list, { zIndex: 20, elevation: 5 }]}>
              <FlatList
                data={filtered}
                keyExtractor={(item) => item.label}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={Dropdown.item}
                    onPress={() => handleSelect(item)}
                  >
                    <View style={Layout.rowBetween}>
                      <Text style={Dropdown.itemText}>{item.label}</Text>
                      <Text style={Typography.caption}>
                        {formatCountdown(item.seconds * 1000)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>

        <View style={{ height: Spacing.lg, zIndex: 1 }} />

        <View style={{ zIndex: 1 }}>
          <Text style={[Typography.timer, isFinished && { color: '#D32F2F' }]}>
            {display}
          </Text>

          {isFinished && (
            <Text style={[Typography.caption, { marginTop: Spacing.xs, textAlign: 'center' }]}>
              Time's up!
            </Text>
          )}
        </View>

        <View style={{ height: Spacing.xl, zIndex: 1 }} />

        <View style={{ zIndex: 1, alignItems: 'center' }}>
          <TouchableOpacity
            style={[Btn.pill, durationMs === 0 && { opacity: 0.4 }]}
            activeOpacity={0.7}
            onPress={toggleTimer}
            disabled={durationMs === 0}
          >
            <Text style={Btn.pillText}>
              {isRunning ? 'Pause timer' : 'Start timer'}
            </Text>
          </TouchableOpacity>

          {(isFinished || (!isRunning && durationMs > 0)) && (
            <>
              <View style={{ height: Spacing.sm }} />
              <TouchableOpacity style={Btn.pill} activeOpacity={0.7} onPress={resetTimer}>
                <Text style={Btn.pillText}>New timer</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Pressable>
  );
}
