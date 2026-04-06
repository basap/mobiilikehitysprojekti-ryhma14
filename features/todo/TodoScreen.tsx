import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SwipeListView } from 'react-native-swipe-list-view';
import TodoToggle from './TodoToggle';
import TodoInput from './TodoInput';
import { Item } from './TodoItem';
import { Btn, Colors } from '../../style/styles';

const STORAGE_KEY = 'TODO_LIST_ITEMS';

export default function StatsScreen() {
  const navigation = useNavigation();
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
      <View style={styles.header}>
        <Text style={styles.title}>Todo list</Text>
        {/*
        <Pressable style={styles.homeButton} onPress={() => navigation.navigate('Home' as never)}>
          <Text style={Btn.outlineText}>Home</Text>
        </Pressable>
        */}
      </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  homeButton: {
    ...Btn.outline,
    minWidth: 0,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderColor: Colors.primary,
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
