export const environment = {
  // El front y la API suelen estar en la misma máquina. Usar el hostname actual permite abrir el front
  // desde el celular en la red local (ej. http://192.168.1.20:4200) sin tocar este archivo.
  apiBase: `http://${window.location.hostname}:8000`,
};
