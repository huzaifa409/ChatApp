import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

export type AttachmentType = 'picture' | 'video' | 'document';

interface HeaderProps {
  title: string;
  onSelectOption: (type: AttachmentType) => void;
}

const Header: React.FC<HeaderProps> = ({ title, onSelectOption }) => {
  const [menuVisible, setMenuVisible] = useState(false);

  const handleSelect = (type: AttachmentType) => {
    setMenuVisible(false);
    onSelectOption(type);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>{title}</Text>

        <TouchableOpacity
          style={styles.plusButton}
          onPress={() => setMenuVisible(!menuVisible)}
        >
          <Icon name="plus" size={18} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {menuVisible && (
        <View style={styles.dropdown}>
          <Pressable style={styles.dropdownItemRow} onPress={() => handleSelect('picture')}>
            <Icon name="image" size={16} color="#0c0c45" />
            <Text style={styles.dropdownText}>Images</Text>
          </Pressable>
          <View style={styles.divider} />
          <Pressable style={styles.dropdownItemRow} onPress={() => handleSelect('video')}>
            <Icon name="video" size={16} color="#0c0c45" />
            <Text style={styles.dropdownText}>Videos</Text>
          </Pressable>
          <View style={styles.divider} />
          <Pressable style={styles.dropdownItemRow} onPress={() => handleSelect('document')}>
            <Icon name="file-text" size={16} color="#0c0c45" />
            <Text style={styles.dropdownText}>Documents</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    zIndex: 1000,
  },
 headerContainer: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
   backgroundColor: 'transparent', 
  overflow: 'hidden',
  borderBottomWidth:0.5,
  borderColor:"rgb(18, 14, 42)"
    
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  plusButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdown: {
    position: 'absolute',
    top: 56,
    right: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingVertical: 4,
    width: 170,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    zIndex: 1000,
  },
  dropdownItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  dropdownText: {
    fontSize: 14,
    color: '#0c0c45',
  },
  divider: {
    height: 1,
    backgroundColor: '#eeeeee',
    marginHorizontal: 8,
  },
});

export default Header;