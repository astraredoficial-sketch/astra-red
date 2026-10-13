import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.astrared.app",
  appName: "AstraRed",
  webDir: "android-web",
  server: {
    url: "https://astrared.vip",
    androidScheme: "https",
  },
  backgroundColor: "#080d1b",
};

export default config;
