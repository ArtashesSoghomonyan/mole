import Link from "next/link";
import { useRouter } from "next/navigation";

import { DateFormat } from "@/utils";
import "./posts.css";

const TextPost = ({isMine, id, author, content, created_at, updated_at}: {
  isMine: boolean,
  id: number,
  author: {
    username: string,
    first_name: string,
    last_name: string,
    profile_img: string,
  }
  content: string,
  created_at: string,
  updated_at: string | null,
}) => {
  const router = useRouter();

  return <div className="post">
    <div className="post-header">
      <div className="line-1">
        <Link className="author-name" href={`/${author.username}/`}>
          <img src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/${author.profile_img}`} />
          <span>{author.first_name} {author.last_name}</span>
        </Link>
        <div className="options no-select">{isMine && <div>
          <Link href={`/p/${id}/edit/`}>Edit</Link> | <Link href="#">Delete</Link>
        </div>}</div>
      </div>
      <div className="line-2">
        <span>Created {DateFormat(created_at)}</span>
        {updated_at && <span>Updated {DateFormat(updated_at)}</span>}
      </div>
    </div>
    <div className="post-body" onClick={() => router.push(`/p/${id}/`)}>
      <p onClick={e => e.stopPropagation()}>{content}</p>
    </div>
  </div>
}

export default TextPost;
