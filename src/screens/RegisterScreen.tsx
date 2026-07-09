import React, { useState } from 'react';
import {
  SafeAreaView,
  ImageBackground,
  Image,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';

const webNoOutline =
  Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {};

const API_BASE_URL = 'http://192.168.0.215:3000';

type RegisterScreenProps = StackScreenProps<RootStackParamList, 'Register'>;

function RegisterScreen({ navigation }: RegisterScreenProps): React.JSX.Element {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [nameFocused, setNameFocused] = useState(false);
  const [pinFocused, setPinFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !pin.trim()) {
      Alert.alert('Missing info', 'Please enter both name and PIN.');
      return;
    }
    if (pin.length < 4) {
      Alert.alert('Invalid PIN', 'PIN must be at least 4 digits.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), pin }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Registration failed', data.error || 'Something went wrong.');
        return;
      }

      
      navigation.navigate('RegisterSuccess', { name: name.trim(), xid: data.xid });

      

      setName('');
      setPin('');

    } catch (err) {
      console.error('Register request error:', err);
      Alert.alert(
        'Connection error',
        'Could not reach the server. Make sure your phone and Mac are on the same WiFi, and the server is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../Assets/Splash-Background.webp')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <View style={styles.logoBadge}>
            <Image
              source={require('../../Assets/Logo.jpg')}
              style={styles.logoImage}
              resizeMode="cover"
            />
          </View>

          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Register with your name and a secure PIN
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <View
              style={[
                styles.inputWrapper,
                nameFocused && styles.inputWrapperFocused,
              ]}
            >
              <Icon
                name="user"
                size={18}
                color={nameFocused ? '#6C3CE9' : '#9a94ab'}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, webNoOutline]}
                // placeholder="Enter your name"
                placeholderTextColor="#a3a3ad"
                value={name}
                onChangeText={setName}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
                underlineColorAndroid="transparent"
                selectionColor="#6C3CE9"
                cursorColor="#6C3CE9"
                editable={!loading}
                {...({ enableFocusRing: false } as any)}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>PIN</Text>
            <View
              style={[
                styles.inputWrapper,
                pinFocused && styles.inputWrapperFocused,
              ]}
            >
              <Icon
                name="lock"
                size={18}
                color={pinFocused ? '#6C3CE9' : '#9a94ab'}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, styles.pinInput, webNoOutline]}
                // placeholder="Enter your 4-digit PIN"
                placeholderTextColor="#a3a3ad"
                value={pin}
                onChangeText={setPin}
                onFocus={() => setPinFocused(true)}
                onBlur={() => setPinFocused(false)}
                secureTextEntry
                keyboardType="numeric"
                maxLength={4}
                selectionColor="#6C3CE9"
                cursorColor="#6C3CE9"
                autoComplete="off"
                textContentType="oneTimeCode"
                editable={!loading}
                {...({ enableFocusRing: false } as any)}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={handleRegister}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Text style={styles.buttonText}>Register</Text>
                <Icon
                  name="arrow-right"
                  size={17}
                  color="#ffffff"
                  style={styles.buttonIcon}
                />
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  logoBadge: {
    width: 78,
    height: 78,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 18,
    backgroundColor: '#0e0e14',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 13.5,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    marginBottom: 26,
    lineHeight: 19,
  },
  inputGroup: {
    width: '100%',
    marginBottom: 18,
  },
  label: {
    fontSize: 12.5,
    color: '#ffffff',
    marginBottom: 7,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  inputWrapperFocused: {
    borderColor: '#ffffff',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? 13 : 11,
    fontSize: 14.5,
    color: '#ffffff',
  },
  pinInput: {
    letterSpacing: 6,
  },
  button: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#6C3CE9',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    shadowColor: '#6C3CE9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  buttonIcon: {
    marginLeft: 8,
  },
});

export default RegisterScreen;