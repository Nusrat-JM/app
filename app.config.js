// app.config.js
export default {
  expo: {
    name: "openapp",
    slug: "openapp",
    android: {
      "package": "com.anonymous.openapp",
      // added CAMERA + media permissions, kept your existing location perms
      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "CAMERA",
        // For Android 13+ scoped media:
        "READ_MEDIA_IMAGES",
        // Fallbacks for older Android versions:
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ],
      // (optional) if you later use Google Maps tiles or Places:
      // config: { googleMaps: { apiKey: "YOUR_ANDROID_GOOGLE_MAPS_API_KEY" } }
    },
    ios: {
      // kept your existing reason + added camera & photo library usage strings
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "We use your location to show pickup and route on the map.",
        NSCameraUsageDescription:
          "We use the camera to let you take a profile photo.",
        NSPhotoLibraryUsageDescription:
          "We access your photo library so you can choose a profile picture.",
        NSPhotoLibraryAddUsageDescription:
          "We need access to save edited profile photos to your library."
      }
    }
  }
};
