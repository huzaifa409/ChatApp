import React from 'react';
import {
  SafeAreaView,
  ImageBackground,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';

type RegisterSuccessScreenProps = StackScreenProps<RootStackParamList, 'RegisterSuccess'>;

// Formats raw digits into "123 345 321" style for display
const formatXid = (digits: string) => {
  return digits.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
};

function RegisterSuccessScreen({ route, navigation }: RegisterSuccessScreenProps): React.JSX.Element {
  const { name, xid } = route.params;

  return (
    <ImageBackground
      source={require('../../Assets/Splash-Background.webp')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <View style={styles.iconBadge}>
            <Icon name="check" size={32} color="#ffffff" />
          </View>

          <Text style={styles.heading}>Welcome to Messenger App</Text>
          <Text style={styles.subheading}>
            {name}, your account has been created successfully.
          </Text>

          <View style={styles.xidBlock}>
            <Text style={styles.xidLabel}>Your Unique XID</Text>
            <Text style={styles.xidValue}>{formatXid(xid)}</Text>
            <Text style={styles.xidHint}>
              Save this — you'll need it to log in.
            </Text>
          </View>

          {/* <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>Continue to Login</Text>
            <Icon name="arrow-right" size={17} color="#ffffff" style={styles.buttonIcon} />
          </TouchableOpacity>*/}
        </View> 

        
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
        //   onPress={() => {
            
        //   }}
        >
          <Icon name="plus" size={26} color="#ffffff" />
        </TouchableOpacity>
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
    padding: 8,
   marginVertical:150
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6C3CE9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
    shadowColor: '#6C3CE9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subheading: {
    fontSize: 13.5,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 36,
  },
  xidBlock: {
    width: '100%',
    
    backgroundColor:'transparent',
    paddingVertical: 26,
    alignItems: 'center',
    marginBottom: 36,
  },
  xidLabel: {
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  xidValue: {
  fontSize: 48,
  fontWeight: '800',
  color: '#ffffff',
  letterSpacing: 3,
  marginBottom: 10,
  textShadowColor: 'rgba(0,0,0,0.3)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 4,
},
  xidHint: {
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  button: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#6C3CE9',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C3CE9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
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
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 28,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#6C3CE9',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C3CE9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
});

export default RegisterSuccessScreen;