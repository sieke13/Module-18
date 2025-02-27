export interface GoogleAPIBook {
  id: string;
  volumeInfo: {
    title: string;
    authors: string[];
    description: string;
    imageLinks?: {
      thumbnail: string;
    };
    infoLink?: string;
    canonicalVolumeLink?: string;
  };
}