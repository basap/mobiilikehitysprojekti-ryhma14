import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';
import TodoToggle from './TodoToggle';
import TodoInput from './TodoInput';
import { Item } from './TodoItem';

const STORAGE_KEY = 'TODO_LIST_ITEMS';

export default function StatsScreen() {
  const [items, setItems] = useState<Item[]>([]);

  //Load items
  useEffect(() => {
    (async () => {
      try {
        const json = await AsyncStorage.getItem(STORAGE_KEY);
        if (json) setItems(JSON.parse(json));
       } catch (e) {
        //todo error
       }
    })();
  }, []);
  //Save items
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (name: string) => {
    setItems(prev => [
      ...prev,
      { id: Date.now().toString(), name, done: false },
    ]);
  };

  const toggleItem = (id: string) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, done: !item.done } : item
      )
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Todo list</Text>
      <TodoInput onAdd={addItem}/>
      <SwipeListView
        data={items}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TodoToggle item={item} onToggle={toggleItem} />
        )}
        renderHiddenItem={() => <View style={styles.rowBack} />}
        rightOpenValue={-75}
        disableRightSwipe
        disableLeftSwipe
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  rowBack: {
    backgroundColor: '#ddd',
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 20,
  },
});