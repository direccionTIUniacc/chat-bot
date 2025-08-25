export interface Carrera {
  id: string
  nombre: string
  duracion: string
  modalidad: string
  descripcion: string
  requisitos_especiales?: string[]
  costo_aprox: number
  destacado?: boolean
}

export interface Facultad {
  id: string
  nombre: string
  emoji: string
  carreras: Carrera[]
}

export const FACULTADES_UNIACC: Record<string, Facultad> = {
  artes: {
    id: 'artes',
    nombre: 'Facultad de Artes',
    emoji: '🎭',
    carreras: [
      {
        id: 'teatro',
        nombre: 'Teatro y Comunicación Escénica',
        duracion: '8 semestres',
        modalidad: 'Presencial',
        descripcion: 'Formación integral en artes escénicas con enfoque contemporáneo',
        requisitos_especiales: ['Audición', 'Taller de expresión corporal'],
        costo_aprox: 15500000
      },
      {
        id: 'danza',
        nombre: 'Danza y Coreografía',
        duracion: '8 semestres',
        modalidad: 'Presencial',
        descripcion: 'Danza contemporánea y creación coreográfica',
        requisitos_especiales: ['Audición obligatoria', 'Examen físico'],
        costo_aprox: 15500000
      },
      {
        id: 'musica_interpretacion',
        nombre: 'Música e Interpretación',
        duracion: '8 semestres',
        modalidad: 'Presencial',
        descripcion: 'Formación musical integral para intérpretes',
        requisitos_especiales: ['Audición musical'],
        costo_aprox: 16000000
      },
      {
        id: 'artes_visuales',
        nombre: 'Artes Visuales',
        duracion: '10 semestres',
        modalidad: 'Presencial',
        descripcion: 'Formación artística visual contemporánea',
        requisitos_especiales: ['Portfolio artístico'],
        costo_aprox: 15800000
      }
    ]
  },
  
  comunicaciones: {
    id: 'comunicaciones',
    nombre: 'Facultad de Comunicaciones',
    emoji: '📺',
    carreras: [
      {
        id: 'audiovisual',
        nombre: 'Comunicación Audiovisual',
        duracion: '10 semestres',
        modalidad: 'Presencial',
        descripcion: '🏆 Pioneros en Chile (1981). TV, cine y medios digitales',
        requisitos_especiales: ['Entrevista personal'],
        costo_aprox: 14500000,
        destacado: true
      },
      {
        id: 'periodismo',
        nombre: 'Periodismo',
        duracion: '10 semestres',
        modalidad: 'Presencial/Semipresencial',
        descripcion: 'Formación integral en comunicación periodística',
        costo_aprox: 13500000
      },
      {
        id: 'publicidad',
        nombre: 'Publicidad',
        duracion: '8 semestres',
        modalidad: 'Presencial',
        descripcion: 'Creatividad publicitaria y estrategia comunicacional',
        costo_aprox: 13800000
      }
    ]
  },

  arquitectura_diseno: {
    id: 'arquitectura_diseno',
    nombre: 'Facultad de Arquitectura y Diseño',
    emoji: '🏗️',
    carreras: [
      {
        id: 'arquitectura',
        nombre: 'Arquitectura',
        duracion: '11 semestres',
        modalidad: 'Presencial/Semipresencial',
        descripcion: 'Diseño arquitectónico con enfoque sustentable',
        requisitos_especiales: ['Prueba de habilidades espaciales'],
        costo_aprox: 16500000
      },
      {
        id: 'diseno_interiores',
        nombre: 'Diseño de Interiores y Ambientes',
        duracion: '8 semestres',
        modalidad: 'Presencial/Semipresencial',
        descripcion: 'Diseño de espacios habitables',
        costo_aprox: 14800000
      }
    ]
  },

  ciencias_juridicas: {
    id: 'ciencias_juridicas',
    nombre: 'Facultad de Ciencias Jurídicas y Sociales',
    emoji: '⚖️',
    carreras: [
      {
        id: 'derecho',
        nombre: 'Derecho',
        duracion: '12 semestres',
        modalidad: 'Presencial/Vespertino',
        descripcion: 'Formación jurídica integral',
        costo_aprox: 14000000
      },
      {
        id: 'psicologia',
        nombre: 'Psicología',
        duracion: '12 semestres',
        modalidad: 'Presencial/Semipresencial',
        descripcion: 'Psicología clínica, educacional y organizacional',
        costo_aprox: 13500000
      }
    ]
  },

  negocios_tecnologia: {
    id: 'negocios_tecnologia',
    nombre: 'Facultad de Negocios y Tecnología',
    emoji: '💼',
    carreras: [
      {
        id: 'ingenieria_comercial',
        nombre: 'Ingeniería Comercial',
        duracion: '10 semestres',
        modalidad: 'Presencial/Online',
        descripcion: 'Administración de empresas y negocios',
        costo_aprox: 12000000
      },
      {
        id: 'contador_auditor',
        nombre: 'Contador Auditor',
        duracion: '10 semestres',
        modalidad: 'Presencial/Online',
        descripcion: 'Contabilidad y auditoría empresarial',
        costo_aprox: 11500000
      }
    ]
  }
}

export const BECAS_UNIACC = [
  {
    nombre: 'Beca Mérito Académico',
    descripcion: 'Hasta 50% de descuento para estudiantes del 10% superior',
    descuento: 'Hasta 50%',
    requisitos: ['Top 10% de egreso de enseñanza media', 'Mantener promedio 5.5']
  },
  {
    nombre: 'Beca Apoyo Regional',
    descripcion: 'Descuento para estudiantes de regiones',
    descuento: '15-30%',
    requisitos: ['Residir fuera de RM', 'Documentación de residencia']
  }
]

// Helper functions
export const getFacultadById = (id: string): Facultad | undefined => FACULTADES_UNIACC[id]
export const getCarreraById = (facultadId: string, carreraId: string): Carrera | undefined => {
  const facultad = FACULTADES_UNIACC[facultadId]
  return facultad?.carreras.find(c => c.id === carreraId)
}
