import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || ""
});

type DocumentAnalysisRequest = {
  documentText: string;
  query: string;
};

type DocumentAnalysisResponse = {
  answer: string;
  references: {
    text: string;
    location: string;
  }[];
};

/**
 * Analyzes a document and answers a query using OpenAI's GPT-4o model
 */
export async function analyzeDocumentWithAI(
  request: DocumentAnalysisRequest
): Promise<DocumentAnalysisResponse> {
  try {
    // If API key is not set, return graceful error message
    if (!process.env.OPENAI_API_KEY) {
      console.warn("OPENAI_API_KEY is not set. Using fallback response.");
      return {
        answer: "I'm unable to analyze this document because the OpenAI API key is not configured. Please contact the administrator to set up the API key.",
        references: []
      };
    }

    // Create a prompt that instructs the model how to analyze the document
    const prompt = `
You are an AI assistant specialized in analyzing legal documents. 
Below is the text of a legal document, followed by a user's question about it.

DOCUMENT:
"""
${request.documentText.substring(0, 15000)} // Limiting to prevent token overflow
"""

USER QUESTION: ${request.query}

Provide a helpful, accurate answer based solely on the document content. 
If the document doesn't contain information to answer the question, clearly state that.
In your answer, include direct relevant quotes from the document that support your response.

Respond with a JSON object with the following structure:
{
  "answer": "Your detailed answer to the user's question",
  "references": [
    {
      "text": "Direct quote from the document that supports your answer",
      "location": "Section or paragraph identifier if available"
    }
  ]
}
`;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    // Parse and validate the response
    const responseContent = response.choices[0].message.content;
    
    if (!responseContent) {
      throw new Error("Received empty response from OpenAI");
    }

    try {
      const parsedResponse = JSON.parse(responseContent);
      
      // Validate response structure
      if (!parsedResponse.answer) {
        throw new Error("Missing 'answer' field in response");
      }
      
      if (!Array.isArray(parsedResponse.references)) {
        parsedResponse.references = [];
      }
      
      return {
        answer: parsedResponse.answer,
        references: parsedResponse.references.map((ref: any) => ({
          text: ref.text || "",
          location: ref.location || ""
        }))
      };
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", parseError);
      
      // Fallback - use the raw response as the answer
      return {
        answer: "I encountered an issue formatting my response. Here's what I found: " + responseContent,
        references: []
      };
    }
  } catch (error) {
    console.error("Error in analyzeDocumentWithAI:", error);
    throw error;
  }
}
