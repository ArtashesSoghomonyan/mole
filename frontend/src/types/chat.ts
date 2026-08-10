export type Participant = {
  id: number;
  username: string;
};

export type Message = {
  id: number;
  content: string;
  sender: number;
  sender_username: string;
  created_at: string;
};

export type Conversation = {
  id: number;
  title: string | null;
  participants: Participant[];
  last_message: Message | null;
  created_at: string;
};
