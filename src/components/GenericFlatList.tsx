import React from 'react';
import { FlatList, FlatListProps, View, Text, StyleSheet } from 'react-native';

interface GenericFlatListProps<T> extends Omit<FlatListProps<T>, 'renderItem' | 'data'> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactElement;
  keyExtractor: (item: T, index: number) => string;
  emptyText?: string;
}

function GenericFlatList<T>({
  data,
  renderItem,
  keyExtractor,
  emptyText = 'Nothing here yet',
  ...restProps
}: GenericFlatListProps<T>) {
  return (
    <FlatList
      data={data}
      keyExtractor={keyExtractor}
      renderItem={({ item, index }) => renderItem(item, index)}
      ListEmptyComponent={
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>{emptyText}</Text>
        </View>
      }
      {...restProps}
    />
  );
}

const styles = StyleSheet.create({
  emptyWrap: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.4)',
  },
});

export default GenericFlatList;