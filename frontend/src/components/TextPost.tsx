import Link from "next/link";

import "./posts.css";

const TextPost = ({isMine, author, content}: {
  isMine: boolean,
  author: {
    username: string,
    first_name: string,
    last_name: string,
    profile_img: string,
  }
  content: string,
}) => {
  return <div className="post">
    <div className="post-header">
      <Link className="author-name" href={`/${author.username}/`}>
        <img src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/${author.profile_img}`} />
        <span>{author.first_name} {author.last_name}</span>
      </Link>
      <div className="options no-select">{isMine && <div>
        <Link href="#">Edit</Link> | <Link href="#">Delete</Link>
      </div>}</div>
    </div>
    <div className="post-body">
      <p>{content}</p>
    </div>
  </div>
}

export default TextPost;
