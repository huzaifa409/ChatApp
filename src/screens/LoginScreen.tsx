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

type LoginScreenProps = StackScreenProps<RootStackParamList, 'Login'>;

const webNoOutline =
  Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {};

type LoginMethod = 'xid' | 'name';

const API_BASE_URL = 'http://192.168.0.158:3000';

// Formats raw digits into "123 345 321" style for display
const formatXid = (digits: string) => {
  return digits.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
};

function LoginScreen({ navigation }: LoginScreenProps): React.JSX.Element {
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('xid');

  const [name, setName] = useState('');
  const [xid, setXid] = useState('');
  const [pin, setPin] = useState('');

  const [identifierFocused, setIdentifierFocused] = useState(false);
  const [pinFocused, setPinFocused] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleLoginMethod = () => {
    setLoginMethod((prev) => (prev === 'xid' ? 'name' : 'xid'));
  };

  const handleLogin = async () => {
    const identifier = loginMethod === 'name' ? name.trim() : xid.trim();

    if (!identifier || !pin.trim()) {
      Alert.alert(
        'Missing info',
        `Please enter your ${loginMethod === 'name' ? 'username' : 'XID'} and PIN.`
      );
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, pin }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Login failed', data.error || 'Something went wrong.');
        return;
      }

      navigation.navigate('Home', { user: data.user });

    } catch (err) {
      console.error('Login request error:', err);
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

          <Text style={styles.title}>Login</Text>
          <Text style={styles.subtitle}>
            {loginMethod === 'xid'
              ? 'Login with your 9-digit XID'
              : 'Login with your Username'}
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {loginMethod === 'xid' ? 'XID' : 'Username'}
            </Text>
            <View
              style={[
                styles.inputWrapper,
                identifierFocused && styles.inputWrapperFocused,
              ]}
            >
              <Icon
                name={loginMethod === 'xid' ? 'hash' : 'user'}
                size={18}
                color={identifierFocused ? '#6C3CE9' : '#9a94ab'}
                style={styles.inputIcon}
              />
              {loginMethod === 'xid' ? (
                <TextInput
                  style={[styles.input, webNoOutline]}
                  // placeholder="Enter your 9-digit XID"
                  placeholderTextColor="#a3a3ad"
                  value={formatXid(xid)}
                  onChangeText={(text) => {
                    const rawDigits = text.replace(/[^0-9]/g, '').slice(0, 9);
                    setXid(rawDigits);
                  }}
                  onFocus={() => setIdentifierFocused(true)}
                  onBlur={() => setIdentifierFocused(false)}
                  keyboardType="numeric"
                  maxLength={11}
                  underlineColorAndroid="transparent"
                  selectionColor="#6C3CE9"
                  cursorColor="#6C3CE9"
                  editable={!loading}
                  {...({ enableFocusRing: false } as any)}
                />
              ) : (
                <TextInput
                  style={[styles.input, webNoOutline]}
                  // placeholder="Enter your username"
                  placeholderTextColor="#a3a3ad"
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setIdentifierFocused(true)}
                  onBlur={() => setIdentifierFocused(false)}
                  underlineColorAndroid="transparent"
                  selectionColor="#6C3CE9"
                  cursorColor="#6C3CE9"
                  editable={!loading}
                  {...({ enableFocusRing: false } as any)}
                />
              )}
            </View>

            <TouchableOpacity
              onPress={toggleLoginMethod}
              activeOpacity={0.7}
              style={styles.switchLinkRow}
              disabled={loading}
            >
              <Text style={styles.switchLinkText}>
                {loginMethod === 'xid' ? 'Username' : 'XID'}
              </Text>
            </TouchableOpacity>
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
                style={[styles.input, webNoOutline]}
                // placeholder="Enter your PIN"
                placeholderTextColor="#a3a3ad"
                value={pin}
                onChangeText={setPin}
                onFocus={() => setPinFocused(true)}
                onBlur={() => setPinFocused(false)}
                secureTextEntry={!showPin}
                keyboardType="numeric"
                maxLength={4}
                autoComplete="off"
                textContentType="oneTimeCode"
                importantForAutofill="no"
                selectionColor="#6C3CE9"
                cursorColor="#6C3CE9"
                editable={!loading}
                {...({ enableFocusRing: false } as any)}
              />
              <TouchableOpacity
                onPress={() => setShowPin((prev) => !prev)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon
                  name={showPin ? 'eye-off' : 'eye'}
                  size={18}
                  color="#9a94ab"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Text style={styles.buttonText}>Login</Text>
                <Icon
                  name="arrow-right"
                  size={17}
                  color="#ffffff"
                  style={styles.buttonIcon}
                />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.7}
            style={styles.registerLinkRow}
            disabled={loading}
          >
            <Text style={styles.registerLinkText}>
              Don't have an account?{' '}
              <Text style={styles.registerLinkAccent}>Register</Text>
            </Text>
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
    marginBottom: 4,
    paddingLeft:8,
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
  switchLinkRow: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  switchLinkText: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '800',
    textDecorationLine: 'underline',

  },
  button: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#6C3CE9',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
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
  registerLinkRow: {
    marginTop: 20,
  },
  registerLinkText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  registerLinkAccent: {
    color: '#ffffff',
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;