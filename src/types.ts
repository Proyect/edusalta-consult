export interface Resolution {
  id: string;
  title: string;
  date: string;
  downloads: string;
  downloadUrl: string;
  pdfUrl: string;
  isFavorite?: boolean;
}

export interface Form {
  title: string;
  desc: string;
  url: string;
  verified?: boolean;
  category?: string;
  isFavorite?: boolean;
}

export interface Message {
  role: "user" | "model";
  text: string;
}
