export default {
  expo: {
    name: "CarpoolConnect",
    slug: "carpool-connect",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "carpoolconnect",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    plugins: [
      "expo-router",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Allow CarpoolConnect to use your location."
        }
      ]
    ],
    android: {
      package: "com.carpoolconnect",
      googleServicesFile: "./google-services.json"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.carpoolconnect"
    },
    web: {
      bundler: "metro",
      output: "server",
      favicon: "./assets/images/favicon.png"
    },
    experiments: {
      typedRoutes: true
    }
  }
};