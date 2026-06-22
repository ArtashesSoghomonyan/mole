export type ImagePost = {
  id: number,
  post: number,
  image: string,
  description: string | null,
}

export type TextPost = {
  id: number,
  post: number,
  content: string,
}

export type Post = {
  id: number,
  author: {
    username: string,
    first_name: string,
    last_name: string,
    profile: {
      avatar: string,
      bio: string,
    },
    followers_count: number,
    following_count: number,
    is_following: boolean,
  },
  post_type: "text" | "image",
  content: {
    id: number,
    post: number,
    content: string,
    image: string,
    description: string | null,
  },
  likes_count: number,
  is_liked: boolean,
  created_at: string,
  updated_at: string | null,
}


export type Comment = {
  id: number;
  author: {
    username: string;
    first_name: string;
    last_name: string;
    profile_img: string;
  };
  text: string;
  created_at: string;
  replies?: Comment[];
};
