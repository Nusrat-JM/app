// trip/TripIntroScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const APP_DARK = '#0f172a';

export default function TripIntroScreen({ navigation }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <ImageBackground
        source={require('../assets/images/trip_intro.jpg')}
        style={styles.bg}
        resizeMode="cover"
      >
        {/* soft bottom gradient so text is readable */}
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.6)']}
          style={StyleSheet.absoluteFill}
        />

        {/* Text block */}
        <View style={styles.textWrap}>
          <Text style={styles.title}>Find Your New{'\n'}Travel Places</Text>
          <Text style={styles.sub}>
            Start your next adventure with a simple plan. Discover routes that
            combine flights, rail, buses and rides—tailored to you.
          </Text>
        </View>

        {/* Next button */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.nextBtn}
          onPress={() => navigation.navigate('TripWelcome')}
        >
          <Ionicons name="arrow-forward" size={22} color="#fff" />
        </TouchableOpacity>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, justifyContent: 'flex-end' },
  textWrap: {
    paddingHorizontal: 18,
    paddingBottom: 90, // leaves space for the button
  },
  title: {
    color: '#fff',
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '900',
  },
  sub: {
    color: 'rgba(255,255,255,0.9)',
    marginTop: 10,
    fontSize: 14,
  },
  nextBtn: {
    position: 'absolute',
    right: 18,
    bottom: 26,
    width: 58,
    height: 58,
    borderRadius: 999,
    backgroundColor: APP_DARK,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
});
