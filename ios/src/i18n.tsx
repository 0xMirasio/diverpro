import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Locale } from "./types";

const strings = {
  en: {
    overview: "Overview", logbook: "Logbook", friends: "Friends", map: "Map", more: "More",
    planning: "Planning", reviews: "Site reviews", profile: "My profile", admin: "Administration",
    login: "Sign in", register: "Create account", email: "Email", password: "Password", firstName: "First name", lastName: "Last name", username: "Username", language: "Language", googleSoon: "Google sign-in — coming later", welcome: "Your diving life, everywhere.", memberId: "Member ID", usernameTaken: "This username is already taken.", emailTaken: "This email is already registered.", invalidCredentials: "Incorrect email or password.",
    dashboardTitle: "Ready for the next dive?", dashboardSub: "Your logbook, friends and future trips at a glance.", pending: "pending", completed: "dives", upcoming: "upcoming", world: "Your diving world",
    add: "Add", save: "Save", cancel: "Cancel", delete: "Delete", edit: "Edit", close: "Close", search: "Search", loading: "Loading…", empty: "Nothing here yet.", public: "Public", private: "Private", visibility: "Visibility", details: "Details", date: "Date", startDate: "Start date", endDate: "End date", site: "Dive site", depth: "Depth (m)", duration: "Duration (min)", groupCount: "Number of identical dives", photos: "Photos", choosePhotos: "Choose photos", location: "Location", useLocation: "Use my GPS", findPlace: "Search a site, city or address", selected: "Selected", error: "Something went wrong. Please try again.", created: "Saved.", confirmDelete: "Delete this item?",
    logbookTitle: "Digital logbook", logbookSub: "Keep every dive and memory in one place.", logbookVisibility: "Logbook visibility", noDives: "No dives logged yet.",
    planTitle: "Future dives", planSub: "Plan a dive and decide who can see it.", noPlans: "No future dives planned.",
    friendsTitle: "Dive connections", friendsSub: "Find divers by username or member ID.", requests: "Friend requests", myFriends: "My friends", sent: "Sent requests", accept: "Accept", decline: "Decline", connect: "Connect", remove: "Remove friend", viewProfile: "View profile", noFriends: "Your dive circle starts here.",
    mapTitle: "World map", mapSub: "Your dives, friend activity, dive sites and wrecks down to 60 m.", activity: "Activity", catalogue: "Sites & wrecks", wrecks: "Wrecks", sites: "Dive sites", tapMarker: "Tap a marker for details.",
    reviewTitle: "Site reviews", reviewSub: "Choose an existing site or register a precise location.", rating: "Rating", comment: "Review", publish: "Publish", siteName: "Site name", existingSite: "Existing site", nearby: "Nearby or similar sites", duplicate: "This site may already exist. Choose it or confirm creation.", createAnyway: "Create a new site anyway", noReviews: "You have not reviewed a site yet.",
    profileTitle: "Diver profile", profileSub: "Control your public identity and privacy.", birthDate: "Date of birth", bio: "Bio", avatar: "Profile photo", profileVisibility: "Profile visibility", defaultLanguage: "Default language", signOut: "Sign out", saved: "Profile updated.", hiddenProfile: "This diver keeps their profile private.", joined: "Joined", age: "years old",
    adminTitle: "Administration", users: "Users", changeLog: "Site change log", source: "Source", reviewCount: "reviews",
  },
  fr: {
    overview: "Aperçu", logbook: "Carnet", friends: "Amis", map: "Carte", more: "Plus",
    planning: "Planification", reviews: "Avis sites", profile: "Mon profil", admin: "Administration",
    login: "Se connecter", register: "Créer un compte", email: "E-mail", password: "Mot de passe", firstName: "Prénom", lastName: "Nom", username: "Pseudo", language: "Langue", googleSoon: "Connexion Google — bientôt disponible", welcome: "Votre vie de plongeur, partout.", memberId: "Identifiant membre", usernameTaken: "Ce pseudo est déjà utilisé.", emailTaken: "Cet e-mail est déjà utilisé.", invalidCredentials: "E-mail ou mot de passe incorrect.",
    dashboardTitle: "Prêt pour la prochaine plongée ?", dashboardSub: "Votre carnet, vos amis et vos voyages en un coup d’œil.", pending: "en attente", completed: "plongées", upcoming: "à venir", world: "Votre monde sous-marin",
    add: "Ajouter", save: "Enregistrer", cancel: "Annuler", delete: "Supprimer", edit: "Modifier", close: "Fermer", search: "Rechercher", loading: "Chargement…", empty: "Rien pour le moment.", public: "Public", private: "Privé", visibility: "Visibilité", details: "Détails", date: "Date", startDate: "Date de début", endDate: "Date de fin", site: "Site de plongée", depth: "Profondeur (m)", duration: "Durée (min)", groupCount: "Nombre de plongées identiques", photos: "Photos", choosePhotos: "Choisir des photos", location: "Localisation", useLocation: "Utiliser mon GPS", findPlace: "Rechercher un site, une ville ou une adresse", selected: "Sélectionné", error: "Une erreur est survenue. Réessayez.", created: "Enregistré.", confirmDelete: "Supprimer cet élément ?",
    logbookTitle: "Carnet numérique", logbookSub: "Conservez chaque plongée et souvenir au même endroit.", logbookVisibility: "Visibilité du carnet", noDives: "Aucune plongée enregistrée.",
    planTitle: "Plongées futures", planSub: "Planifiez une plongée et choisissez qui peut la voir.", noPlans: "Aucune plongée future planifiée.",
    friendsTitle: "Connexions de plongée", friendsSub: "Trouvez un plongeur par pseudo ou identifiant.", requests: "Demandes d’amis", myFriends: "Mes amis", sent: "Demandes envoyées", accept: "Accepter", decline: "Refuser", connect: "Ajouter", remove: "Supprimer l’ami", viewProfile: "Voir le profil", noFriends: "Votre cercle de plongée commence ici.",
    mapTitle: "Carte mondiale", mapSub: "Vos plongées, celles des amis, les sites et épaves jusqu’à 60 m.", activity: "Activité", catalogue: "Sites et épaves", wrecks: "Épaves", sites: "Sites de plongée", tapMarker: "Touchez un marqueur pour les détails.",
    reviewTitle: "Avis de sites", reviewSub: "Choisissez un site existant ou enregistrez un lieu précis.", rating: "Note", comment: "Avis", publish: "Publier", siteName: "Nom du site", existingSite: "Site existant", nearby: "Sites proches ou similaires", duplicate: "Ce site existe peut-être déjà. Choisissez-le ou confirmez la création.", createAnyway: "Créer quand même un nouveau site", noReviews: "Vous n’avez pas encore noté de site.",
    profileTitle: "Profil plongeur", profileSub: "Contrôlez votre identité publique et votre confidentialité.", birthDate: "Date de naissance", bio: "Biographie", avatar: "Photo de profil", profileVisibility: "Visibilité du profil", defaultLanguage: "Langue par défaut", signOut: "Se déconnecter", saved: "Profil mis à jour.", hiddenProfile: "Ce plongeur garde son profil privé.", joined: "Inscrit", age: "ans",
    adminTitle: "Administration", users: "Utilisateurs", changeLog: "Journal des sites", source: "Source", reviewCount: "avis",
  },
  es: {
    overview: "Resumen", logbook: "Diario", friends: "Amigos", map: "Mapa", more: "Más",
    planning: "Planificación", reviews: "Reseñas", profile: "Mi perfil", admin: "Administración",
    login: "Iniciar sesión", register: "Crear cuenta", email: "Correo", password: "Contraseña", firstName: "Nombre", lastName: "Apellido", username: "Usuario", language: "Idioma", googleSoon: "Inicio con Google — próximamente", welcome: "Tu vida de buceo, en todas partes.", memberId: "ID de miembro", usernameTaken: "Este usuario ya está en uso.", emailTaken: "Este correo ya está registrado.", invalidCredentials: "Correo o contraseña incorrectos.",
    dashboardTitle: "¿Listo para la próxima inmersión?", dashboardSub: "Tu diario, amigos y viajes de un vistazo.", pending: "pendientes", completed: "inmersiones", upcoming: "próximas", world: "Tu mundo submarino",
    add: "Añadir", save: "Guardar", cancel: "Cancelar", delete: "Eliminar", edit: "Editar", close: "Cerrar", search: "Buscar", loading: "Cargando…", empty: "Nada por ahora.", public: "Público", private: "Privado", visibility: "Visibilidad", details: "Detalles", date: "Fecha", startDate: "Fecha inicial", endDate: "Fecha final", site: "Sitio de buceo", depth: "Profundidad (m)", duration: "Duración (min)", groupCount: "Número de inmersiones idénticas", photos: "Fotos", choosePhotos: "Elegir fotos", location: "Ubicación", useLocation: "Usar mi GPS", findPlace: "Buscar un sitio, ciudad o dirección", selected: "Seleccionado", error: "Algo salió mal. Inténtalo de nuevo.", created: "Guardado.", confirmDelete: "¿Eliminar este elemento?",
    logbookTitle: "Diario digital", logbookSub: "Guarda cada inmersión y recuerdo en un solo lugar.", logbookVisibility: "Visibilidad del diario", noDives: "Aún no hay inmersiones.",
    planTitle: "Próximas inmersiones", planSub: "Planifica una inmersión y decide quién puede verla.", noPlans: "No hay inmersiones futuras.",
    friendsTitle: "Conexiones de buceo", friendsSub: "Encuentra buceadores por usuario o ID.", requests: "Solicitudes de amistad", myFriends: "Mis amigos", sent: "Solicitudes enviadas", accept: "Aceptar", decline: "Rechazar", connect: "Conectar", remove: "Eliminar amigo", viewProfile: "Ver perfil", noFriends: "Tu círculo de buceo comienza aquí.",
    mapTitle: "Mapa mundial", mapSub: "Tus inmersiones, actividad de amigos, sitios y pecios hasta 60 m.", activity: "Actividad", catalogue: "Sitios y pecios", wrecks: "Pecios", sites: "Sitios de buceo", tapMarker: "Toca un marcador para ver los detalles.",
    reviewTitle: "Reseñas de sitios", reviewSub: "Elige un sitio existente o registra una ubicación precisa.", rating: "Valoración", comment: "Reseña", publish: "Publicar", siteName: "Nombre del sitio", existingSite: "Sitio existente", nearby: "Sitios cercanos o similares", duplicate: "Es posible que el sitio ya exista. Elígelo o confirma la creación.", createAnyway: "Crear un sitio nuevo", noReviews: "Todavía no has valorado ningún sitio.",
    profileTitle: "Perfil de buceo", profileSub: "Controla tu identidad pública y privacidad.", birthDate: "Fecha de nacimiento", bio: "Biografía", avatar: "Foto de perfil", profileVisibility: "Visibilidad del perfil", defaultLanguage: "Idioma predeterminado", signOut: "Cerrar sesión", saved: "Perfil actualizado.", hiddenProfile: "Este buceador mantiene su perfil privado.", joined: "Miembro desde", age: "años",
    adminTitle: "Administración", users: "Usuarios", changeLog: "Registro de sitios", source: "Fuente", reviewCount: "reseñas",
  },
} as const;

type StringKey = keyof typeof strings.en;
type LanguageValue = { locale: Locale; setLocale: (locale: Locale) => void; t: (key: StringKey) => string };
const LanguageContext = createContext<LanguageValue | null>(null);

export function LanguageProvider({ children }: React.PropsWithChildren) {
  const [locale, setLocaleState] = useState<Locale>("fr");
  useEffect(() => { AsyncStorage.getItem("bluemates.locale").then((value) => { if (value === "en" || value === "fr" || value === "es") setLocaleState(value); }); }, []);
  const setLocale = useCallback((value: Locale) => { setLocaleState(value); void AsyncStorage.setItem("bluemates.locale", value); }, []);
  const value = useMemo(() => ({ locale, setLocale, t: (key: StringKey) => strings[locale][key] }), [locale, setLocale]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("LanguageProvider missing");
  return value;
}
