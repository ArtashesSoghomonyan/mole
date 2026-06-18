export type User = {
  id: number,
  username: string,
  email: string,
  first_name: string,
  last_name: string,
  profile: {
    avatar: string | null,
    bio: string | null,
  }
}

export type SearchUser = {
  username: string,
  first_name: string,
  last_name: string,
  profile: {
    avatar: string | null,
    bio: string | null,
  }
}
