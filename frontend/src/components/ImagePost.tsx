import Link from "next/link";

import "./posts.css";

const ImagePost = ({isMine, author, image, description}: {
  isMine: boolean,
  author: {
    username: string,
    first_name: string,
    last_name: string,
  }
  image: string,
  description: string | null,
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
      <img src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/${image}`} />
      <p>{description || ""}</p>
    </div>
  </div>
}

export default ImagePost;
