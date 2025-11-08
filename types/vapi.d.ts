enum MessageTypeEnum {
  TRANSCRIPT = "transcript",
  FUNCTION_CALL = "function-call",
  FUNCTION_CALL_RESULT = "function-call-result",
  ADD_MESSAGE = "add-message",
}

enum MessageRoleEnum {
  USER = "user",
  SYSTEM = "system",
  ASSISTANT = "assistant",
}

enum TranscriptMessageTypeEnum {
  PARTIAL = "partial",
  FINAL = "final",
}

interface BaseMessage {
  type: MessageTypeEnum;
}

interface TranscriptMessage extends BaseMessage {
  type: MessageTypeEnum.TRANSCRIPT;
  role: MessageRoleEnum;
  transcriptType: TranscriptMessageTypeEnum;
  transcript: string;
}

interface FunctionCallMessage extends BaseMessage {
  type: MessageTypeEnum.FUNCTION_CALL;
  functionCall: {
    name: string;
    parameters: unknown;
  };
  functionCallId?: string;
}

interface FunctionCallResultMessage extends BaseMessage {
  type: MessageTypeEnum.FUNCTION_CALL_RESULT;
  functionCallId: string;
  result: {
    success?: boolean;
    message?: string;
    [key: string]: unknown;
  };
}

type Message =
  | TranscriptMessage
  | FunctionCallMessage
  | FunctionCallResultMessage;
