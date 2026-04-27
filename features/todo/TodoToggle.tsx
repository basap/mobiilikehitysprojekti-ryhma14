import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { Item } from './TodoItem'

interface Props {
  item: Item;
  onToggle: (id: string) => void;
}

export default function TodoToggle({ item, onToggle }: Props) {
  return (
    <Pressable onPress={() => onToggle(item.id)}>
      <View style={styles.rowFront}>
        <Text style={[styles.text, item.isDone && styles.textDone]}>
          {item.name}
        </Text>
        {item.deadline && (
          <Text style={styles.date}>
            {new Date(item.deadline).toDateString()}
          </Text>
        )}
        <View style={[styles.checkbox, item.isDone && styles.checked]}>
          {item.isDone && <View style={styles.inner} />}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  date: {
    fontSize: 12,
    color: '#888',
  },
  rowFront: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderColor: '#eee',
    padding: 16,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#333',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  checked: {
    backgroundColor: '#333',
  },

  inner: {
    width: 10,
    height: 10,
    backgroundColor: '#fff',
  },

  text: {
    flex: 1,
    marginRight: 12,
  },

  textDone: {
    opacity: 0.5,
  },
});
