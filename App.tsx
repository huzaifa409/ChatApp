import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RegisterScreen from './src/screens/RegisterScreen';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import { SocketProvider } from './src/socket/SocketContext';
import { initLocalDB } from './src/database/LocalDatabase';   

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: { user: { name: string; xid: string } };
};

const Stack = createStackNavigator<RootStackParamList>();

type InitialRoute = 'Login' | 'Register' | 'Home';

function App(): React.JSX.Element {
  const [initialRoute, setInitialRoute] = useState<InitialRoute | null>(null);
  const [initialUser, setInitialUser] = useState<{ name: string; xid: string } | null>(null);

  useEffect(() => {
  const checkAuthState = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        await initLocalDB(parsedUser.xid);
        setInitialUser(parsedUser);
        setInitialRoute('Home');
        return;
      }

      const hasUsedApp = await AsyncStorage.getItem('hasUsedApp');
      if (hasUsedApp === 'true') {
        setInitialRoute('Login');
      } else {
        setInitialRoute('Register');
      }
    } catch (err) {
      console.error('Error checking auth state:', err);
      setInitialRoute('Register');
    }
  };

  checkAuthState();
}, []);



  // Show a simple loading spinner while we check AsyncStorage
  if (!initialRoute) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C3CE9" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
         <Stack.Screen
            name="Home"
            initialParams={initialUser ? { user: initialUser } : undefined}
          >
            {(props) => (
              <SocketProvider xid={props.route.params.user.xid}>
                <HomeScreen {...props} />
              </SocketProvider>
            )}
          </Stack.Screen>
          
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#14103a',
  },
});

export default App;