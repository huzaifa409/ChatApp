import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

interface WelcomeCardProps {
  userName: string;
  xid: string;
  formattedXid: string;
  onCopyXid: () => void;
}

const WelcomeCard: React.FC<WelcomeCardProps> = ({ userName, formattedXid, onCopyXid }) => {
  return (
    <View style={styles.welcomeCard}>
      <View style={styles.headingRow}>
        <Text style={styles.heading}>Welcome to</Text>
        <Image
          source={require('../../Assets/xpalLogoBasic.png')}
          style={styles.headingLogoImage}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.subheading}>{userName}, this is your account overview.</Text>

      <View style={styles.xidBlock}>
        <Text style={styles.xidLabel}>Your XID</Text>
        <View style={styles.xidRow}>
          <Text style={styles.xidValue}>{formattedXid}</Text>
          <TouchableOpacity
            onPress={onCopyXid}
            style={styles.copyButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Icon name="copy" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.xidHint}>Keep this safe — you'll need it to log in.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  welcomeCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 48,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 30,
    elevation: 10,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  headingLogoImage: { width: 42, height: 42, marginLeft: 8 },
  subheading: {
    fontSize: 13.5,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 36,
  },
  xidBlock: {
    width: '100%',
    maxWidth: 480,
    paddingVertical: 26,
    alignItems: 'center',
  },
  xidLabel: {
    fontSize: 18.5,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  xidRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  xidValue: {
    fontSize: 46,
    fontWeight: '500',
    color: '#ffffff',
    letterSpacing: 3,
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  copyButton: { marginBottom: 10, padding: 4 },
  xidHint: {
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});

export default WelcomeCard;