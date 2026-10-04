import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function breakdownTask(title: string, description: string, availableUsers: any[]) {
  const prompt = `
    Break down the following task into 3-5 subtasks.
    For each subtask, suggest the best user to assign it to from the list of available users based on their skills and role.
    
    Task Title: ${title}
    Task Description: ${description}
    
    Available Users:
    ${JSON.stringify(availableUsers.map(u => ({ email: u.email, name: u.fullName, role: u.role, skills: u.skills, activeTasks: u.activeTasksCount })))}
    
    Return the result as a JSON array of subtasks.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            assignedTo: { type: Type.STRING, description: "Email of the suggested user" },
            assignedToName: { type: Type.STRING },
            skillsRequired: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["title", "description", "assignedTo", "assignedToName", "skillsRequired"]
        }
      }
    }
  });

  return JSON.parse(response.text);
}
