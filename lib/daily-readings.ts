export interface DailyReading {
  date: string;
  formattedDate: string;
  liturgicalTitle: string;
  firstReading: {
    reference: string;
    text: string;
  };
  psalm: {
    reference: string;
    text: string;
  };
  gospel: {
    reference: string;
    text: string;
  };
  reflection: string;
  prayer: string;
}

export function getTodayReading(): DailyReading {
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );

  const formattedDate = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(now);

  const readingsPool = [
    {
      liturgicalTitle: "Evangelio y Lecturas del Día",
      firstReading: {
        reference: "Isaías 40, 28-31",
        text: "¿Acaso no lo sabes? ¿Es que no lo has oído? El Señor es un Dios eterno, creador de los confines de la tierra. Él da fuerzas al fatigado y multiplica el vigor del que no tiene fuerzas.",
      },
      psalm: {
        reference: "Salmo 23, 1-3",
        text: "El Señor es mi pastor, nada me falta; en verdes praderas me hace recostar, me conduce hacia fuentes tranquilas y repara mis fuerzas.",
      },
      gospel: {
        reference: "Mateo 11, 28-30",
        text: "En aquel tiempo, Jesús dijo: «Venid a mí todos los que estáis cansados y agobiados, y yo os aliviaré. Tomad mi yugo sobre vosotros y aprended de mí, que soy manso y humilde de corazón, y encontraréis descanso para vuestras almas. Porque mi yugo es llevadero y mi carga ligera».",
      },
      reflection: "Jesús conoce el cansancio de nuestras rutinas y las presiones diarias. No nos pide que seamos perfectos, sino que vayamos a Él con el corazón tal como está. Entregarle nuestras cargas no es rendirse, es confiar en que sus manos sostienen nuestro futuro.",
      prayer: "Señor Jesús, hoy me acerco a ti reconociendo que necesito tu paz. Rindo mis preocupaciones y te pido que renueves mis fuerzas para caminar con fe en este día. Amén.",
    },
    {
      liturgicalTitle: "Evangelio y Lecturas del Día",
      firstReading: {
        reference: "Filipenses 4, 6-7",
        text: "No os inquietéis por cosa alguna; antes bien, en toda ocasión, presentad vuestras peticiones a Dios mediante la oración y la súplica, acompañadas de acción de gracias.",
      },
      psalm: {
        reference: "Salmo 27, 1.4",
        text: "El Señor es mi luz y mi salvación, ¿a quién temeré? El Señor es la defensa de mi vida, ¿quién me hará temblar?",
      },
      gospel: {
        reference: "Juan 14, 27",
        text: "En aquel tiempo, Jesús dijo a sus discípulos: «La paz os dejo, mi paz os doy; no os la doy yo como la da el mundo. No se turbe vuestro corazón ni se acobarde».",
      },
      reflection: "La paz que ofrece el mundo depende de que todo a nuestro alrededor esté bajo control. La paz de Cristo, en cambio, permanece en medio de cualquier tormenta. Hoy puedes descansar sabiendo que Dios cuida cada detalle de tu vida.",
      prayer: "Padre Celestial, llena mi corazón con la paz que sobrepasa todo entendimiento. Aleja el miedo de mi mente y ayúdame a confiar plenamente en tus promesas. Amén.",
    },
    {
      liturgicalTitle: "Evangelio y Lecturas del Día",
      firstReading: {
        reference: "Jeremías 29, 11-13",
        text: "Porque yo sé los planes que tengo para vosotros —oráculo del Señor—, planes de bienestar y no de calamidad, para daros un futuro y una esperanza.",
      },
      psalm: {
        reference: "Salmo 139, 1-5",
        text: "Señor, tú me sondeas y me conoces; me conoces cuando me siento o me levanto, de lejos percibes mis pensamientos.",
      },
      gospel: {
        reference: "Juan 15, 4-5",
        text: "Permaneced en mí, como yo en vosotros. Como el sarmiento no puede dar fruto por sí mismo si no permanece en la vid, así tampoco vosotros si no permanecéis en mí. Yo soy la vid, vosotros los sarmientos.",
      },
      reflection: "No estamos llamados a caminar solos ni a adivinar el futuro. Dios ya ha diseñado un propósito valioso para tu vida. Al permanecer unidos a Él mediante la oración diaria, sus frutos de amor, alegría y sabiduría comienzan a fluir de manera natural.",
      prayer: "Espíritu Santo, ayúdame a permanecer unido a Cristo en cada decisión de hoy. Guía mis pasos y muéstrame el propósito que tienes preparado para mí. Amén.",
    }
  ];

  const selectedReading = readingsPool[dayOfYear % readingsPool.length];

  return {
    date: now.toISOString().split("T")[0],
    formattedDate: formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1),
    ...selectedReading,
  };
}