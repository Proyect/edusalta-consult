export interface Resolution {
  id: string;
  title: string;
  date: string;
  downloads: string;
  downloadUrl: string;
  pdfUrl: string;
}

export interface Message {
  role: "user" | "model";
  text: string;
}
