module.exports = {
  Admins: ["UserID", "UserID"], // Admins of the bot, I don't know what this do. -Darren.
  ExpressServer: true, // Si querías que el sitio web funcionara o no
  DefaultPrefix: process.env.Prefix || ">", // Prefijo predeterminado, los administradores del servidor pueden cambiar el prefijo
  Port: 3000, //¿Qué puerto web se alojará?
  SupportServer: "https://discord.gg/YTRGQu5rQB", // Enlace del servidor de soporte
  Token: process.env.Token || "", // Token de Discord
  ClientID: process.env.Discord_ClientID || "", // Discord Client ID
  ClientSecret: process.env.Discord_ClientSecret || "", // Discord Client Secret
  Scopes: ["identify", "guilds", "applications.commands"], // Discord OAuth2 Scopes
  ServerDeafen: true, // Si quieres que el robot se quede ensordecido.
  DefaultVolume: 100, // Establece el volumen predeterminado del bot. Puede cambiar este número en cualquier lugar desde 1 a 9007199254740991 (límite de enteros JS. Si lo configuras así, eres un monstruo).
  CallbackURL: "/api/callback", // URL de devolución de llamada de la API de Discord. No lo toques si no sabes lo que estás haciendo. Todo lo que necesita cambiar para que el sitio web funcione es en la línea 20.
  "24/7": false, // Haga que el bot permanezca en VC las 24 horas del día, los 7 días de la semana (cuando reinicie, el bot **no** volverá a unirse automáticamente).
  CookieSecret: "El Chema", // Una galleta para ti, galleta para mí. ¡Asegúrate de cambiar este valor!
  IconURL:
    "https://raw.githubusercontent.com/ElChema-Nc/Discord-Bot/master/assets/logo.gif", // URL de todos los iconos de autor insertados | No edite a menos que no necesite ese CD de música Spining
  EmbedColor: "RANDOM", // Color de la mayoría de las incrustaciones | Se admiten valores hexadecimales personalizados. Es decir: "#36393F"
  Permissions: 2205281600, // Permisos de invitación de bots
  Website: process.env.Website || "https://example.com", // El sitio web donde está alojado incluye http o https || Utilice "0.0.0.0" si utiliza Heroku || No incluya /api/callback. Solo la URL del sitio web. Es decir. "https://foo.bar"
  // Si obtiene un oauth no válido, asegúrese de que en la página del desarrollador de Discord configure la URL de oauth en algo como: https://example.com/api/callback.

  Presence: {
    status: "online", // Puede mostrar en línea, inactivo y dnd
    name: "Music", // El mensaje mostrado
    type: "LISTENING", // JUGAR, VER, ESCUCHAR, TRANSMITIR
  },

  // ¡¡¡Necesitas un servidor lavalink para que este bot funcione!!!
  // Servidor Lavalink; enlace de lava público -> https://lavalink-list.darrennathanael.com/; cree uno usted mismo -> https://darrennathanael.com/post/how-to-lavalink
  Lavalink: {
    id: "Main", //- Utilizado para identificador. Puedes configurar esto como quieras.
    host: "", //- El nombre de host o IP del servidor lavalink.
    port: 443, // El puerto que está escuchando lavalink. ¡Esto debe ser un número!
    pass: "", //- La contraseña del servidor lavalink.
    secure: false, // Establezca esto en verdadero si lavalink usa SSL. si no, configúrelo en falso.
    retryAmount: 200, //- La cantidad de veces que se debe reintentar conectarse al nodo si la conexión se interrumpió.
    retryDelay: 40, //- Retraso entre intentos de reconexión si se pierde la conexión.
  },
  // Integración de Spotify, te permite ingresar un enlace de Spotify.
  Spotify: {
    ClientID: process.env.Spotify_ClientID || "", // Spotify Client ID
    ClientSecret: process.env.Spotify_ClientSecret || "", // Spotify Client Secret
  },
};
