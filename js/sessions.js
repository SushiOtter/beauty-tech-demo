// La gestión de sesión se ejecuta desde events.js para mantener centralizados los eventos.
// Este módulo queda reservado para la ampliación de políticas de sesión y sensores físicos.
export const SESSION_CONTRACT = Object.freeze({ entryEvent: "entry", endEvent: "session-end" });
