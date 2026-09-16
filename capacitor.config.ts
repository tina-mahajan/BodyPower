import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bodypowergym.app',
  appName: 'BodyPower Gym',
  webDir: 'dist',
  server: {
    url: 'https://bodypower-gym-pwa.netlify.app',
    cleartext: false,
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    backgroundColor: '#09090E'
  }
};

export default config;
