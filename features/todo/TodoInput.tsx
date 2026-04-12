import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Modal, Text } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Props {
  onAdd: (text: string, date: Date) => void;
}

export default function TodoInput({ onAdd }: Props) {
  const [value, setValue] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const add = () => {
    if (!value.trim()) return;
    onAdd(value.trim(), date);
    setValue('');
    setDate(new Date());
    setModalVisible(!modalVisible)
  };

  return (
    <View style={styles.container}>
      <Modal
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={setValue}
                placeholder="Give todo title"
              />
              <View style={styles.dateView}>
                <Button title="Pick last Date" onPress={() => setShowPicker(true)} />
                <Text style={styles.datePicker}>
                  {date.toDateString()} 
                </Text>
                {showPicker && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      if (selectedDate) {
                        setDate(selectedDate);
                      }
                      setShowPicker(false)
                    }}
                  />
                )}
              </View>
              <View style={styles.buttonRow}>
                <Button title="Add" onPress={add} />
                <Button title="Close" onPress={() => setModalVisible(!modalVisible)} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
      <Button title="Add Todo" onPress={() => setModalVisible(true)} />
    </View>
  );
}

const styles = StyleSheet.create({
  dateView: {
    marginTop: 16
  },
  datePicker: {
    marginTop: 8
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    marginRight: 8,
  },
});