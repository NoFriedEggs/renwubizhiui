
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { QuadrantId, AIAnalysisResult, AppSettings } from "../types";

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    quadrant: {
      type: Type.STRING,
      enum: [QuadrantId.DoFirst, QuadrantId.Schedule, QuadrantId.Delegate, QuadrantId.Delete],
      description: "艾森豪威尔矩阵的象限 ID"
    },
    reasoning: {
      type: Type.STRING,
      description: "用简体中文简短解释为什么（10个字以内）。"
    },
    subtasks: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "如果任务复杂，建议最多3个子任务（用简体中文）。如果简单，返回空数组。"
    }
  },
  required: ["quadrant", "reasoning", "subtasks"]
};

export const analyzeTaskWithGemini = async (taskDescription: string, settings?: AppSettings): Promise<AIAnalysisResult> => {
  try {
    // 优先使用用户设置的 Key，否则回退到环境变量
    const apiKey = settings?.apiKey || process.env.API_KEY;
    
    // 如果有 Base URL，配置它
    const clientOptions: any = { apiKey };
    if (settings?.apiBaseUrl) {
      // 注意: @google/genai SDK 的 baseUrl 选项
      // 如果 SDK 版本不支持直接传 baseUrl，通常可以通过 requestOptions 或 transport 层修改
      // 这里假设 SDK 支持或通过 factory 模式支持
      clientOptions.baseUrl = settings.apiBaseUrl;
    }

    // 每次请求重新实例化以支持动态 Key
    const ai = new GoogleGenAI(clientOptions);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `请根据艾森豪威尔矩阵分析此任务："${taskDescription}"。
      
      定义：
      - Do First (q1): 既紧急又重要（危机、截止日期的任务）。
      - Schedule (q2): 重要但不紧急（规划、学习、健康）。
      - Delegate (q3): 紧急但不重要（干扰、某些会议、琐事）。
      - Eliminate (q4): 既不紧急也不重要（浪费时间的事、忙碌的无用功）。
      
      请确保 reasoning 和 subtasks 字段使用简体中文返回。
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.3, 
      },
    });

    const text = response.text;
    if (!text) throw new Error("AI 未响应");

    const result = JSON.parse(text) as AIAnalysisResult;
    return result;

  } catch (error) {
    console.error("Gemini 分析失败:", error);
    // 失败时默认为第二象限
    return {
      quadrant: QuadrantId.Schedule,
      reasoning: "AI 服务暂时不可用，默认为计划列表。",
      subtasks: []
    };
  }
};
