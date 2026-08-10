# BlueMates iOS 1.0.0

Application React Native/Expo connectée à l'API de production BlueMates. Le jeton mobile est conservé dans le trousseau iOS via `expo-secure-store`.

## Développement

```bash
npm ci
npm start
```

Pour utiliser une API locale, définir `EXPO_PUBLIC_API_URL` avant de démarrer Expo.

## IPA / AltStore

Le workflow `.github/workflows/ios-build.yml` génère une IPA non signée. AltStore la signe avec l'Apple ID de l'utilisateur lors du sideload. La source AltStore et l'IPA sont publiées dans la release GitHub stable `ios-latest`.

Une installation avec un Apple ID gratuit expire après sept jours et doit être rafraîchie par AltServer. Un compte développeur Apple payant allonge cette durée.
