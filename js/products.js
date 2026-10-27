// Punto de extensión para carga y validación de contenido de producto.
// Los textos de las estaciones proceden de data/contenido.json; no se duplican aquí.
export function validateStation(station) {
 return Boolean(station && station.id && station.name && station.headline && Array.isArray(station.tags));
}

export const ageProfiles = Object.freeze({
  "18-29": Object.freeze({
    label: "18–29 años",
    products: ["Limpieza suave", "Hidratante ligera", "Protector solar SPF 30+", "Bálsamo labial"]
  }),
  "30-44": Object.freeze({
    label: "30–44 años",
    products: ["Limpiador facial", "Sérum hidratante", "Hidratante para la barrera cutánea", "Protector solar SPF 30+"]
  }),
  "45-59": Object.freeze({
    label: "45–59 años",
    products: ["Sérum hidratante", "Crema nutritiva", "Protector solar SPF 30+", "Mascarilla capilar nutritiva"]
  }),
  "60+": Object.freeze({
    label: "60 años o más",
    products: ["Limpiador suave", "Hidratante confortable", "Protector solar SPF 30+", "Bálsamo labial hidratante"]
  }),
  all: Object.freeze({
    label: "Todas las edades",
    products: ["Limpieza suave", "Hidratación confortable", "Protección solar diaria"]
  })
});

export function getAgeRange(age) {
  if (!Number.isFinite(age) || age < 0) return null;
  if (age < 18) return "all";
  if (age < 30) return "18-29";
  if (age < 45) return "30-44";
  if (age < 60) return "45-59";
  return "60+";
}

export function getAgeProfile(range) {
  return ageProfiles[range] || ageProfiles.all;
}
