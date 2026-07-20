import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface AvatarProps {
  name: string;
  size?: number;
}


const COLORS = ['#6C3CE9', '#9333EA', '#2563EB', '#DB2777', '#059669', '#D97706', '#DC2626'];

const getColorForName = (name: string) => {
  const charCodeSum = name
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return COLORS[charCodeSum % COLORS.length];
};

const Avatar: React.FC<AvatarProps> = ({ name, size = 44 }) => {
  const firstLetter = name.trim().charAt(0).toUpperCase() || '?';
  const backgroundColor = getColorForName(name);

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
      ]}
    >
      <Text style={[styles.letter, { fontSize: size * 0.42 }]}>{firstLetter}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    color: '#ffffff',
    fontWeight: '700',
  },
});

export default Avatar;