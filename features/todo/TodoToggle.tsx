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
        <Text style={[item.done && styles.done]}>
          {item.name}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  rowFront: {
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderColor: '#eee',
    padding: 16,
  },
  done: {
    textDecorationLine: 'line-through',
  },
});