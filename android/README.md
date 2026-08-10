# BlueMates Android (migration placeholder)

Reserved for the future Android client. The recommended migration path is React Native/Expo so UI logic and translations can be shared with iOS while authentication continues through the web service JSON API.

Do not store passwords or session tokens in plain application storage. The native client should use Android Keystore-backed secure storage and a future token endpoint designed for mobile clients; the current web session uses an HTTP-only browser cookie.
