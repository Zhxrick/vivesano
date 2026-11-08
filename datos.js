// Datos de ejemplo del prototipo ViveSano (simulan lo que entregaría la API)
const CATEGORIAS = {
  alimentacion: { nombre: "Alimentación", color: "#2E7D5B", claro: "#E3F2EA" },
  actividad:    { nombre: "Actividad física", color: "#D9822B", claro: "#FCEEDD" },
  descanso:     { nombre: "Descanso", color: "#4A6FA5", claro: "#E4ECF7" },
  bienestar:    { nombre: "Bienestar", color: "#8661B5", claro: "#EFE8F8" }
};

const OBJETIVOS = {
  peso: "Controlar mi peso",
  energia: "Tener más energía",
  dormir: "Dormir mejor",
  estres: "Reducir el estrés"
};

const RECOMENDACIONES = [
  { id: 1, cat: "alimentacion", titulo: "Desayuno balanceado en 10 minutos", resumen: "Combina proteína, fruta y un cereal integral para empezar el día con energía.", tiempo: 10, nivel: "Básico", objetivos: ["energia", "peso"], restricciones: [], autor: "Equipo de nutrición ViveSano", pasos: ["Elige una proteína: huevo, yogur natural o queso bajo en grasa.", "Agrega una porción de fruta entera en lugar de jugo.", "Suma un cereal integral como avena o pan integral.", "Acompaña con agua o una bebida sin azúcar añadida."], publicado: true },
  { id: 2, cat: "alimentacion", titulo: "Plato saludable: la regla de la mitad", resumen: "Llena la mitad del plato con verduras y reparte el resto entre proteína y carbohidrato.", tiempo: 5, nivel: "Básico", objetivos: ["peso"], restricciones: [], autor: "Equipo de nutrición ViveSano", pasos: ["Divide mentalmente tu plato en dos mitades.", "Una mitad para verduras de varios colores.", "Un cuarto para proteína (pollo, pescado, leguminosas).", "Un cuarto para carbohidratos, preferiblemente integrales."], publicado: true },
  { id: 3, cat: "alimentacion", titulo: "Snacks sin gluten para la tarde", resumen: "Ideas fáciles de meriendas para personas con intolerancia al gluten.", tiempo: 5, nivel: "Básico", objetivos: ["energia"], restricciones: ["gluten"], autor: "Equipo de nutrición ViveSano", pasos: ["Fruta picada con un puñado de nueces.", "Yogur natural con semillas.", "Palitos de zanahoria con hummus.", "Revisa siempre la etiqueta de los productos empacados."], publicado: true },
  { id: 4, cat: "alimentacion", titulo: "Hidratación: cuánta agua tomar al día", resumen: "Consejos prácticos para mantenerte hidratado sin depender de bebidas azucaradas.", tiempo: 3, nivel: "Básico", objetivos: ["energia", "peso"], restricciones: [], autor: "Equipo de nutrición ViveSano", pasos: ["Lleva contigo una botella reutilizable.", "Toma un vaso de agua al despertar.", "Aumenta el consumo si haces ejercicio o hace calor.", "Usa recordatorios en el celular si se te olvida."], publicado: true },
  { id: 5, cat: "actividad", titulo: "Caminata activa de 30 minutos", resumen: "Una rutina sencilla para sumar movimiento a tu día sin equipo especial.", tiempo: 30, nivel: "Básico", objetivos: ["peso", "energia", "estres"], restricciones: [], autor: "Equipo de actividad física ViveSano", pasos: ["Calienta 5 minutos caminando a ritmo suave.", "Camina 20 minutos a paso rápido (puedes hablar pero no cantar).", "Baja el ritmo los últimos 5 minutos.", "Estira piernas y espalda al terminar."], publicado: true },
  { id: 6, cat: "actividad", titulo: "Pausas activas para la oficina", resumen: "Ejercicios de 5 minutos para hacer frente al computador.", tiempo: 5, nivel: "Básico", objetivos: ["estres", "energia"], restricciones: [], autor: "Equipo de actividad física ViveSano", pasos: ["Gira el cuello lentamente hacia ambos lados.", "Sube y baja los hombros 10 veces.", "Ponte de pie y estira los brazos hacia arriba.", "Camina un minuto por el lugar."], publicado: true },
  { id: 7, cat: "actividad", titulo: "Rutina de fuerza en casa", resumen: "Sentadillas, flexiones y plancha para principiantes, 3 veces por semana.", tiempo: 20, nivel: "Intermedio", objetivos: ["peso", "energia"], restricciones: [], autor: "Equipo de actividad física ViveSano", pasos: ["3 series de 12 sentadillas.", "3 series de 8 flexiones (puedes apoyar rodillas).", "3 planchas de 20 segundos.", "Descansa 1 minuto entre series."], publicado: true },
  { id: 8, cat: "descanso", titulo: "Rutina para dormir mejor", resumen: "Hábitos de la noche que ayudan a conciliar el sueño más rápido.", tiempo: 15, nivel: "Básico", objetivos: ["dormir", "estres"], restricciones: [], autor: "Equipo de bienestar ViveSano", pasos: ["Acuéstate y levántate a la misma hora todos los días.", "Evita pantallas 30 minutos antes de dormir.", "Mantén la habitación oscura y fresca.", "Evita el café después de las 3 p. m."], publicado: true },
  { id: 9, cat: "descanso", titulo: "Siesta corta y efectiva", resumen: "Cómo tomar una siesta de 20 minutos sin afectar el sueño de la noche.", tiempo: 20, nivel: "Básico", objetivos: ["energia", "dormir"], restricciones: [], autor: "Equipo de bienestar ViveSano", pasos: ["Hazla antes de las 3 p. m.", "Pon una alarma de 20 minutos.", "Busca un lugar tranquilo y con poca luz.", "Al despertar, toma agua y muévete un poco."], publicado: true },
  { id: 10, cat: "bienestar", titulo: "Respiración 4-7-8 para el estrés", resumen: "Técnica de respiración de dos minutos para calmarte en momentos de tensión.", tiempo: 2, nivel: "Básico", objetivos: ["estres", "dormir"], restricciones: [], autor: "Equipo de bienestar ViveSano", pasos: ["Inhala por la nariz contando hasta 4.", "Sostén el aire contando hasta 7.", "Exhala por la boca contando hasta 8.", "Repite el ciclo 4 veces."], publicado: true },
  { id: 11, cat: "bienestar", titulo: "Diario de gratitud", resumen: "Escribir tres cosas buenas del día ayuda a mejorar el estado de ánimo.", tiempo: 5, nivel: "Básico", objetivos: ["estres"], restricciones: [], autor: "Equipo de bienestar ViveSano", pasos: ["Ten una libreta o nota en el celular.", "Cada noche escribe tres cosas buenas del día.", "Sé específico: qué pasó y por qué te gustó.", "Relee tus notas los fines de semana."], publicado: true },
  { id: 12, cat: "bienestar", titulo: "Desconexión digital de fin de semana", resumen: "Reduce el tiempo en redes sociales y recupera espacio para ti.", tiempo: 60, nivel: "Intermedio", objetivos: ["estres", "dormir"], restricciones: [], autor: "Equipo de bienestar ViveSano", pasos: ["Define un horario sin celular (por ejemplo, 2 horas).", "Silencia notificaciones que no sean urgentes.", "Planea una actividad al aire libre.", "Cuenta cómo te sentiste en tu seguimiento de hábitos."], publicado: false }
];

const HABITOS_BASE = [
  { id: "agua", nombre: "Tomar 8 vasos de agua", cat: "alimentacion" },
  { id: "caminar", nombre: "Caminar 30 minutos", cat: "actividad" },
  { id: "dormir", nombre: "Dormir 7 horas o más", cat: "descanso" },
  { id: "respirar", nombre: "Respiración 4-7-8", cat: "bienestar" }
];
