// ============================================
// CONFIGURACIÓN INICIAL - SOMMA CON GEMINI
// ============================================

// IMPORTANTE: Reemplaza estos valores con tus datos reales
const CONFIG = {
  SPREADSHEET_ID: '1Ppz7b-lHrgU9eWg5ieaTiIsENZfyY57YdoJW2oZwT-U', // El ID está en la URL de tu hoja
  SHEET_NAME: 'Respuestas de formulario 1', // Nombre de la pestaña en tu hoja
  GEMINI_API_KEY: 'AIzaSyCZ3flRnFRo7dCVrFc2XJVv9FB6vLK-K6Y', // Tu clave de API de Google
  GEMINI_MODEL: 'gemini-1.5-flash', // Modelo más económico y rápido (disponible actualmente)
  // Alternativas de modelo disponibles:
  // 'gemini-1.5-pro' - Más potente pero más caro
  // 'gemini-1.0-pro' - Versión anterior estable
};

// ============================================
// FUNCIÓN PRINCIPAL - MANEJO DE LA APLICACIÓN WEB
// ============================================

function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Somma - Tu Coach Virtual SMART')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ============================================
// PROCESAMIENTO DE META CON IA
// ============================================

function procesarMeta(datosFormulario) {
  try {
    const { nombre, matricula, metaOriginal } = datosFormulario;
    
    // Validación básica
    if (!nombre || !matricula || !metaOriginal) {
      throw new Error('Por favor completa todos los campos');
    }
    
    console.log('Procesando meta para:', nombre, matricula);
    
    // Llamar a Gemini para generar la meta SMART
    const metaSMART = generarMetaSMART(metaOriginal, nombre);
    
    // Guardar en Google Sheets
    guardarEnSheets({
      nombre,
      matricula,
      metaOriginal,
      metaSMART
    });
    
    // Retornar la meta SMART generada
    return {
      success: true,
      metaSMART: metaSMART,
      nombre: nombre
    };
    
  } catch (error) {
    console.error('Error en procesarMeta:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

// ============================================
// INTEGRACIÓN CON GEMINI API
// ============================================

function generarMetaSMART(metaOriginal, nombreEstudiante) {
  // Prompt optimizado para Gemini
  const prompt = `# ROL Y OBJETIVO
Actúa como "Somma", un coach virtual experto en la metodología SMART para estudiantes. Tu nombre se inspira en la idea de que los grandes logros son la suma de pequeños pasos. Tu único objetivo es tomar la meta inicial de un estudiante y, a través de un proceso de preguntas simulado, devolverle una meta bien estructurada en un texto único, claro y motivador.

# TONO Y ESTILO
Tu tono es cercano, paciente y sobre todo, empoderador. Utiliza un lenguaje que inspire acción. Formula preguntas socráticas para guiar, nunca des tu opinión ni completes las ideas por el estudiante. Utiliza emojis con moderación para dar calidez 😊💪.

# PRINCIPIO FUNDAMENTAL
Una meta clara + un primer paso que se pueda dar hoy.

# INFORMACIÓN DEL ESTUDIANTE
Nombre: ${nombreEstudiante}
Meta original: "${metaOriginal}"

# INSTRUCCIONES DE FORMATO
Genera una respuesta COMPLETA siguiendo EXACTAMENTE este formato:

1. **SALUDO INICIAL:** 
   Saluda al estudiante por su nombre y preséntate brevemente como Somma.

2. **ANÁLISIS DE LA META (SIMULADO):** 
   Para cada letra de S-M-A-R-T, reformula la meta inicial del estudiante:
   
   🎯 **S - Específico:** Convierte la idea vaga en algo concreto y claro.
   
   📊 **M - Medible:** Propón una forma clara de medir el éxito con números o indicadores.
   
   ✅ **A - Alcanzable:** Evalúa si es realista y sugiere ajustes si es necesario.
   
   💡 **R - Relevante:** Conecta la meta con un "para qué" más grande del estudiante.
   
   🗓️ **T - Con Plazo:** Asigna una fecha límite clara y específica.

3. **PLAN DE ACCIÓN INMEDIATO:**
   
   **Primer Pequeño Paso:** Define una acción súper concreta que pueda hacer en las próximas 24 horas.
   
   **Anticipando Obstáculos:** Identifica un posible obstáculo y un plan simple para superarlo.

4. **RESUMEN FINAL: TU META SOMMA**
   
   📝 **Tu Meta SMART Completa:**
   [Presenta la meta final en una frase clara y poderosa que incluya todos los elementos SMART]
   
   ✓ Checklist de componentes:
   - [ ] Específico: [elemento específico]
   - [ ] Medible: [cómo se medirá]
   - [ ] Alcanzable: [por qué es realista]
   - [ ] Relevante: [conexión con objetivo mayor]
   - [ ] Temporal: [fecha límite]

5. **CIERRE:** 
   Termina con una frase corta de impulso personalizada.

IMPORTANTE: Mantén un tono motivador y empático. Usa ejemplos concretos basados en la meta del estudiante.`;

  try {
    // URL del endpoint de Gemini (v1beta es la versión correcta)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.GEMINI_MODEL}:generateContent?key=${CONFIG.GEMINI_API_KEY}`;
    
    // Configuración de la solicitud
    const payload = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7, // Balance entre creatividad y coherencia
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048, // Suficiente para una respuesta completa
        stopSequences: []
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_NONE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_NONE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_NONE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_NONE"
        }
      ]
    };
    
    const options = {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    // Llamada a la API
    const response = UrlFetchApp.fetch(url, options);
    const responseData = JSON.parse(response.getContentText());
    
    // Manejo de errores de la API
    if (responseData.error) {
      console.error('Error de Gemini API:', responseData.error);
      throw new Error('Error al generar la meta SMART: ' + responseData.error.message);
    }
    
    // Verificar que hay contenido en la respuesta
    if (!responseData.candidates || !responseData.candidates[0] || !responseData.candidates[0].content) {
      console.error('Respuesta inesperada de Gemini:', responseData);
      throw new Error('No se recibió una respuesta válida de Gemini');
    }
    
    // Extraer el texto de la respuesta
    const respuestaTexto = responseData.candidates[0].content.parts[0].text;
    
    // Log para debugging (opcional)
    console.log('Respuesta generada exitosamente, longitud:', respuestaTexto.length);
    
    return respuestaTexto;
    
  } catch (error) {
    console.error('Error llamando a Gemini:', error);
    
    // Respuesta de fallback si Gemini falla
    return `¡Hola ${nombreEstudiante}! Soy Somma 😊

He recibido tu meta: "${metaOriginal}"

Aunque hubo un problema técnico al procesar tu meta completa, aquí te dejo un plan inicial:

**🎯 Tu Plan de Acción Inicial:**
• **Específico:** Define exactamente qué quieres lograr
• **Medible:** Establece cómo medirás tu progreso (números, porcentajes, frecuencia)
• **Alcanzable:** Asegúrate de que sea realista en tu contexto actual
• **Relevante:** Conecta esta meta con tus objetivos académicos o personales más grandes
• **Temporal:** Ponle una fecha límite clara (sugiero empezar con 30 días)

**💪 Primer Paso Hoy:**
Escribe tu meta en una hoja con el mayor detalle posible y compártela con alguien de confianza que pueda apoyarte.

**🚀 Anticipando Obstáculos:**
Si sientes que no tienes tiempo, recuerda: 15 minutos diarios son suficientes para empezar.

¡Cada gran logro es la suma de pequeños pasos consistentes! Tú puedes lograrlo 💪`;
  }
}

// ============================================
// GUARDAR EN GOOGLE SHEETS
// ============================================

function guardarEnSheets(datos) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
                                .getSheetByName(CONFIG.SHEET_NAME);
    
    if (!sheet) {
      throw new Error('No se encontró la hoja especificada. Verifica el nombre.');
    }
    
    // Preparar la fila con los datos
    const marcaTemporal = new Date();
    const fila = [
      marcaTemporal,           // Marca temporal
      datos.nombre,            // Nombre
      datos.matricula,         // Matrícula
      datos.metaOriginal,      // Meta Original
      datos.metaSMART          // Meta SMART (Generada por IA)
    ];
    
    // Agregar la fila al final de la hoja
    sheet.appendRow(fila);
    
    console.log('Datos guardados exitosamente en Sheets');
    
    // Opcional: Trackear el uso para monitoreo de costos
    trackearUso();
    
  } catch (error) {
    console.error('Error guardando en Sheets:', error);
    // No lanzamos el error para que el usuario aún pueda ver su meta SMART
    // aunque falle el guardado en Sheets
  }
}

// ============================================
// TRACKING DE USO (OPCIONAL)
// ============================================

function trackearUso() {
  try {
    // Obtener o crear la hoja de tracking
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    let trackingSheet;
    
    try {
      trackingSheet = spreadsheet.getSheetByName('Tracking_Uso');
    } catch (e) {
      // Si no existe, la creamos
      trackingSheet = spreadsheet.insertSheet('Tracking_Uso');
      trackingSheet.getRange(1, 1, 1, 5).setValues([
        ['Fecha', 'Consultas del Día', 'Tokens Entrada Estimados', 'Tokens Salida Estimados', 'Costo Estimado USD']
      ]);
    }
    
    const hoy = new Date();
    const fechaHoy = Utilities.formatDate(hoy, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    
    // Buscar si ya existe una entrada para hoy
    const data = trackingSheet.getDataRange().getValues();
    let filaHoy = -1;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] && Utilities.formatDate(new Date(data[i][0]), Session.getScriptTimeZone(), 'yyyy-MM-dd') === fechaHoy) {
        filaHoy = i + 1;
        break;
      }
    }
    
    if (filaHoy === -1) {
      // Crear nueva fila para hoy
      const tokensEntrada = 800; // Estimado por consulta
      const tokensSalida = 700; // Estimado por consulta
      // Gemini 1.5 Flash pricing: $0.075 por millón de tokens entrada, $0.30 por millón salida
      const costoEstimado = (tokensEntrada * 0.000000075) + (tokensSalida * 0.0000003); 
      
      trackingSheet.appendRow([
        hoy,
        1,
        tokensEntrada,
        tokensSalida,
        costoEstimado
      ]);
    } else {
      // Actualizar fila existente
      const consultasActuales = trackingSheet.getRange(filaHoy, 2).getValue() || 0;
      const tokensEntradaActuales = trackingSheet.getRange(filaHoy, 3).getValue() || 0;
      const tokensSalidaActuales = trackingSheet.getRange(filaHoy, 4).getValue() || 0;
      
      const nuevosTokensEntrada = 800;
      const nuevosTokensSalida = 700;
      const nuevoCosto = ((tokensEntradaActuales + nuevosTokensEntrada) * 0.000000075) + 
                        ((tokensSalidaActuales + nuevosTokensSalida) * 0.0000003);
      
      trackingSheet.getRange(filaHoy, 2).setValue(consultasActuales + 1);
      trackingSheet.getRange(filaHoy, 3).setValue(tokensEntradaActuales + nuevosTokensEntrada);
      trackingSheet.getRange(filaHoy, 4).setValue(tokensSalidaActuales + nuevosTokensSalida);
      trackingSheet.getRange(filaHoy, 5).setValue(nuevoCosto);
    }
    
  } catch (error) {
    console.log('No se pudo trackear el uso:', error);
    // No es crítico, continuamos sin trackear
  }
}

// ============================================
// FUNCIÓN AUXILIAR PARA CSS
// ============================================

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ============================================
// FUNCIÓN DE PRUEBA (OPCIONAL)
// ============================================

function probarGemini() {
  // Función para probar la conexión con Gemini directamente desde el editor
  const resultado = generarMetaSMART("Quiero mejorar mis calificaciones", "Juan");
  console.log(resultado);
  return resultado;
}

// ============================================
// LISTAR MODELOS DISPONIBLES (DEBUGGING)
// ============================================

function listarModelosDisponibles() {
  // Función útil para ver qué modelos están disponibles con tu API key
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${CONFIG.GEMINI_API_KEY}`;
    const response = UrlFetchApp.fetch(url);
    const data = JSON.parse(response.getContentText());
    
    console.log("Modelos disponibles:");
    data.models.forEach(model => {
      if (model.supportedGenerationMethods.includes('generateContent')) {
        console.log(`- ${model.name} (Soporta generateContent)`);
      }
    });
    
    return data.models;
  } catch (error) {
    console.error("Error listando modelos:", error);
    return null;
  }
}
