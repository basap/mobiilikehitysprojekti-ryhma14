import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';
import TodoToggle from './TodoToggle';
import TodoInput from './TodoInput';
import { Item } from './TodoItem';

const STORAGE_KEY = 'TODO_LIST_ITEMS';

export default function StatsScreen() {
  const [items, setItems] = useState<Item[]>([]);
  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

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

  const addItem = (name: string, date: Date) => {
    setItems(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        name,
        done: false,
        date: date.toISOString(),
      },
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
        renderHiddenItem={({ item }) => (
          <View style={styles.rowBack}>
            <Pressable
              onPress={() => deleteItem(item.id)} >
              <Text style={styles.deleteText}>Delete</Text>
            </Pressable>
          </View>
        )}
        rightOpenValue={-75}
        disableRightSwipe
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
    backgroundColor: 'red',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 20,
  },
  deleteText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});