import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SwipeListView } from 'react-native-swipe-list-view';
import TodoToggle from './TodoToggle';
import TodoInput from './TodoInput';
import { Item } from './TodoItem';
import { Btn, Colors } from '../../style/styles';
import { firestore, auth } from "../../firebase/config";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";


const STORAGE_KEY = 'TODO_LIST_ITEMS';

export default function StatsScreen() {
  const navigation = useNavigation();
  const [items, setItems] = useState<Item[]>([]);
  const [loaded, setLoaded] = useState(false);
  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  //Load items
  useEffect(() => {
    const load = async () => {
      const user = auth.currentUser;

      try {
	      if (user?.isAnonymous) {	//guest
          const json = await AsyncStorage.getItem(STORAGE_KEY);
          if (json) {
            setItems(JSON.parse(json));
          }
	      } else if (user) { 		    //logged in
          const docRef = doc(firestore, "users", user.uid, "todos", "list");
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data?.items) {
              setItems(data.items);
            }
          }
        }
      } catch (e) {
        console.log("Failed to load todos", e);
      } finally {
        setLoaded(true);
      }
    };

    load();
  }, []);

  //Save items
  useEffect(() => {
    if (!loaded) return;
    const timeout = setTimeout(() => {
      handleSave(items);
    }, 500);
    return () => clearTimeout(timeout);
  }, [items, loaded]);
  //Add item
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
  //Toggle item
  const toggleItem = (id: string) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, done: !item.done } : item
      )
    );
  };
  //async saving
  async function handleSave(itemsToSave: Item[]) {
    const user = auth.currentUser;
    if (user?.isAnonymous || !user) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(itemsToSave));
      return;
    }
    try {
      const docRef = doc(firestore, "users", user.uid, "todos", "list");
      await setDoc(docRef, {
        items: itemsToSave,
        updatedAt: serverTimestamp(),
      });
      console.log("Todos saved successfully!");
    } catch (err) {
      console.error("Failed to save todos", err);
    }
  }
  //Edit Item
  const editItem = (id: string, name: string, date: Date) => {
  setItems(prev =>
    prev.map(item =>
      item.id === id
        ? { ...item, name, date: date.toISOString() }
        : item
    )
  );
};


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Todo list</Text>
      </View>
      <TodoInput 
        onAdd={addItem}
        onEdit={editItem}
        editingItem={editingItem}
        clearEditing={() => setEditingItem(null)}
      />
      <SwipeListView
        data={items}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TodoToggle 
            item={item} 
            onToggle={toggleItem} 
            onEdit={(item) => setEditingItem(item)}
          />
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
