import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, FlatList, Pressable, Alert } from 'react-native';
import { Input, Spacing, Typography, Btn, Layout, Dropdown } from '../../style/styles';
import { Timer } from '../utils/Timer';

// TODO: replace with real data from storage
const savedActivities = ['Running', 'Reading', 'Cooking', 'Coding', 'Stretching'];

export default function StopwatchScreen() {
  const [display, setDisplay] = useState('00.00,00');
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [selected, setSelected] = useState('');

  const timerRef = useRef(new Timer((ms) => setDisplay(Timer.format(ms))));
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    return () => timerRef.current.destroy();
  }, []);

  const filtered = savedActivities.filter((a) =>
    a.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (activity: string) => {
    setSelected(activity);
    setQuery(activity);
    hideDropdown();
  };

  const toggleTimer = () => {
    if (isRunning) {
      timerRef.current.pause();
      setIsRunning(false);
    } else if (selected.length > 0) {
      timerRef.current.start();
      setIsRunning(true);
    } else {
      Alert.alert('Error', 'You must select an activity before starting timer!');
    }
  };

  const resetTimer = () => {
    timerRef.current.reset();
    setIsRunning(false);
    setSelected('');
    setQuery('');
  };

  const hideDropdown = () => {
    inputRef.current?.blur();
    setShowDropdown(false);
  };

  return (
    <Pressable onPress={hideDropdown} style={Layout.screen}>
      <View style={[Layout.center, { overflow: 'visible' }]}>
        <Text style={Typography.bigTitle}>Stopwatch</Text>

        <View style={{ height: Spacing.xl }} />

        <View style={[Dropdown.container, { width: '80%' }]}>
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
              setSelected('');
              setShowDropdown(true);
            }}
            onPressIn={() => setShowDropdown(true)}
          />

          {showDropdown && filtered.length > 0 && (
            <View style={Dropdown.list}>
              <FlatList
                data={filtered}
                keyExtractor={(item) => item}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={Dropdown.item}
                    onPress={() => handleSelect(item)}
                  >
                    <Text style={Dropdown.itemText}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>

        <View style={{ height: Spacing.lg, zIndex: 1 }} />

        <View style={{ zIndex: 1, alignItems: 'center' }}>
          <Text style={Typography.timer}>{display}</Text>

          <View style={{ height: Spacing.xl }} />

          <TouchableOpacity
            style={Btn.pill}
            activeOpacity={0.7}
            onPress={toggleTimer}
          >
            <Text style={Btn.pillText}>
              {isRunning ? 'Pause stopwatch' : 'Start stopwatch'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Pressable>
  );
}