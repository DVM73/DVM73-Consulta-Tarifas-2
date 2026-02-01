
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

// Inicialización estricta según las directrices de la plataforma.
// Asumimos que process.env.API_KEY está disponible y es válida.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

let chatSession: Chat | null = null;

/**
 * Inicia o reinicia la sesión de chat con el contexto proporcionado.
 */
export async function startNewChat(contextData: string = ""): Promise<void> {
    const systemInstruction = `
Eres Gemini, un asistente de inteligencia artificial integrado en la aplicación corporativa "Consulta de Tarifas".

TU COMPORTAMIENTO DEBE SER:
1. **Idioma:** DEBES RESPONDER SIEMPRE EN ESPAÑOL.
2. **Rol:** Asistente profesional, servicial y experto en los datos de la empresa.
3. **Contexto:** A continuación tienes los datos que el usuario está viendo en pantalla. Úsalos para responder preguntas sobre precios, productos o existencias.

CONTEXTO DE DATOS ACTUAL:
${contextData ? contextData.substring(0, 50000) : "El usuario no está visualizando datos específicos ahora mismo."}
    `;

    try {
        // Intentamos crear el chat con el modelo principal
        chatSession = ai.chats.create({
            model: 'gemini-3-flash-preview',
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.7,
            },
        });
        console.log("✅ Sesión de chat IA iniciada correctamente.");
    } catch (error) {
        console.error("❌ Error al iniciar sesión de chat:", error);
        chatSession = null;
    }
}

/**
 * Envía un mensaje al bot y obtiene la respuesta.
 */
export async function getBotResponse(message: string): Promise<string> {
    try {
        // Si la sesión se perdió (por recarga o error previo), intentamos recuperarla
        if (!chatSession) {
            await startNewChat();
        }

        if (!chatSession) {
            return "Lo siento, no puedo conectar con el servicio de IA en este momento. Por favor, verifica tu configuración.";
        }

        const result: GenerateContentResponse = await chatSession.sendMessage({ message: message });
        
        if (result && result.text) {
            return result.text;
        } else {
            return "No he podido generar una respuesta. Inténtalo de nuevo.";
        }

    } catch (error: any) {
        console.error("Error en getBotResponse:", error);
        
        // Invalidamos la sesión para forzar reinicio en el siguiente intento
        chatSession = null;

        if (error.message && error.message.includes('API key')) {
            return "Error de configuración: La API Key no es válida o no se ha encontrado.";
        }
        
        return "Ha ocurrido un error al procesar tu solicitud. Inténtalo de nuevo en unos segundos.";
    }
}
