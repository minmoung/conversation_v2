// 대화 타입 정의
export interface Dialogue {
    id: string;
    teacherLine: string;
    studentLine: string;
  }
  
  // 레슨 콘텐츠 타입 정의
  export interface LessonContent {
    id: string;
    title: string;
    dialogues: Dialogue[];
    teacherCharacter: string;
    audioUrl?: string;
  }