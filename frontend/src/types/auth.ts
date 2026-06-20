import Post from "@/types/posts";

export type User = {
  id: number,
  username: string,
  email: string,
  first_name: string,
  last_name: string,
  followers_count: number,
  following_count: number,
  profile: {
    avatar: string | null,
    bio: string | null,
  }
}

export type SearchUser = {
  user: {
    username: string,
    first_name: string,
    last_name: string,
    followers_count: number,
    following_count: number,
    is_following: boolean,
    profile: {
      avatar: string | null,
      bio: string | null,
    }
  },
  posts: Post[],
}
